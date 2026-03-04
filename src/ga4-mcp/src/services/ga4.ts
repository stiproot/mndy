import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { Duration, Effect, Schedule } from "effect";
import type { RunReportInput, ReportResult, ReportRow } from "../types.js";
import { GA4ApiError, GA4QuotaError, TimeoutError, GA4Config } from "../types.js";

const REQUEST_TIMEOUT = Duration.seconds(60);
const MAX_RETRIES = 3;

/**
 * Type guard for Google API errors
 */
interface GoogleApiError extends Error {
  code?: number;
  details?: string;
}

const isGoogleApiError = (error: unknown): error is GoogleApiError =>
  error instanceof Error && ("code" in error || "details" in error);

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
const isRetryableError = (error: GA4ApiError): boolean => {
  const code = error.code;
  if (!code) return true;
  // Retry on server errors, quota issues, and timeouts
  return code === "UNAVAILABLE" || code === "DEADLINE_EXCEEDED" || code === "RESOURCE_EXHAUSTED";
};

/**
 * Extract error details from Google API errors
 */
const extractGoogleError = (error: unknown): GA4ApiError | GA4QuotaError => {
  if (isGoogleApiError(error)) {
    // Handle quota/rate limiting
    if (error.code === 429 || error.message?.includes("quota")) {
      return new GA4QuotaError({
        message: error.message || "GA4 API quota exceeded",
        retryAfter: 60, // Default 60 seconds
      });
    }

    return new GA4ApiError({
      message: error.message,
      code: error.code?.toString(),
      cause: error,
    });
  }

  return new GA4ApiError({
    message: error instanceof Error ? error.message : "Unknown GA4 API error",
    cause: error,
  });
};

/**
 * Wrap GA4 API call with timeout, error handling, and retry
 */
const withApiResilience = <T>(
  effect: Effect.Effect<T, never, never>,
  spanName: string,
  attributes: Record<string, string | number>
): Effect.Effect<T, GA4ApiError | GA4QuotaError | TimeoutError> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "GA4 API request timed out",
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.catchAllDefect((defect) => Effect.fail(extractGoogleError(defect))),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "GA4ApiError" && isRetryableError(error),
    })
  );

/**
 * GA4 report response type from the API
 */
interface GA4ReportResponse {
  dimensionHeaders?: Array<{ name?: string | null }>;
  metricHeaders?: Array<{ name?: string | null; type?: string | null }>;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string | null }>;
    metricValues?: Array<{ value?: string | null }>;
  }>;
  rowCount?: number | string | bigint | null;
  metadata?: {
    currencyCode?: string | null;
    timeZone?: string | null;
  };
}

/**
 * Transform GA4 API response to our domain model
 */
const transformReportResponse = (response: GA4ReportResponse): ReportResult => {
  const dimensionHeaders = response.dimensionHeaders?.map((h: { name?: string | null }) => ({
    name: h.name || "",
  }));

  const metricHeaders =
    response.metricHeaders?.map((h: { name?: string | null; type?: string | null }) => ({
      name: h.name || "",
      type: h.type || "TYPE_UNSPECIFIED",
    })) || [];

  const rows: ReportRow[] =
    response.rows?.map((row: { dimensionValues?: Array<{ value?: string | null }>; metricValues?: Array<{ value?: string | null }> }) => ({
      dimensionValues: row.dimensionValues?.map((d: { value?: string | null }) => ({
        value: d.value || "",
      })),
      metricValues:
        row.metricValues?.map((m: { value?: string | null }) => ({
          value: m.value || "",
        })) || [],
    })) || [];

  return {
    dimensionHeaders,
    metricHeaders,
    rows,
    rowCount: Number(response.rowCount) || rows.length,
    metadata: response.metadata
      ? {
          currencyCode: response.metadata.currencyCode || undefined,
          timeZone: response.metadata.timeZone || undefined,
        }
      : undefined,
  };
};

/**
 * GA4Client service interface
 */
export class GA4Client extends Effect.Service<GA4Client>()("GA4Client", {
  effect: Effect.gen(function* () {
    const config = yield* GA4Config;

    // Initialize the client - uses GOOGLE_APPLICATION_CREDENTIALS env var
    const analyticsClient = new BetaAnalyticsDataClient();

    const defaultPropertyId = config.propertyId;

    return {
      /**
       * Check if credentials are configured
       */
      hasCredentials: (): boolean => config.credentialsPath !== "",

      /**
       * Get the default property ID
       */
      getDefaultPropertyId: (): string => defaultPropertyId,

      /**
       * Run a GA4 report with the specified parameters
       */
      runReport: (
        input: RunReportInput
      ): Effect.Effect<ReportResult, GA4ApiError | GA4QuotaError | TimeoutError> => {
        const propertyId = input.propertyId || defaultPropertyId;

        return withApiResilience(
          Effect.promise(async () => {
            const result = await analyticsClient.runReport({
              property: `properties/${propertyId}`,
              dateRanges: input.dateRanges.map((dr) => ({
                startDate: dr.startDate,
                endDate: dr.endDate,
              })),
              dimensions: input.dimensions?.map((d) => ({ name: d.name })),
              metrics: input.metrics.map((m) => ({ name: m.name })),
              dimensionFilter: input.dimensionFilter
                ? {
                    filter: {
                      fieldName: input.dimensionFilter.fieldName,
                      stringFilter: input.dimensionFilter.stringFilter
                        ? {
                            matchType: input.dimensionFilter.stringFilter.matchType,
                            value: input.dimensionFilter.stringFilter.value,
                            caseSensitive: input.dimensionFilter.stringFilter.caseSensitive,
                          }
                        : undefined,
                      inListFilter: input.dimensionFilter.inListFilter
                        ? {
                            values: [...input.dimensionFilter.inListFilter.values],
                            caseSensitive: input.dimensionFilter.inListFilter.caseSensitive,
                          }
                        : undefined,
                    },
                  }
                : undefined,
              limit: input.limit ?? 10000,
              offset: input.offset,
            });

            const response = Array.isArray(result) ? result[0] : result;
            return response as GA4ReportResponse;
          }),
          "ga4.runReport",
          {
            "ga4.propertyId": propertyId,
            "ga4.dateRanges": input.dateRanges.length,
            "ga4.dimensions": input.dimensions?.length ?? 0,
            "ga4.metrics": input.metrics.length,
          }
        ).pipe(
          Effect.map(transformReportResponse),
          Effect.withSpan("GA4Client.runReport")
        );
      },
    };
  }),
}) {}

/**
 * Live layer for GA4Client
 */
export const GA4ClientLive = GA4Client.Default;
