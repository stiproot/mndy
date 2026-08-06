import { describe, expect, it } from "vitest";
import {
  buildCampaignsQuery,
  buildPerformanceQuery,
  fromMicros,
  identifierFieldsForLevel,
  normalizeCustomerId,
  resourceForLevel,
  selectFieldsFor,
} from "./models.js";

describe("fromMicros", () => {
  // The classic Google Ads bug: reporting 1500000 instead of 1.50.
  it("converts micros to currency units", () => {
    expect(fromMicros(1_500_000)).toBe(1.5);
    expect(fromMicros("2500000")).toBe(2.5);
  });

  it("returns undefined for absent or non-numeric values rather than 0", () => {
    expect(fromMicros(undefined)).toBeUndefined();
    expect(fromMicros(null)).toBeUndefined();
    expect(fromMicros("--")).toBeUndefined();
  });

  it("preserves a genuine zero", () => {
    expect(fromMicros(0)).toBe(0);
  });
});

describe("normalizeCustomerId", () => {
  it("strips the dashes the Google Ads UI shows", () => {
    expect(normalizeCustomerId("123-456-7890")).toBe("1234567890");
  });
});

describe("resourceForLevel / identifierFieldsForLevel", () => {
  it("selects the right GAQL resource per level", () => {
    expect(resourceForLevel("campaign")).toBe("campaign");
    expect(resourceForLevel("keyword")).toBe("keyword_view");
    expect(resourceForLevel("account")).toBe("customer");
  });

  it("adds the identifiers a level's rows need to be attributable", () => {
    expect(identifierFieldsForLevel("account")).toEqual([]);
    expect(identifierFieldsForLevel("keyword")).toContain(
      "ad_group_criterion.keyword.text",
    );
    expect(identifierFieldsForLevel("ad_group")).toContain("campaign.id");
  });
});

describe("selectFieldsFor", () => {
  it("always includes the core metrics", () => {
    const fields = selectFieldsFor("campaign");
    expect(fields).toContain("metrics.cost_micros");
    expect(fields).toContain("metrics.conversions_value");
  });

  it("omits quality metrics unless asked", () => {
    expect(selectFieldsFor("keyword")).not.toContain(
      "ad_group_criterion.quality_info.quality_score",
    );
  });

  it("adds only the quality metrics that exist at that level", () => {
    // Quality score is keyword-level; impression share is campaign/ad-group level.
    // Requesting one where it does not exist fails the whole query, so it is filtered.
    expect(selectFieldsFor("keyword", true)).toContain(
      "ad_group_criterion.quality_info.quality_score",
    );
    expect(selectFieldsFor("campaign", true)).toContain(
      "metrics.search_impression_share",
    );
    expect(selectFieldsFor("account", true)).not.toContain(
      "metrics.search_impression_share",
    );
  });
});

describe("buildPerformanceQuery", () => {
  it("defaults to the last 7 days", () => {
    const query = buildPerformanceQuery({ level: "campaign" });
    expect(query).toContain("segments.date DURING LAST_7_DAYS");
    expect(query).toContain("FROM campaign");
  });

  it("uses an explicit range in preference to a preset", () => {
    const query = buildPerformanceQuery({
      level: "campaign",
      datePreset: "LAST_30_DAYS",
      timeRange: { since: "2026-01-01", until: "2026-01-31" },
    });
    expect(query).toContain("BETWEEN '2026-01-01' AND '2026-01-31'");
    expect(query).not.toContain("DURING");
  });

  it("filters campaign IDs to numerics rather than interpolating them raw", () => {
    // Tool input reaches this function; a non-numeric id would build a malformed
    // (or hostile) query, so it is dropped instead.
    const query = buildPerformanceQuery({
      level: "campaign",
      campaignIds: ["123", "456; DROP", "abc"],
    });
    expect(query).toContain("campaign.id IN (123)");
    expect(query).not.toContain("DROP");
  });

  it("omits the campaign filter entirely when nothing survives filtering", () => {
    const query = buildPerformanceQuery({ level: "campaign", campaignIds: ["oops"] });
    expect(query).not.toContain("campaign.id IN");
  });

  it("clamps the limit into the API's accepted range", () => {
    expect(buildPerformanceQuery({ level: "campaign", limit: 99_999 })).toContain(
      "LIMIT 1000",
    );
    expect(buildPerformanceQuery({ level: "campaign", limit: 0 })).toContain("LIMIT 1");
  });
});

describe("buildCampaignsQuery", () => {
  it("defaults to live campaigns, excluding REMOVED", () => {
    const query = buildCampaignsQuery({});
    expect(query).toContain("campaign.status IN (ENABLED, PAUSED)");
  });

  it("honours an explicit status filter", () => {
    expect(buildCampaignsQuery({ status: ["REMOVED"] })).toContain(
      "campaign.status IN (REMOVED)",
    );
  });

  it("clamps the limit to the documented maximum", () => {
    expect(buildCampaignsQuery({ limit: 5000 })).toContain("LIMIT 500");
  });
});
