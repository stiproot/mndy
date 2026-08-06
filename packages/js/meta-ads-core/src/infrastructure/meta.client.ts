/**
 * Outbound adapter over the Meta Marketing API.
 */

import { AdAccount, FacebookAdsApi } from "facebook-nodejs-business-sdk";
import { Config, Duration, Effect, Schedule } from "effect";
import { TimeoutError } from "analytics-core";
import { MetaApiError, MetaAuthError, MetaRateLimitError, isAuthFailure } from "../domain/errors.js";
import type { MetaFailure } from "../domain/ports.js";
import {
  resolveInsightsFields,
  type CampaignInfo,
  type GetInsightsInput,
  type InsightsData,
  type InsightsResult,
} from "../domain/models.js";

const REQUEST_TIMEOUT = Duration.seconds(60);
const MAX_RETRIES = 3;

export const MetaConfig = Config.all({
  accessToken: Config.string("META_ACCESS_TOKEN"),
  adAccountId: Config.string("META_AD_ACCOUNT_ID"),
  appId: Config.string("META_APP_ID").pipe(Config.withDefault("")),
  appSecret: Config.string("META_APP_SECRET").pipe(Config.withDefault("")),
});

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

const retrySchedule = Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES)),
);

/** Meta's transient codes: 1 unknown, 2 service, 4/17 throttling, 5xx server. */
const isRetryableError = (error: MetaApiError): boolean => {
  const code = error.code;
  if (!code) return true;
  return code >= 500 || code === 1 || code === 2 || code === 4 || code === 17;
};

const extractMetaError = (
  error: unknown,
): MetaApiError | MetaRateLimitError | MetaAuthError => {
  if (isMetaError(error)) {
    const apiError = error.response?.error;
    const message = apiError?.message || error.message;

    // 4 = app-level throttle, 17 = user-level throttle, 32 = page-level throttle.
    if (apiError?.code === 4 || apiError?.code === 17 || apiError?.code === 32) {
      return new MetaRateLimitError({
        message: message || "Meta API rate limit exceeded",
        retryAfter: 60,
      });
    }

    // Terminal — checked before the generic case so it never reaches the retry predicate.
    if (isAuthFailure({ code: apiError?.code, message })) {
      return new MetaAuthError({ message, code: apiError?.code });
    }

    return new MetaApiError({
      message,
      code: apiError?.code,
      subcode: apiError?.error_subcode,
      cause: error,
    });
  }

  const message = error instanceof Error ? error.message : "Unknown Meta API error";

  // The SDK does not always attach a structured body; an expired token arrives here with
  // only a message, which is exactly the case that used to be retried pointlessly.
  if (isAuthFailure({ message })) {
    return new MetaAuthError({ message });
  }

  return new MetaApiError({ message, cause: error });
};

const withApiResilience = <T>(
  effect: Effect.Effect<T, MetaApiError | MetaRateLimitError | MetaAuthError>,
  spanName: string,
  attributes: Record<string, string | number>,
): Effect.Effect<T, MetaFailure> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "Meta API request timed out",
          operation: spanName,
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "MetaApiError" && isRetryableError(error),
    }),
  );

export class MetaAdsClient extends Effect.Service<MetaAdsClient>()("MetaAdsClient", {
  effect: Effect.gen(function* () {
    const config = yield* MetaConfig;

    // The SDK keeps the token in module state, so this initializes once per process.
    FacebookAdsApi.init(config.accessToken);
    const defaultAdAccountId = config.adAccountId;

    return {
      defaultAdAccountId,
      hasAccessToken: config.accessToken !== "",

      getInsights: (input: GetInsightsInput): Effect.Effect<InsightsResult, MetaFailure> => {
        const adAccountId = input.adAccountId || defaultAdAccountId;
        const level = input.level || "campaign";
        const fields = resolveInsightsFields(level, input.fields);

        return withApiResilience(
          Effect.tryPromise({
            try: async () => {
              const account = new AdAccount(adAccountId);

              const params: Record<string, unknown> = {
                level,
                limit: input.limit || 50,
              };

              if (input.datePreset) {
                params.date_preset = input.datePreset;
              } else if (input.timeRange) {
                params.time_range = {
                  since: input.timeRange.since,
                  until: input.timeRange.until,
                };
              } else {
                params.date_preset = "last_7d";
              }

              if (input.campaignIds && input.campaignIds.length > 0) {
                params.filtering = [
                  { field: "campaign.id", operator: "IN", value: input.campaignIds },
                ];
              }

              const insights = await account.getInsights([...fields], params);

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

              return { data, paging: insights._paging } as InsightsResult;
            },
            catch: extractMetaError,
          }),
          "meta.getInsights",
          {
            "meta.adAccountId": adAccountId,
            "meta.level": level,
            "meta.fields": fields.length,
          },
        );
      },

      getCampaigns: (
        adAccountId?: string,
        limit?: number,
      ): Effect.Effect<readonly CampaignInfo[], MetaFailure> => {
        const accountId = adAccountId || defaultAdAccountId;

        return withApiResilience(
          Effect.tryPromise({
            try: async () => {
              const account = new AdAccount(accountId);
              const campaigns = await account.getCampaigns(
                ["id", "name", "status", "objective", "buying_type"],
                { limit: limit || 100 },
              );

              return campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                objective: campaign.objective,
                buying_type: campaign.buying_type,
              }));
            },
            catch: extractMetaError,
          }),
          "meta.getCampaigns",
          { "meta.adAccountId": accountId, "meta.limit": limit || 100 },
        );
      },
    };
  }),
}) {}
