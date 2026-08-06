import { describe, expect, it } from "vitest";
import { classify, detectAnomalies, detectCreativeFatigue, THRESHOLDS } from "./anomalies.js";

const spec = (kpi: "roas" | "cpa" | "ctr") => THRESHOLDS.find((t) => t.kpi === kpi)!;

describe("classify", () => {
  it("grades a ROAS drop against the documented thresholds", () => {
    expect(classify(spec("roas"), 4.5, 5)!.severity).toBe("ok"); // -10%
    expect(classify(spec("roas"), 3.9, 5)!.severity).toBe("warning"); // -22%
    expect(classify(spec("roas"), 2.9, 5)!.severity).toBe("critical"); // -42%
  });

  it("grades a CPA spike in the opposite direction", () => {
    expect(classify(spec("cpa"), 110, 100)!.severity).toBe("ok"); // +10%
    expect(classify(spec("cpa"), 135, 100)!.severity).toBe("warning"); // +35%
    expect(classify(spec("cpa"), 160, 100)!.severity).toBe("critical"); // +60%
  });

  it("does not treat an improvement as an anomaly", () => {
    // ROAS going UP is not a ROAS drop, however large the move.
    expect(classify(spec("roas"), 10, 5)!.severity).toBe("ok");
    // CPA going DOWN is not a CPA spike.
    expect(classify(spec("cpa"), 40, 100)!.severity).toBe("ok");
  });

  it("declines to judge against a zero or missing baseline", () => {
    expect(classify(spec("roas"), 4, 0)).toBeUndefined();
    expect(classify(spec("roas"), 4, undefined)).toBeUndefined();
    expect(classify(spec("roas"), undefined, 5)).toBeUndefined();
  });
});

describe("detectAnomalies", () => {
  it("reports only the KPIs that breached, not the healthy ones", () => {
    const baseline = { impressions: 10_000, clicks: 300, conversions: 30, revenue: 3000, spend: 1000 };
    // Revenue halves: ROAS 3.0 -> 1.5 (-50%, critical). CTR and CPA also move.
    const current = { impressions: 10_000, clicks: 300, conversions: 30, revenue: 1500, spend: 1000 };

    const found = detectAnomalies(current, baseline);
    const roasFinding = found.find((a) => a.kpi === "roas");

    expect(roasFinding?.severity).toBe("critical");
    expect(found.every((a) => a.severity !== "ok")).toBe(true);
  });

  it("finds nothing when performance is flat", () => {
    const metrics = { impressions: 10_000, clicks: 300, conversions: 30, revenue: 3000, spend: 1000 };
    expect(detectAnomalies(metrics, metrics)).toEqual([]);
  });
});

describe("detectCreativeFatigue", () => {
  const baseline = { impressions: 10_000, clicks: 400, spend: 800 };
  const worse = { impressions: 10_000, clicks: 200, spend: 1000 }; // CTR down, CPC up

  it("is critical on frequency alone once it passes 5", () => {
    expect(detectCreativeFatigue({ current: baseline, baseline, frequency: 5.5 })).toBe(
      "critical",
    );
  });

  it("warns only when all three signals agree", () => {
    expect(detectCreativeFatigue({ current: worse, baseline, frequency: 4 })).toBe("warning");
  });

  it("stays ok when frequency is low, however bad the other signals", () => {
    // A single moving metric is noise — the compound condition is the point.
    expect(detectCreativeFatigue({ current: worse, baseline, frequency: 2 })).toBe("ok");
  });

  it("stays ok when frequency is high but engagement has not degraded", () => {
    expect(detectCreativeFatigue({ current: baseline, baseline, frequency: 4 })).toBe("ok");
  });
});
