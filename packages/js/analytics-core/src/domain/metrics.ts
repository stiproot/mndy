/**
 * The canonical metric vocabulary shared by every advertising and commerce platform.
 *
 * Each platform names the same underlying quantity differently — GA4's `purchaseRevenue`,
 * Meta's `action_value` and Shopify's `total_price` are all *revenue*. Normalizing at the
 * edge means everything downstream (KPI math, anomaly detection, reports) speaks one
 * language, and adding a platform is a new mapping rather than a new special case.
 */

/** The normalized metric names everything downstream works in. */
export const CANONICAL_METRICS = [
  "impressions",
  "clicks",
  "conversions",
  "revenue",
  "spend",
  "sessions",
  "orders",
] as const;

export type CanonicalMetric = (typeof CANONICAL_METRICS)[number];

/** A metric reading normalized to the canonical vocabulary. */
export interface MetricSet {
  readonly impressions?: number;
  readonly clicks?: number;
  readonly conversions?: number;
  readonly revenue?: number;
  readonly spend?: number;
  readonly sessions?: number;
  readonly orders?: number;
}

export type Platform = "ga4" | "meta" | "shopify" | "googleAds";

/**
 * Platform metric name → canonical name.
 *
 * A platform that simply has no analogue for a metric omits it; that is meaningful, and
 * distinct from the metric being present and zero. GA4 reports no spend, Shopify no
 * impressions.
 */
const PLATFORM_METRIC_NAMES: Record<Platform, Readonly<Record<string, CanonicalMetric>>> = {
  ga4: {
    impressions: "impressions",
    clicks: "clicks",
    conversions: "conversions",
    purchaseRevenue: "revenue",
    totalRevenue: "revenue",
    sessions: "sessions",
    ecommercePurchases: "orders",
  },
  meta: {
    impressions: "impressions",
    clicks: "clicks",
    actions: "conversions",
    action_value: "revenue",
    spend: "spend",
  },
  shopify: {
    orders: "orders",
    total_price: "revenue",
  },
  googleAds: {
    impressions: "impressions",
    clicks: "clicks",
    conversions: "conversions",
    conversions_value: "revenue",
    cost_micros: "spend",
  },
};

/** Look up the canonical name for a platform's metric, or undefined when unmapped. */
export const canonicalMetricName = (
  platform: Platform,
  platformMetric: string,
): CanonicalMetric | undefined => PLATFORM_METRIC_NAMES[platform][platformMetric];

/**
 * Normalize a platform's raw metric bag into the canonical vocabulary.
 *
 * Unmapped keys are dropped rather than passed through — the whole point is that a
 * downstream consumer can trust every key it sees is canonical. Values that are not finite
 * numbers (a platform returning `"—"`, `null`, or a string) are dropped too, so callers
 * never have to defend against NaN leaking into arithmetic.
 */
export const normalizeMetrics = (
  platform: Platform,
  raw: Readonly<Record<string, unknown>>,
): MetricSet => {
  const normalized: Record<string, number> = {};

  for (const [key, value] of Object.entries(raw)) {
    const canonical = canonicalMetricName(platform, key);
    if (!canonical) continue;

    const numeric = typeof value === "string" ? Number(value) : value;
    if (typeof numeric !== "number" || !Number.isFinite(numeric)) continue;

    // Google Ads reports spend in micros (millionths of the account currency).
    const scaled =
      platform === "googleAds" && key === "cost_micros" ? numeric / 1_000_000 : numeric;

    normalized[canonical] = (normalized[canonical] ?? 0) + scaled;
  }

  return normalized as MetricSet;
};

/** Sum metric sets element-wise, e.g. to roll daily rows up to a period total. */
export const sumMetrics = (sets: readonly MetricSet[]): MetricSet => {
  const total: Record<string, number> = {};

  for (const set of sets) {
    for (const metric of CANONICAL_METRICS) {
      const value = set[metric];
      if (value === undefined) continue;
      total[metric] = (total[metric] ?? 0) + value;
    }
  }

  return total as MetricSet;
};
