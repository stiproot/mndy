/**
 * Outbound adapter over the Google Analytics Data API.
 *
 * Everything vendor-specific is confined here: the SDK client, its error shapes, and the
 * mapping from its response onto the domain's `ReportResult`.
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { Config, Duration, Effect, Schedule } from "effect";
import { TimeoutError } from "analytics-core";
import { GA4ApiError, GA4QuotaError } from "../domain/errors.js";
import type { GA4Failure } from "../domain/ports.js";
import type { ReportResult, ReportRow, RunReportInput } from "../domain/models.js";

const REQUEST_TIMEOUT = Duration.seconds(60);
const MAX_RETRIES = 3;

export const GA4Config = Config.all({
  propertyId: Config.string("GA4_PROPERTY_ID"),
  credentialsPath: Config.string("GOOGLE_APPLICATION_CREDENTIALS").pipe(
    Config.withDefault(""),
  ),
});

interface GoogleApiError extends Error {
  code?: number;
  details?: string;
}

const isGoogleApiError = (error: unknown): error is GoogleApiError =>
  error instanceof Error && ("code" in error || "details" in error);

/** Exponential backoff with jitter, so a fleet of servers does not retry in lockstep. */
const retrySchedule = Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES)),
);

/**
 * Only transient failures are worth retrying. Retrying a bad property ID or a permissions
 * error just burns quota and delays the real error reaching the user.
 */
const isRetryableError = (error: GA4ApiError): boolean => {
  const code = error.code;
  if (!code) return true;
  return (
    code === "UNAVAILABLE" || code === "DEADLINE_EXCEEDED" || code === "RESOURCE_EXHAUSTED"
  );
};

const extractGoogleError = (error: unknown): GA4ApiError | GA4QuotaError => {
  if (isGoogleApiError(error)) {
    if (error.code === 429 || error.message?.includes("quota")) {
      return new GA4QuotaError({
        message: error.message || "GA4 API quota exceeded",
        retryAfter: 60,
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

const withApiResilience = <T>(
  effect: Effect.Effect<T, GA4ApiError | GA4QuotaError>,
  spanName: string,
  attributes: Record<string, string | number>,
): Effect.Effect<T, GA4Failure> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "GA4 API request timed out",
          operation: spanName,
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "GA4ApiError" && isRetryableError(error),
    }),
  );

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

const transformReportResponse = (response: GA4ReportResponse): ReportResult => {
  const dimensionHeaders = response.dimensionHeaders?.map((header) => ({
    name: header.name || "",
  }));

  const metricHeaders =
    response.metricHeaders?.map((header) => ({
      name: header.name || "",
      type: header.type || "TYPE_UNSPECIFIED",
    })) || [];

  const rows: ReportRow[] =
    response.rows?.map((row) => ({
      dimensionValues: row.dimensionValues?.map((value) => ({ value: value.value || "" })),
      metricValues: row.metricValues?.map((value) => ({ value: value.value || "" })) || [],
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

export class GA4Client extends Effect.Service<GA4Client>()("GA4Client", {
  effect: Effect.gen(function* () {
    const config = yield* GA4Config;

    // Constructed once, inside the service — the layer is built at the composition root,
    // so one client is shared by every tool call rather than rebuilt per request.
    const analyticsClient = new BetaAnalyticsDataClient();
    const defaultPropertyId = config.propertyId;

    return {
      defaultPropertyId,
      hasCredentials: config.credentialsPath !== "",

      runReport: (input: RunReportInput): Effect.Effect<ReportResult, GA4Failure> => {
        const propertyId = input.propertyId || defaultPropertyId;

        return withApiResilience(
          Effect.tryPromise({
            try: async () => {
              const result = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: input.dateRanges.map((range) => ({
                  startDate: range.startDate,
                  endDate: range.endDate,
                })),
                dimensions: input.dimensions?.map((dimension) => ({
                  name: dimension.name,
                })),
                metrics: input.metrics.map((metric) => ({ name: metric.name })),
                dimensionFilter: input.dimensionFilter
                  ? {
                      filter: {
                        fieldName: input.dimensionFilter.fieldName,
                        stringFilter: input.dimensionFilter.stringFilter
                          ? {
                              matchType: input.dimensionFilter.stringFilter.matchType,
                              value: input.dimensionFilter.stringFilter.value,
                              caseSensitive:
                                input.dimensionFilter.stringFilter.caseSensitive,
                            }
                          : undefined,
                        inListFilter: input.dimensionFilter.inListFilter
                          ? {
                              values: [...input.dimensionFilter.inListFilter.values],
                              caseSensitive:
                                input.dimensionFilter.inListFilter.caseSensitive,
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
            },
            catch: extractGoogleError,
          }),
          "ga4.runReport",
          {
            "ga4.propertyId": propertyId,
            "ga4.dateRanges": input.dateRanges.length,
            "ga4.dimensions": input.dimensions?.length ?? 0,
            "ga4.metrics": input.metrics.length,
          },
        ).pipe(Effect.map(transformReportResponse));
      },
    };
  }),
}) {}
