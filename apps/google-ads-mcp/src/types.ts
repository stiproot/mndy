import { Config, Data, Schema } from "effect";

// ==================== Configuration ====================

export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3006)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

export const GoogleAdsConfig = Config.all({
  clientId: Config.string("GOOGLE_ADS_CLIENT_ID"),
  clientSecret: Config.secret("GOOGLE_ADS_CLIENT_SECRET"),
  developerToken: Config.secret("GOOGLE_ADS_DEVELOPER_TOKEN"),
  refreshToken: Config.secret("GOOGLE_ADS_REFRESH_TOKEN"),
  customerId: Config.string("GOOGLE_ADS_CUSTOMER_ID").pipe(
    // Remove dashes if present (user might copy from UI as 123-456-7890)
    Config.map((id) => id.replace(/-/g, ""))
  ),
});

// ==================== Errors ====================

export class GoogleAdsApiError extends Data.TaggedError("GoogleAdsApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class GoogleAdsQuotaError extends Data.TaggedError("GoogleAdsQuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly dailyLimit?: number;
}> {}

export class GoogleAdsAuthError extends Data.TaggedError("GoogleAdsAuthError")<{
  readonly message: string;
  readonly authType: "refresh_token" | "developer_token";
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly duration?: string;
}> {}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

// ==================== Schemas ====================

// Date range schemas
export const TimeRangeSchema = Schema.Struct({
  since: Schema.String.annotations({
    description: "Start date in YYYY-MM-DD format"
  }),
  until: Schema.String.annotations({
    description: "End date in YYYY-MM-DD format"
  }),
});

export type TimeRange = Schema.Schema.Type<typeof TimeRangeSchema>;

// Campaign info schema
export const CampaignInfoSchema = Schema.Struct({
  id: Schema.String.annotations({ description: "Campaign ID" }),
  name: Schema.String.annotations({ description: "Campaign name" }),
  status: Schema.String.annotations({
    description: "Campaign status (ENABLED, PAUSED, REMOVED)"
  }),
  advertisingChannelType: Schema.optional(Schema.String).annotations({
    description: "Advertising channel type (SEARCH, DISPLAY, VIDEO, etc.)"
  }),
  biddingStrategy: Schema.optional(Schema.String).annotations({
    description: "Bidding strategy type"
  }),
});

export type CampaignInfo = Schema.Schema.Type<typeof CampaignInfoSchema>;

// Performance data schema
export const PerformanceDataSchema = Schema.Struct({
  // Identifiers (based on level)
  campaignId: Schema.optional(Schema.String),
  campaignName: Schema.optional(Schema.String),
  adGroupId: Schema.optional(Schema.String),
  adGroupName: Schema.optional(Schema.String),

  // Date range
  dateStart: Schema.String,
  dateStop: Schema.String,

  // Core metrics (all optional, may not be available)
  spend: Schema.optional(Schema.Number).annotations({
    description: "Total cost in account currency"
  }),
  impressions: Schema.optional(Schema.Number).annotations({
    description: "Total impressions"
  }),
  clicks: Schema.optional(Schema.Number).annotations({
    description: "Total clicks"
  }),
  conversions: Schema.optional(Schema.Number).annotations({
    description: "Total conversions"
  }),
  revenue: Schema.optional(Schema.Number).annotations({
    description: "Total conversion value (revenue)"
  }),

  // Calculated metrics
  ctr: Schema.optional(Schema.Number).annotations({
    description: "Click-through rate as percentage (0-100)"
  }),
  cpc: Schema.optional(Schema.Number).annotations({
    description: "Cost per click in account currency"
  }),
  cpm: Schema.optional(Schema.Number).annotations({
    description: "Cost per thousand impressions"
  }),
  roas: Schema.optional(Schema.Number).annotations({
    description: "Return on ad spend (revenue / cost)"
  }),
  conversionRate: Schema.optional(Schema.Number).annotations({
    description: "Conversion rate as percentage (0-100)"
  }),

  // Quality metrics (optional)
  qualityScore: Schema.optional(Schema.Number).annotations({
    description: "Quality score (keyword level only, 1-10)"
  }),
  searchImpressionShare: Schema.optional(Schema.Number).annotations({
    description: "Search impression share as percentage (0-100)"
  }),
});

export type PerformanceData = Schema.Schema.Type<typeof PerformanceDataSchema>;

// Get campaigns input schema
export const GetCampaignsInputSchema = Schema.Struct({
  customerId: Schema.optional(Schema.String).annotations({
    description: "Customer ID (10 digits, no dashes). Uses default if not provided."
  }),
  status: Schema.optional(
    Schema.Array(Schema.Literal("ENABLED", "PAUSED", "REMOVED"))
  ).annotations({
    description: "Filter by campaign status. Default: ENABLED, PAUSED"
  }),
  limit: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.between(1, 500))
  ).annotations({
    description: "Maximum number of results. Default: 100, Max: 500"
  }),
});

export type GetCampaignsInput = Schema.Schema.Type<typeof GetCampaignsInputSchema>;

// Get performance input schema
export const GetPerformanceInputSchema = Schema.Struct({
  customerId: Schema.optional(Schema.String).annotations({
    description: "Customer ID (10 digits, no dashes). Uses default if not provided."
  }),
  level: Schema.optional(
    Schema.Literal("account", "campaign", "ad_group", "keyword")
  ).annotations({
    description: "Aggregation level. Default: campaign"
  }),
  datePreset: Schema.optional(
    Schema.Literal(
      "TODAY",
      "YESTERDAY",
      "LAST_7_DAYS",
      "LAST_30_DAYS",
      "LAST_90_DAYS",
      "THIS_MONTH",
      "LAST_MONTH",
      "THIS_YEAR",
      "LAST_YEAR"
    )
  ).annotations({
    description: "Predefined date range. Default: LAST_7_DAYS"
  }),
  timeRange: Schema.optional(TimeRangeSchema).annotations({
    description: "Custom date range (use instead of datePreset)"
  }),
  campaignIds: Schema.optional(Schema.Array(Schema.String)).annotations({
    description: "Filter by specific campaign IDs"
  }),
  includeQualityMetrics: Schema.optional(Schema.Boolean).annotations({
    description: "Include quality score and impression share. Default: false"
  }),
  limit: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.between(1, 1000))
  ).annotations({
    description: "Maximum number of results. Default: 100, Max: 1000"
  }),
});

export type GetPerformanceInput = Schema.Schema.Type<typeof GetPerformanceInputSchema>;
