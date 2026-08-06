import { describe, expect, it } from "vitest";
import { aov, cpa, cpc, cpm, ctr, cvr, deriveKpis, roas } from "./kpis.js";

describe("KPI formulas", () => {
  it("computes the documented formulas", () => {
    const metrics = {
      impressions: 10_000,
      clicks: 250,
      conversions: 20,
      revenue: 4000,
      spend: 1000,
      orders: 20,
    };

    expect(cpa(metrics)).toBe(50);
    expect(roas(metrics)).toBe(4);
    expect(ctr(metrics)).toBe(2.5);
    expect(cvr(metrics)).toBe(8);
    expect(aov(metrics)).toBe(200);
    expect(cpc(metrics)).toBe(4);
    expect(cpm(metrics)).toBe(100);
  });
});

describe("undefined vs zero", () => {
  // The distinction this whole module exists to preserve: a report that prints
  // "ROAS 0.00" because spend was zero is making a claim it cannot support.
  it("returns undefined on a zero denominator rather than Infinity", () => {
    expect(roas({ revenue: 500, spend: 0 })).toBeUndefined();
    expect(cpa({ spend: 100, conversions: 0 })).toBeUndefined();
    expect(ctr({ clicks: 5, impressions: 0 })).toBeUndefined();
    expect(aov({ revenue: 100, orders: 0 })).toBeUndefined();
  });

  it("returns undefined when an input is absent", () => {
    // GA4 reports no spend at all, so ROAS is unanswerable from GA4 alone.
    expect(roas({ revenue: 500 })).toBeUndefined();
    expect(cpa({ conversions: 10 })).toBeUndefined();
  });

  it("still reports a genuine zero numerator as zero", () => {
    expect(roas({ revenue: 0, spend: 100 })).toBe(0);
    expect(ctr({ clicks: 0, impressions: 1000 })).toBe(0);
  });
});

describe("deriveKpis", () => {
  it("omits what it cannot compute instead of guessing", () => {
    const kpis = deriveKpis({ sessions: 1000, revenue: 250, orders: 5 });

    expect(kpis.aov).toBe(50);
    expect(kpis.roas).toBeUndefined();
    expect(kpis.ctr).toBeUndefined();
    expect(kpis.cpa).toBeUndefined();
  });
});
