import { AdAccount, Campaign, FacebookAdsApi } from "facebook-nodejs-business-sdk";
import { Duration, Effect, Schedule } from "effect";
import type { GetInsightsInput, InsightsResult, InsightsData, CampaignInfo } from "../types.js";
import { MetaApiError, MetaRateLimitError, TimeoutError, MetaConfig, DEFAULT_INSIGHTS_FIELDS } from "../types.js";

const REQUEST_TIMEOUT = Duration.seconds(60);
const MAX_RETRIES = 3;

/**
 * Type guard for Meta API errors
 */
interface MetaError extends Error {
  response?: {
    error?: {
      message?: string;
      code?: number;
      error_subcode?: number;
    };
  };
}

const isMetaError = (error: unknown): error is MetaError =>
  error instanceof Error && "response" in error;

/**
 * Retry schedule with exponential backoff and jitter
 */
const retrySchedule = Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES))
);

/**
 * Check if an error is retryable (transient)
 */
const isRetryableError = (error: MetaApiError): boolean => {
  const code = error.code;
  if (!code) return true;
  // Retry on server errors and rate limits
  return code >= 500 || code === 1 || code === 2 || code === 4 || code === 17;
};

/**
 * Extract error details from Meta API errors
 */
const extractMetaError = (error: unknown): MetaApiError | MetaRateLimitError => {
  if (isMetaError(error)) {
    const apiError = error.response?.error;

    // Handle rate limiting (code 4, 17, or 32)
    if (apiError?.code === 4 || apiError?.code === 17 || apiError?.code === 32) {
      return new MetaRateLimitError({
        message: apiError?.message || "Meta API rate limit exceeded",
        retryAfter: 60,
      });
    }

    return new MetaApiError({
      message: apiError?.message || error.message,
      code: apiError?.code,
      subcode: apiError?.error_subcode,
      cause: error,
    });
  }

  return new MetaApiError({
    message: error instanceof Error ? error.message : "Unknown Meta API error",
    cause: error,
  });
};

/**
 * Wrap Meta API call with timeout, error handling, and retry
 */
const withApiResilience = <T>(
  effect: Effect.Effect<T, MetaApiError | MetaRateLimitError, never>,
  spanName: string,
  attributes: Record<string, string | number>
): Effect.Effect<T, MetaApiError | MetaRateLimitError | TimeoutError> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "Meta API request timed out",
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "MetaApiError" && isRetryableError(error),
    })
  );

/**
 * MetaAdsClient service interface
 */
