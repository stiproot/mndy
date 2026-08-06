/**
 * The GA4 reporting domain — the shapes, independent of how they are fetched or exposed.
 *
 * These are plain types rather than Effect Schemas. The inbound MCP adapter validates
 * arguments at the boundary (with zod, which is what the MCP SDK speaks), and the outbound
 * adapter maps the vendor response onto these; nothing in between needs a second runtime
 * validation pass. The previous code carried BOTH a zod schema and a parallel Effect Schema
 * of the same input, and the Effect one was dead — two declarations of one shape is a
 * standing invitation for them to diverge.
 */

export interface DateRange {
  readonly startDate: string;
  readonly endDate: string;
}

export interface Dimension {
  readonly name: string;
}

export interface Metric {
  readonly name: string;
}

export type StringMatchType =
  | "EXACT"
  | "BEGINS_WITH"
  | "ENDS_WITH"
  | "CONTAINS"
  | "FULL_REGEXP"
  | "PARTIAL_REGEXP";

export interface DimensionFilter {
  readonly fieldName: string;
  readonly stringFilter?: {
    readonly matchType: StringMatchType;
    readonly value: string;
    readonly caseSensitive?: boolean;
  };
  readonly inListFilter?: {
    readonly values: readonly string[];
    readonly caseSensitive?: boolean;
  };
}

export interface RunReportInput {
  /**
   * Overrides the server's configured property for this call. This is what lets ONE
   * running server serve every brand — see `.claude/rules/marketing-analytics.md`.
   */
  readonly propertyId?: string;
  readonly dateRanges: readonly DateRange[];
  readonly dimensions?: readonly Dimension[];
  readonly metrics: readonly Metric[];
  readonly dimensionFilter?: DimensionFilter;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ReportRow {
  readonly dimensionValues?: readonly { readonly value: string }[];
  readonly metricValues: readonly { readonly value: string }[];
}

export interface ReportResult {
  readonly dimensionHeaders?: readonly { readonly name: string }[];
  readonly metricHeaders: readonly { readonly name: string; readonly type: string }[];
  readonly rows: readonly ReportRow[];
  readonly rowCount: number;
  readonly metadata?: {
    readonly currencyCode?: string;
    readonly timeZone?: string;
  };
}

/** GA4 dimensions worth suggesting to an agent choosing a report. */
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

/** GA4 metrics worth suggesting to an agent choosing a report. */
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
