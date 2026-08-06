import { describe, expect, it } from "vitest";
import { DEFAULT_INSIGHTS_FIELDS, resolveInsightsFields } from "./models.js";

describe("resolveInsightsFields", () => {
  it("adds the identifier fields a level needs to be attributable", () => {
    // Ad-level rows without ad_id cannot be attributed to anything.
    const fields = resolveInsightsFields("ad", ["spend"]);
    expect(fields).toContain("ad_id");
    expect(fields).toContain("adset_id");
    expect(fields).toContain("campaign_id");
    expect(fields).toContain("spend");
  });

  it("adds nothing at account level, which has no breakdown", () => {
    expect(resolveInsightsFields("account", ["spend"])).toEqual(["spend"]);
  });

  it("never duplicates a field the caller already asked for", () => {
    const fields = resolveInsightsFields("campaign", ["campaign_id", "spend"]);
    expect(fields.filter((f) => f === "campaign_id")).toHaveLength(1);
  });

  it("falls back to the default field set when none is given", () => {
    expect(resolveInsightsFields("campaign")).toEqual(
      expect.arrayContaining([...DEFAULT_INSIGHTS_FIELDS]),
    );
  });

  it("treats an empty request as no request rather than as zero fields", () => {
    expect(resolveInsightsFields("campaign", []).length).toBeGreaterThan(0);
  });
});
