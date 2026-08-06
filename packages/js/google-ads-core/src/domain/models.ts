/**
 * The Google Ads reporting domain.
 *
 * Google Ads is queried with GAQL (a SQL-like language) rather than a fixed report
 * endpoint, so the domain's job here is larger than elsewhere: it decides which fields a
 * given aggregation level needs, and how the API's response rows collapse into a flat
 * performance record. Both are pure, and both are tested.
 */

export interface TimeRange {
  readonly since: string;
  readonly until: string;
}

/** Google Ads' own date-range shorthands, as GAQL spells them. */
export type DatePreset =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "THIS_YEAR"
  | "LAST_YEAR";

export const DATE_PRESETS: readonly DatePreset[] = [
  "TODAY",
  "YESTERDAY",
  "LAST_7_DAYS",
  "LAST_30_DAYS",
  "LAST_90_DAYS",
  "THIS_MONTH",
  "LAST_MONTH",
  "THIS_YEAR",
  "LAST_YEAR",
];

export type Level = "account" | "campaign" | "ad_group" | "keyword";

export const LEVELS: readonly Level[] = ["account", "campaign", "ad_group", "keyword"];

export type CampaignStatus = "ENABLED" | "PAUSED" | "REMOVED";

export const CAMPAIGN_STATUSES: readonly CampaignStatus[] = [
  "ENABLED",
  "PAUSED",
  "REMOVED",
];

export interface GetCampaignsInput {
  /** Overrides the server's configured customer for this call — per-call brand targeting. */
  readonly customerId?: string;
  readonly status?: readonly CampaignStatus[];
  readonly limit?: number;
}

export interface GetPerformanceInput {
  readonly customerId?: string;
  readonly level?: Level;
  readonly datePreset?: DatePreset;
  readonly timeRange?: TimeRange;
  readonly campaignIds?: readonly string[];
  readonly includeQualityMetrics?: boolean;
  readonly limit?: number;
}

export interface CampaignInfo {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly advertisingChannelType?: string;
  readonly biddingStrategy?: string;
}

export interface PerformanceRow {
  readonly campaignId?: string;
  readonly campaignName?: string;
  readonly adGroupId?: string;
  readonly adGroupName?: string;
  readonly keyword?: string;
  readonly date?: string;
  readonly spend?: number;
  readonly impressions?: number;
  readonly clicks?: number;
  readonly conversions?: number;
  readonly revenue?: number;
  readonly qualityScore?: number;
  readonly searchImpressionShare?: number;
}

export interface PerformanceResult {
  readonly customerId: string;
  readonly level: Level;
  readonly rows: readonly PerformanceRow[];
}

/**
 * Google Ads reports money in **micros** — millionths of the account currency. Forgetting
 * this is the classic Google Ads bug: a report showing 1,500,000 spend instead of 1.50.
 */
export const MICROS_PER_UNIT = 1_000_000;

export const fromMicros = (micros: number | string | null | undefined): number | undefined => {
  if (micros === null || micros === undefined) return undefined;
  const numeric = typeof micros === "string" ? Number(micros) : micros;
  return Number.isFinite(numeric) ? numeric / MICROS_PER_UNIT : undefined;
};

/** The resource a level's GAQL query selects FROM. */
export const resourceForLevel = (level: Level): string => {
  switch (level) {
    case "account":
      return "customer";
    case "campaign":
      return "campaign";
    case "ad_group":
      return "ad_group";
    case "keyword":
      return "keyword_view";
  }
};

/** The identifier fields a level needs for its rows to be attributable. */
export const identifierFieldsForLevel = (level: Level): readonly string[] => {
  switch (level) {
    case "account":
      return [];
    case "campaign":
      return ["campaign.id", "campaign.name"];
    case "ad_group":
      return ["campaign.id", "campaign.name", "ad_group.id", "ad_group.name"];
    case "keyword":
      return [
        "campaign.id",
        "campaign.name",
        "ad_group.id",
        "ad_group.name",
        "ad_group_criterion.keyword.text",
      ];
  }
};

const CORE_METRICS = [
  "metrics.cost_micros",
  "metrics.impressions",
  "metrics.clicks",
  "metrics.conversions",
  "metrics.conversions_value",
] as const;

/**
 * Quality metrics are only meaningful at some levels, and asking for them where they do not
 * exist makes the whole query fail rather than degrade — so this filters rather than trusts
 * the caller.
 */
const QUALITY_METRICS_BY_LEVEL: Partial<Record<Level, readonly string[]>> = {
  campaign: ["metrics.search_impression_share"],
  ad_group: ["metrics.search_impression_share"],
  keyword: ["ad_group_criterion.quality_info.quality_score"],
};

export const selectFieldsFor = (
  level: Level,
  includeQualityMetrics = false,
): readonly string[] => {
  const quality = includeQualityMetrics ? (QUALITY_METRICS_BY_LEVEL[level] ?? []) : [];
  return [...identifierFieldsForLevel(level), ...CORE_METRICS, ...quality];
};

const isoToGaql = (date: string): string => `'${date}'`;

/**
 * Build the GAQL query for a performance request.
 *
 * Campaign IDs are numeric in Google Ads, and this filters non-numeric values out rather
 * than interpolating them — a defensive measure against building a malformed (or hostile)
 * query from tool input.
 */
export const buildPerformanceQuery = (
  input: GetPerformanceInput & { readonly level: Level },
): string => {
  const fields = selectFieldsFor(input.level, input.includeQualityMetrics);
  const resource = resourceForLevel(input.level);

  const conditions: string[] = [];

  if (input.timeRange) {
    conditions.push(
      `segments.date BETWEEN ${isoToGaql(input.timeRange.since)} AND ${isoToGaql(input.timeRange.until)}`,
    );
  } else {
    conditions.push(`segments.date DURING ${input.datePreset ?? "LAST_7_DAYS"}`);
  }

  const campaignIds = (input.campaignIds ?? []).filter((id) => /^\d+$/.test(id));
  if (campaignIds.length > 0) {
    conditions.push(`campaign.id IN (${campaignIds.join(", ")})`);
  }

  const limit = Math.min(Math.max(input.limit ?? 100, 1), 1000);

  return [
    `SELECT ${fields.join(", ")}`,
    `FROM ${resource}`,
    `WHERE ${conditions.join(" AND ")}`,
    `LIMIT ${limit}`,
  ].join(" ");
};

export const buildCampaignsQuery = (input: GetCampaignsInput): string => {
  const statuses = input.status ?? ["ENABLED", "PAUSED"];
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);

  return [
    "SELECT campaign.id, campaign.name, campaign.status,",
    "campaign.advertising_channel_type, campaign.bidding_strategy_type",
    "FROM campaign",
    `WHERE campaign.status IN (${statuses.join(", ")})`,
    `LIMIT ${limit}`,
  ].join(" ");
};

/** Strip the dashes a customer ID carries when copied out of the Google Ads UI. */
export const normalizeCustomerId = (customerId: string): string =>
  customerId.replace(/-/g, "").trim();
