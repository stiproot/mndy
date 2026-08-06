import { describe, expect, it } from "vitest";
import { canonicalMetricName, normalizeMetrics, sumMetrics } from "./metrics.js";

describe("canonicalMetricName", () => {
  it("maps each platform's name for the same quantity onto one canonical name", () => {
    expect(canonicalMetricName("ga4", "purchaseRevenue")).toBe("revenue");
    expect(canonicalMetricName("meta", "action_value")).toBe("revenue");
    expect(canonicalMetricName("shopify", "total_price")).toBe("revenue");
    expect(canonicalMetricName("googleAds", "conversions_value")).toBe("revenue");
  });

  it("returns undefined for a metric the platform does not report", () => {
    // GA4 has no notion of ad spend.
    expect(canonicalMetricName("ga4", "spend")).toBeUndefined();
    expect(canonicalMetricName("shopify", "impressions")).toBeUndefined();
  });
});

describe("normalizeMetrics", () => {
  it("renames mapped keys and drops unmapped ones", () => {
    const result = normalizeMetrics("meta", {
      impressions: 1000,
      spend: 42,
      action_value: 300,
      some_meta_only_field: 7,
    });

    expect(result).toEqual({ impressions: 1000, spend: 42, revenue: 300 });
  });

  it("coerces numeric strings, which the platform APIs return freely", () => {
    expect(normalizeMetrics("ga4", { sessions: "1234" })).toEqual({ sessions: 1234 });
  });

  it("drops non-numeric values rather than letting NaN into arithmetic", () => {
    expect(normalizeMetrics("ga4", { sessions: "—", clicks: null })).toEqual({});
  });

  it("converts Google Ads micros to currency units", () => {
    // cost_micros is millionths; 1_500_000 micros is 1.50 in the account currency.
    expect(normalizeMetrics("googleAds", { cost_micros: 1_500_000 })).toEqual({
      spend: 1.5,
    });
  });

  it("sums when two platform keys collapse to the same canonical metric", () => {
    expect(normalizeMetrics("ga4", { purchaseRevenue: 100, totalRevenue: 50 })).toEqual({
      revenue: 150,
    });
  });
});

describe("sumMetrics", () => {
  it("adds element-wise, keeping absent metrics absent", () => {
    const total = sumMetrics([
      { clicks: 10, spend: 5 },
      { clicks: 3, revenue: 20 },
    ]);

    expect(total).toEqual({ clicks: 13, spend: 5, revenue: 20 });
    expect(total.impressions).toBeUndefined();
  });

  it("returns an empty set for no input", () => {
    expect(sumMetrics([])).toEqual({});
  });
});
