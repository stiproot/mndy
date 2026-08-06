/**
 * Outbound adapter over the Google Ads API.
 *
 * Google Ads has more moving parts at the credential layer than any other platform here:
 * an OAuth client id/secret, a refresh token, a developer token, and — for manager
 * accounts — a login-customer-id distinct from the customer being queried. All of it is
 * confined to this file.
 */

import { Config, Duration, Effect, Redacted, Schedule } from "effect";
import { GoogleAdsApi, type Customer } from "google-ads-api";
import { TimeoutError } from "analytics-core";
import {
  GoogleAdsApiError,
  GoogleAdsAuthError,
  GoogleAdsQuotaError,
} from "../domain/errors.js";
import type { GoogleAdsFailure } from "../domain/ports.js";
import {
  buildCampaignsQuery,
  buildPerformanceQuery,
  fromMicros,
  normalizeCustomerId,
  type CampaignInfo,
  type GetCampaignsInput,
  type GetPerformanceInput,
  type PerformanceResult,
  type PerformanceRow,
} from "../domain/models.js";

const REQUEST_TIMEOUT = Duration.seconds(60);
const MAX_RETRIES = 3;

export const GoogleAdsConfig = Config.all({
  clientId: Config.string("GOOGLE_ADS_CLIENT_ID"),
  clientSecret: Config.redacted("GOOGLE_ADS_CLIENT_SECRET"),
  developerToken: Config.redacted("GOOGLE_ADS_DEVELOPER_TOKEN"),
  refreshToken: Config.redacted("GOOGLE_ADS_REFRESH_TOKEN"),
  /** The account to query when a call names none. Dashes from the UI are stripped. */
  customerId: Config.string("GOOGLE_ADS_CUSTOMER_ID").pipe(
    Config.map(normalizeCustomerId),
  ),
  /**
   * The manager (MCC) account the request is made *through*. Required when the customer
   * being queried sits under a manager account, which is the common agency setup.
   */
  loginCustomerId: Config.string("GOOGLE_ADS_LOGIN_CUSTOMER_ID").pipe(
    Config.map(normalizeCustomerId),
    Config.withDefault(""),
  ),
});

const retrySchedule = Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES)),
);

interface GoogleAdsFailureShape {
  message?: string;
  code?: number | string;
  errors?: Array<{ error_code?: Record<string, unknown>; message?: string }>;
}

const asFailureShape = (error: unknown): GoogleAdsFailureShape =>
  typeof error === "object" && error !== null ? (error as GoogleAdsFailureShape) : {};

const errorCodeKeys = (error: GoogleAdsFailureShape): string[] =>
  (error.errors ?? []).flatMap((entry) => Object.keys(entry.error_code ?? {}));

const classifyError = (
  error: unknown,
): GoogleAdsApiError | GoogleAdsQuotaError | GoogleAdsAuthError => {
  const shape = asFailureShape(error);
  const message = shape.message ?? (error instanceof Error ? error.message : "Unknown Google Ads API error");
  const codes = errorCodeKeys(shape);
  const haystack = `${message} ${codes.join(" ")}`.toLowerCase();

  if (haystack.includes("developer_token")) {
    return new GoogleAdsAuthError({ message, authType: "developer_token" });
  }
  if (
    haystack.includes("authentication") ||
    haystack.includes("authorization") ||
    haystack.includes("refresh") ||
    haystack.includes("invalid_grant")
  ) {
    return new GoogleAdsAuthError({ message, authType: "refresh_token" });
  }
  if (haystack.includes("quota") || haystack.includes("resource_exhausted")) {
    return new GoogleAdsQuotaError({ message });
  }

  return new GoogleAdsApiError({
    message,
    code: codes[0],
    status: typeof shape.code === "number" ? shape.code : undefined,
    cause: error,
  });
};

/**
 * Retry transient failures only. Auth and quota failures are terminal: a bad developer
 * token will never succeed, and Google Ads quotas are daily, so retrying either just
 * delays the real error reaching the user.
 */
const isRetryable = (error: GoogleAdsFailure): boolean =>
  error._tag === "GoogleAdsApiError" &&
  (error.status === undefined || error.status >= 500 || error.status === 429);

const withApiResilience = <T>(
  effect: Effect.Effect<T, GoogleAdsApiError | GoogleAdsQuotaError | GoogleAdsAuthError>,
  spanName: string,
  attributes: Record<string, string | number>,
): Effect.Effect<T, GoogleAdsFailure> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "Google Ads API request timed out",
          operation: spanName,
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({ schedule: retrySchedule, while: isRetryable }),
  );