export class MetaAdsClient extends Effect.Service<MetaAdsClient>()("MetaAdsClient", {
  effect: Effect.gen(function* () {
    const config = yield* MetaConfig;

    // Initialize the SDK
    FacebookAdsApi.init(config.accessToken);

    const defaultAdAccountId = config.adAccountId;

    return {
      /**
       * Check if access token is configured
       */
      hasAccessToken: (): boolean => config.accessToken !== "",

      /**
       * Get the default ad account ID
       */
      getDefaultAdAccountId: (): string => defaultAdAccountId,

      /**
       * Get insights for campaigns, ad sets, or ads
       */
      getInsights: (
        input: GetInsightsInput
      ): Effect.Effect<InsightsResult, MetaApiError | MetaRateLimitError | TimeoutError> => {
        const adAccountId = input.adAccountId || defaultAdAccountId;
        const level = input.level || "campaign";

        // Start with requested fields or defaults
        let fields = input.fields ? [...input.fields] : [...DEFAULT_INSIGHTS_FIELDS];

        // Ensure dimension fields are included based on level
        const dimensionFields: string[] = [];
        if (level === "campaign" || level === "adset" || level === "ad") {
          if (!fields.includes("campaign_id")) dimensionFields.push("campaign_id");
          if (!fields.includes("campaign_name")) dimensionFields.push("campaign_name");
        }
        if (level === "adset" || level === "ad") {
          if (!fields.includes("adset_id")) dimensionFields.push("adset_id");
          if (!fields.includes("adset_name")) dimensionFields.push("adset_name");
        }
        if (level === "ad") {
          if (!fields.includes("ad_id")) dimensionFields.push("ad_id");
          if (!fields.includes("ad_name")) dimensionFields.push("ad_name");
        }

        // Prepend dimension fields so they appear first in results
        fields = [...dimensionFields, ...fields];

        return withApiResilience(
          Effect.tryPromise({
            try: async () => {
              const account = new AdAccount(adAccountId);

            const params: Record<string, unknown> = {
              level,
              limit: input.limit || 50,
            };

            // Add date range
            if (input.datePreset) {
              params.date_preset = input.datePreset;
            } else if (input.timeRange) {
              params.time_range = {
                since: input.timeRange.since,
                until: input.timeRange.until,
              };
            } else {
              // Default to last 7 days
              params.date_preset = "last_7d";
            }

            // Add campaign filter if specified
            if (input.campaignIds && input.campaignIds.length > 0) {
              params.filtering = [
                {
                  field: "campaign.id",
                  operator: "IN",
                  value: input.campaignIds,
                },
              ];
            }

            const insights = await account.getInsights([...fields], params);

            // Transform the response
            const data: InsightsData[] = insights.map((item) => ({
              campaign_id: item.campaign_id as string | undefined,
              campaign_name: item.campaign_name as string | undefined,
              adset_id: item.adset_id as string | undefined,
              adset_name: item.adset_name as string | undefined,
              ad_id: item.ad_id as string | undefined,
              ad_name: item.ad_name as string | undefined,
              date_start: item.date_start as string,
              date_stop: item.date_stop as string,
              spend: item.spend as string | undefined,
              impressions: item.impressions as string | undefined,
              clicks: item.clicks as string | undefined,
              reach: item.reach as string | undefined,
              ctr: item.ctr as string | undefined,
              cpc: item.cpc as string | undefined,
              cpm: item.cpm as string | undefined,
              cpp: item.cpp as string | undefined,
              frequency: item.frequency as string | undefined,
              actions: item.actions as unknown[] | undefined,
              action_values: item.action_values as unknown[] | undefined,
              purchase_roas: item.purchase_roas as unknown[] | undefined,
            }));

            return {
              data,
              paging: insights._paging,
            } as InsightsResult;
            },
            catch: (error) => extractMetaError(error),
          }),
          "meta.getInsights",
          {
            "meta.adAccountId": adAccountId,
            "meta.level": level,
            "meta.fields": fields.length,
          }
        ).pipe(Effect.withSpan("MetaAdsClient.getInsights"));
      },

      /**
       * Get campaigns for an ad account
       */
      getCampaigns: (
        adAccountId?: string,
        limit?: number
      ): Effect.Effect<CampaignInfo[], MetaApiError | MetaRateLimitError | TimeoutError> => {
        const accountId = adAccountId || defaultAdAccountId;

        return withApiResilience(
          Effect.tryPromise({
            try: async () => {
              const account = new AdAccount(accountId);
              const campaigns = await account.getCampaigns(
                ["id", "name", "status", "objective", "buying_type"],
                { limit: limit || 100 }
              );

              return campaigns.map((c) => ({
                id: c.id,
                name: c.name,
                status: c.status,
                objective: c.objective,
                buying_type: c.buying_type,
              }));
            },
            catch: (error) => extractMetaError(error),
          }),
          "meta.getCampaigns",
          {
            "meta.adAccountId": accountId,
            "meta.limit": limit || 100,
          }
        ).pipe(Effect.withSpan("MetaAdsClient.getCampaigns"));
      },
    };
  }),
}) {}

/**
 * Live layer for MetaAdsClient
 */
export const MetaAdsClientLive = MetaAdsClient.Default;
