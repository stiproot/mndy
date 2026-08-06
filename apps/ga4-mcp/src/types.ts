import { Config, Data, Schema } from "effect";

// =============================================================================
// Tagged Errors
// =============================================================================

/**
 * Error when GA4 API request fails
 */
export class GA4ApiError extends Data.TaggedError("GA4ApiError")<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

/**
 * Error when GA4 quota/rate limit is exceeded
 */
export class GA4QuotaError extends Data.TaggedError("GA4QuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}

/**
 * Error when request times out
 */
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly duration: string;
}> {}

/**
 * Error when configuration is invalid or missing
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

// =============================================================================
// Configuration
// =============================================================================

/**
 * GA4 configuration from environment
 */
export const GA4Config = Config.all({
  propertyId: Config.string("GA4_PROPERTY_ID"),
  credentialsPath: Config.string("GOOGLE_APPLICATION_CREDENTIALS").pipe(
    Config.withDefault("")
  ),
});

/**
 * Server configuration from environment
 */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3003)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

// =============================================================================
// Schemas
// =============================================================================

/**
 * Schema for date range
 */
export const DateRangeSchema = Schema.Struct({
  startDate: Schema.String.annotations({
    description: "Start date in YYYY-MM-DD format or relative like 'yesterday', '7daysAgo', '30daysAgo'",
  }),
  endDate: Schema.String.annotations({
    description: "End date in YYYY-MM-DD format or relative like 'today', 'yesterday'",
  }),
});

export type DateRange = Schema.Schema.Type<typeof DateRangeSchema>;

/**
 * Schema for dimension
 */
export const DimensionSchema = Schema.Struct({
  name: Schema.String.annotations({
    description: "Dimension name (e.g., 'date', 'sessionSource', 'sessionMedium', 'country')",
  }),
});

export type Dimension = Schema.Schema.Type<typeof DimensionSchema>;

/**
 * Schema for metric
 */
export const MetricSchema = Schema.Struct({
  name: Schema.String.annotations({
    description: "Metric name (e.g., 'sessions', 'activeUsers', 'screenPageViews', 'conversions')",
  }),
});

export type Metric = Schema.Schema.Type<typeof MetricSchema>;

/**
 * Schema for dimension filter
 */
export const DimensionFilterSchema = Schema.Struct({
  fieldName: Schema.String.annotations({ description: "Dimension to filter on" }),
  stringFilter: Schema.optional(
    Schema.Struct({
      matchType: Schema.Literal("EXACT", "BEGINS_WITH", "ENDS_WITH", "CONTAINS", "FULL_REGEXP", "PARTIAL_REGEXP"),
      value: Schema.String,
      caseSensitive: Schema.optional(Schema.Boolean),
    })
  ),
  inListFilter: Schema.optional(
    Schema.Struct({
      values: Schema.Array(Schema.String),
      caseSensitive: Schema.optional(Schema.Boolean),
    })
  ),
});

export type DimensionFilter = Schema.Schema.Type<typeof DimensionFilterSchema>;

/**
 * Schema for run report input
 */
export const RunReportInputSchema = Schema.Struct({
  propertyId: Schema.optional(Schema.String).annotations({
    description: "GA4 Property ID (uses default if not provided)",
  }),
  dateRanges: Schema.Array(DateRangeSchema).annotations({
    description: "Date ranges for the report (max 4)",
  }),
  dimensions: Schema.optional(Schema.Array(DimensionSchema)).annotations({
    description: "Dimensions to include in the report",
  }),
  metrics: Schema.Array(MetricSchema).annotations({
    description: "Metrics to include in the report",
  }),
  dimensionFilter: Schema.optional(DimensionFilterSchema).annotations({
    description: "Filter to apply to dimensions",
  }),
  limit: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(100000))).annotations({
    description: "Maximum number of rows to return (default 10000)",
  }),
  offset: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(0))).annotations({
    description: "Row offset for pagination",
  }),
});

export type RunReportInput = Schema.Schema.Type<typeof RunReportInputSchema>;

/**
 * Schema for dimension value in response
 */
export const DimensionValueSchema = Schema.Struct({
  value: Schema.String,
});

/**
 * Schema for metric value in response
 */
export const MetricValueSchema = Schema.Struct({
  value: Schema.String,
});

/**
 * Schema for a single row in the report
 */
export const ReportRowSchema = Schema.Struct({
  dimensionValues: Schema.optional(Schema.Array(DimensionValueSchema)),
  metricValues: Schema.Array(MetricValueSchema),
});

export type ReportRow = Schema.Schema.Type<typeof ReportRowSchema>;

/**
 * Schema for dimension header
 */
export const DimensionHeaderSchema = Schema.Struct({
  name: Schema.String,
});

/**
 * Schema for metric header
 */
export const MetricHeaderSchema = Schema.Struct({
  name: Schema.String,
  type: Schema.String,
});

/**
 * Schema for report result
 */
export const ReportResultSchema = Schema.Struct({
  dimensionHeaders: Schema.optional(Schema.Array(DimensionHeaderSchema)),
  metricHeaders: Schema.Array(MetricHeaderSchema),
  rows: Schema.Array(ReportRowSchema),
  rowCount: Schema.Number,
  metadata: Schema.optional(
    Schema.Struct({
      currencyCode: Schema.optional(Schema.String),
      timeZone: Schema.optional(Schema.String),
    })
  ),
});

export type ReportResult = Schema.Schema.Type<typeof ReportResultSchema>;

// =============================================================================
// Common Dimensions and Metrics Reference
// =============================================================================

/**
 * Common GA4 dimensions for reference
 */
export const COMMON_DIMENSIONS = [
  "date",
  "dateHour",
  "sessionSource",
  "sessionMedium",
  "sessionCampaignName",
  "sessionDefaultChannelGroup",
  "country",
  "city",
  "deviceCategory",
  "browser",
  "operatingSystem",
  "landingPage",
  "pagePath",
  "pageTitle",
  "eventName",
] as const;

/**
 * Common GA4 metrics for reference
 */
export const COMMON_METRICS = [
  "sessions",
  "activeUsers",
  "newUsers",
  "totalUsers",
  "screenPageViews",
  "screenPageViewsPerSession",
  "averageSessionDuration",
  "bounceRate",
  "engagementRate",
  "engagedSessions",
  "conversions",
  "totalRevenue",
  "purchaseRevenue",
  "ecommercePurchases",
  "addToCarts",
  "checkouts",
  "itemsViewed",
] as const;