/** A GAQL result row, as the client library hands it back. */
interface GaqlRow {
  campaign?: { id?: string | number; name?: string };
  ad_group?: { id?: string | number; name?: string };
  ad_group_criterion?: {
    keyword?: { text?: string };
    quality_info?: { quality_score?: number };
  };
  segments?: { date?: string };
  metrics?: {
    cost_micros?: string | number;
    impressions?: string | number;
    clicks?: string | number;
    conversions?: number;
    conversions_value?: number;
    search_impression_share?: number;
  };
}

const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : undefined;
};

const toPerformanceRow = (row: GaqlRow): PerformanceRow => ({
  campaignId: row.campaign?.id === undefined ? undefined : String(row.campaign.id),
  campaignName: row.campaign?.name,
  adGroupId: row.ad_group?.id === undefined ? undefined : String(row.ad_group.id),
  adGroupName: row.ad_group?.name,
  keyword: row.ad_group_criterion?.keyword?.text,
  date: row.segments?.date,
  // cost_micros is millionths of the account currency — see MICROS_PER_UNIT.
  spend: fromMicros(row.metrics?.cost_micros),
  impressions: toNumber(row.metrics?.impressions),
  clicks: toNumber(row.metrics?.clicks),
  conversions: toNumber(row.metrics?.conversions),
  revenue: toNumber(row.metrics?.conversions_value),
  qualityScore: row.ad_group_criterion?.quality_info?.quality_score,
  searchImpressionShare: row.metrics?.search_impression_share,
});

export class GoogleAdsClient extends Effect.Service<GoogleAdsClient>()("GoogleAdsClient", {
  effect: Effect.gen(function* () {
    const config = yield* GoogleAdsConfig;

    // Constructed once, at the composition root — not per request.
    const api = new GoogleAdsApi({
      client_id: config.clientId,
      client_secret: Redacted.value(config.clientSecret),
      developer_token: Redacted.value(config.developerToken),
    });

    const refreshToken = Redacted.value(config.refreshToken);

    const customerFor = (customerId?: string): Customer =>
      api.Customer({
        customer_id: customerId ? normalizeCustomerId(customerId) : config.customerId,
        refresh_token: refreshToken,
        ...(config.loginCustomerId
          ? { login_customer_id: config.loginCustomerId }
          : {}),
      });

    const runQuery = (customerId: string | undefined, gaql: string) =>
      Effect.tryPromise({
        try: () => customerFor(customerId).query(gaql) as Promise<GaqlRow[]>,
        catch: classifyError,
      });

    return {
      defaultCustomerId: config.customerId,

      getCampaigns: (
        input: GetCampaignsInput,
      ): Effect.Effect<readonly CampaignInfo[], GoogleAdsFailure> => {
        const customerId = input.customerId
          ? normalizeCustomerId(input.customerId)
          : config.customerId;

        return withApiResilience(
          runQuery(customerId, buildCampaignsQuery(input)),
          "googleAds.getCampaigns",
          { "googleAds.customerId": customerId },
        ).pipe(
          Effect.map((rows) =>
            rows.map((row) => ({
              id: String(row.campaign?.id ?? ""),
              name: row.campaign?.name ?? "",
              status: String(
                (row.campaign as { status?: string } | undefined)?.status ?? "",
              ),
              advertisingChannelType: (
                row.campaign as { advertising_channel_type?: string } | undefined
              )?.advertising_channel_type,
              biddingStrategy: (
                row.campaign as { bidding_strategy_type?: string } | undefined
              )?.bidding_strategy_type,
            })),
          ),
        );
      },

      getPerformance: (
        input: GetPerformanceInput,
      ): Effect.Effect<PerformanceResult, GoogleAdsFailure> => {
        const customerId = input.customerId
          ? normalizeCustomerId(input.customerId)
          : config.customerId;
        const level = input.level ?? "campaign";

        return withApiResilience(
          runQuery(customerId, buildPerformanceQuery({ ...input, level })),
          "googleAds.getPerformance",
          { "googleAds.customerId": customerId, "googleAds.level": level },
        ).pipe(
          Effect.map((rows) => ({
            customerId,
            level,
            rows: rows.map(toPerformanceRow),
          })),
        );
      },
    };
  }),
}) {}
