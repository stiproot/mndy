/**
 * The Meta Ads reporting domain.
 *
 * Field names keep Meta's snake_case exactly as the API returns them: this data is passed
 * through to an agent, and silently renaming `action_values` to `actionValues` would make
 * every Meta doc and every existing report query wrong. Normalization to the shared
 * vocabulary is `analytics-core`'s job, applied deliberately rather than by accident.
 */

export type DatePreset =
  | "today"
  | "yesterday"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "maximum"
  | "last_3d"
  | "last_7d"
  | "last_14d"
  | "last_28d"
  | "last_30d"
  | "last_90d"
  | "last_week_mon_sun"
  | "last_week_sun_sat"
  | "last_quarter"
  | "last_year"
  | "this_week_mon_today"
  | "this_week_sun_today"
  | "this_year";

export const DATE_PRESETS: readonly DatePreset[] = [
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
  "this_year",
];

export interface TimeRange {
  readonly since: string;
  readonly until: string;
}

/** Aggregation level. Each level down adds its own identifier fields to the result. */
export type Level = "account" | "campaign" | "adset" | "ad";

export const LEVELS: readonly Level[] = ["account", "campaign", "adset", "ad"];

export interface GetInsightsInput {
  /**
   * Overrides the server's configured ad account for this call — the per-call targeting
   * that lets one running server serve every brand.
   */
  readonly adAccountId?: string;
  readonly level?: Level;
  readonly datePreset?: DatePreset;
  readonly timeRange?: TimeRange;
  readonly campaignIds?: readonly string[];
  readonly fields?: readonly string[];
  readonly limit?: number;
}

export interface CampaignInfo {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly objective?: string;
  readonly buying_type?: string;
}

export interface InsightsData {
  readonly campaign_id?: string;
  readonly campaign_name?: string;
  readonly adset_id?: string;
  readonly adset_name?: string;
  readonly ad_id?: string;
  readonly ad_name?: string;
  readonly date_start: string;
  readonly date_stop: string;
  readonly spend?: string;
  readonly impressions?: string;
  readonly clicks?: string;
  readonly reach?: string;
  readonly ctr?: string;
  readonly cpc?: string;
  readonly cpm?: string;
  readonly cpp?: string;
  readonly frequency?: string;
  readonly conversions?: string;
  readonly conversion_values?: string;
  readonly cost_per_conversion?: string;
  readonly purchase_roas?: readonly unknown[];
  readonly actions?: readonly unknown[];
  readonly action_values?: readonly unknown[];
}

export interface InsightsResult {
  readonly data: readonly InsightsData[];
  readonly paging?: {
    readonly cursors?: { readonly before?: string; readonly after?: string };
    readonly next?: string;
  };
  readonly summary?: unknown;
}

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

export const ALL_INSIGHTS_FIELDS = [
  "account_id",
  "account_name",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "date_start",
  "date_stop",
  "spend",
  "impressions",
  "clicks",
  "reach",
  "ctr",
  "cpc",
  "cpm",
  "cpp",
  "frequency",
  "actions",
  "action_values",
  "conversions",
  "conversion_values",
  "cost_per_action_type",
  "cost_per_conversion",
  "purchase_roas",
  "website_purchase_roas",
  "video_avg_time_watched_actions",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p100_watched_actions",
  "quality_ranking",
  "engagement_rate_ranking",
  "conversion_rate_ranking",
] as const;

/**
 * The identifier fields a given level needs in its results.
 *
 * Asking for `level: "ad"` without `ad_id` yields rows you cannot attribute to anything,
 * so these are merged into the requested field list rather than left to the caller.
 */
export const identifierFieldsForLevel = (level: Level): readonly string[] => {
  switch (level) {
    case "account":
      return [];
    case "campaign":
      return ["campaign_id", "campaign_name"];
    case "adset":
      return ["campaign_id", "campaign_name", "adset_id", "adset_name"];
    case "ad":
      return [
        "campaign_id",
        "campaign_name",
        "adset_id",
        "adset_name",
        "ad_id",
        "ad_name",
      ];
  }
};

/** Requested fields with the level's identifiers prepended, de-duplicated. */
export const resolveInsightsFields = (
  level: Level,
  requested?: readonly string[],
): readonly string[] => {
  const base = requested && requested.length > 0 ? requested : DEFAULT_INSIGHTS_FIELDS;
  return [...new Set([...identifierFieldsForLevel(level), ...base])];
};
