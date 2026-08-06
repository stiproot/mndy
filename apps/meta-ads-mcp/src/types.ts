import { Config, Data, Schema } from "effect";

// =============================================================================
// Tagged Errors
// =============================================================================

/**
 * Error when Meta API request fails
 */
export class MetaApiError extends Data.TaggedError("MetaApiError")<{
  readonly message: string;
  readonly code?: number;
  readonly subcode?: number;
  readonly cause?: unknown;
}> {}

/**
 * Error when Meta rate limit is exceeded
 */
export class MetaRateLimitError extends Data.TaggedError("MetaRateLimitError")<{
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
 * Meta configuration from environment
 */
export const MetaConfig = Config.all({
  accessToken: Config.string("META_ACCESS_TOKEN"),
  adAccountId: Config.string("META_AD_ACCOUNT_ID"),
  appId: Config.string("META_APP_ID").pipe(Config.withDefault("")),
  appSecret: Config.string("META_APP_SECRET").pipe(Config.withDefault("")),
});

/**
 * Server configuration from environment
 */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3004)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

// =============================================================================
// Schemas
// =============================================================================

/**
 * Schema for date preset
 */
export const DatePresetSchema = Schema.Literal(
  "today",
  "yesterday",
  "this_month",
  "last_month",
  "this_quarter",
  "maximum",
  "last_3d",
  "last_7d",
  "last_14d",
  "last_28d",
  "last_30d",
  "last_90d",
  "last_week_mon_sun",
  "last_week_sun_sat",
  "last_quarter",
  "last_year",
  "this_week_mon_today",
  "this_week_sun_today",
  "this_year"
);

export type DatePreset = Schema.Schema.Type<typeof DatePresetSchema>;

/**
 * Schema for time range
 */
export const TimeRangeSchema = Schema.Struct({
  since: Schema.String.annotations({ description: "Start date (YYYY-MM-DD)" }),
  until: Schema.String.annotations({ description: "End date (YYYY-MM-DD)" }),
});

export type TimeRange = Schema.Schema.Type<typeof TimeRangeSchema>;

/**
 * Schema for level breakdown
 */
export const LevelSchema = Schema.Literal("account", "campaign", "adset", "ad");
export type Level = Schema.Schema.Type<typeof LevelSchema>;

/**
 * Schema for get insights input
 */
export const GetInsightsInputSchema = Schema.Struct({
  adAccountId: Schema.optional(Schema.String).annotations({
    description: "Ad Account ID (uses default if not provided)",
  }),
  level: Schema.optional(LevelSchema).annotations({
    description: "Level of aggregation: account, campaign, adset, or ad",
  }),
  datePreset: Schema.optional(DatePresetSchema).annotations({
    description: "Predefined date range (e.g., last_7d, last_30d, this_month)",
  }),
  timeRange: Schema.optional(TimeRangeSchema).annotations({
    description: "Custom date range with since/until dates",
  }),
  campaignIds: Schema.optional(Schema.Array(Schema.String)).annotations({
    description: "Filter by specific campaign IDs",
  }),
  fields: Schema.optional(Schema.Array(Schema.String)).annotations({
    description: "Specific fields to retrieve (uses defaults if not provided)",
  }),
  limit: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(500))).annotations({
    description: "Maximum number of results (default 50, max 500)",
  }),
});

export type GetInsightsInput = Schema.Schema.Type<typeof GetInsightsInputSchema>;

/**
 * Schema for campaign info
 */
export const CampaignInfoSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  status: Schema.String,
  objective: Schema.optional(Schema.String),
  buying_type: Schema.optional(Schema.String),
});

export type CampaignInfo = Schema.Schema.Type<typeof CampaignInfoSchema>;

/**
 * Schema for insights data
 */
export const InsightsDataSchema = Schema.Struct({
  // Identifiers
  campaign_id: Schema.optional(Schema.String),
  campaign_name: Schema.optional(Schema.String),
  adset_id: Schema.optional(Schema.String),
  adset_name: Schema.optional(Schema.String),
  ad_id: Schema.optional(Schema.String),
  ad_name: Schema.optional(Schema.String),

  // Date range
  date_start: Schema.String,
  date_stop: Schema.String,

  // Spend metrics
  spend: Schema.optional(Schema.String),
  impressions: Schema.optional(Schema.String),
  clicks: Schema.optional(Schema.String),
  reach: Schema.optional(Schema.String),

  // Calculated metrics
  ctr: Schema.optional(Schema.String),
  cpc: Schema.optional(Schema.String),
  cpm: Schema.optional(Schema.String),
  cpp: Schema.optional(Schema.String),
  frequency: Schema.optional(Schema.String),

  // Conversion metrics
  conversions: Schema.optional(Schema.String),
  conversion_values: Schema.optional(Schema.String),
  cost_per_conversion: Schema.optional(Schema.String),
  purchase_roas: Schema.optional(Schema.Array(Schema.Unknown)),
  actions: Schema.optional(Schema.Array(Schema.Unknown)),
  action_values: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type InsightsData = Schema.Schema.Type<typeof InsightsDataSchema>;

/**
 * Schema for insights result
 */
export const InsightsResultSchema = Schema.Struct({
  data: Schema.Array(InsightsDataSchema),
  paging: Schema.optional(
    Schema.Struct({
      cursors: Schema.optional(
        Schema.Struct({
          before: Schema.optional(Schema.String),
          after: Schema.optional(Schema.String),
        })
      ),
      next: Schema.optional(Schema.String),
    })
  ),
  summary: Schema.optional(Schema.Unknown),
});

export type InsightsResult = Schema.Schema.Type<typeof InsightsResultSchema>;

// =============================================================================
// Common Fields Reference
// =============================================================================

/**
 * Default fields for insights requests
 */
export const DEFAULT_INSIGHTS_FIELDS = [
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "spend",
  "impressions",
  "clicks",
  "reach",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "actions",
  "action_values",
  "purchase_roas",
] as const;

/**
 * All available insights fields
 */
export const ALL_INSIGHTS_FIELDS = [
  // Identifiers
  "account_id",
  "account_name",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",

  // Date
  "date_start",
  "date_stop",

  // Basic metrics
  "spend",
  "impressions",
  "clicks",
  "reach",

  // Calculated metrics
  "ctr",
  "cpc",
  "cpm",
  "cpp",
  "frequency",

  // Engagement
  "actions",
  "action_values",
  "conversions",
  "conversion_values",
  "cost_per_action_type",
  "cost_per_conversion",

  // ROAS
  "purchase_roas",
  "website_purchase_roas",

  // Video
  "video_avg_time_watched_actions",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p100_watched_actions",

  // Quality
  "quality_ranking",
  "engagement_rate_ranking",
  "conversion_rate_ranking",
] as const;
