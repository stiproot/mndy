/**
 * Anomaly detection against a trailing baseline.
 *
 * The thresholds come from `.claude/rules/marketing-analytics.md`, where they were prose.
 * Encoding them here means a report and an alert cannot disagree about what "critical"
 * means, and changing a threshold is one edit with tests behind it.
 */

import type { MetricSet } from "./metrics.js";
import { cpa, cpc, ctr, roas } from "./kpis.js";

export type Severity = "ok" | "warning" | "critical";

/** Which direction of change is bad for a given KPI. */
type Direction = "drop" | "spike";

interface ThresholdSpec {
  readonly kpi: "roas" | "cpa" | "ctr";
  readonly direction: Direction;
  /** Fractional change against baseline at which this becomes a warning, e.g. 0.20 = 20%. */
  readonly warning: number;
  /** Fractional change at which it becomes critical. */
  readonly critical: number;
}

export const THRESHOLDS: readonly ThresholdSpec[] = [
  { kpi: "roas", direction: "drop", warning: 0.2, critical: 0.4 },
  { kpi: "cpa", direction: "spike", warning: 0.3, critical: 0.5 },
  { kpi: "ctr", direction: "drop", warning: 0.25, critical: 0.4 },
];

export interface Anomaly {
  readonly kpi: ThresholdSpec["kpi"];
  readonly severity: Severity;
  /** Signed fractional change vs baseline: -0.35 means 35% below baseline. */
  readonly change: number;
  readonly current: number;
  readonly baseline: number;
}

/**
 * Classify one KPI reading against its baseline.
 *
 * Returns `undefined` when no judgement is possible — either value missing, or a zero
 * baseline (against which every change is infinite and therefore meaningless).
 */
export const classify = (
  spec: ThresholdSpec,
  current: number | undefined,
  baseline: number | undefined,
): Anomaly | undefined => {
  if (current === undefined || baseline === undefined || baseline === 0) return undefined;

  const change = (current - baseline) / baseline;
  // A drop is bad when change is negative; a spike when positive. Measure the bad direction.
  const adverse = spec.direction === "drop" ? -change : change;

  const severity: Severity =
    adverse >= spec.critical ? "critical" : adverse >= spec.warning ? "warning" : "ok";

  return { kpi: spec.kpi, severity, change, current, baseline };
};

/**
 * Creative fatigue is a compound signal, not a single-metric threshold: the audience is
 * seeing the ad too often (frequency), engaging less (CTR falling) and costing more
 * (CPC rising) at the same time. Any one alone is noise.
 */
export const CREATIVE_FATIGUE_FREQUENCY = { warning: 3.5, critical: 5 } as const;

export interface CreativeFatigueInput {
  readonly current: MetricSet;
  readonly baseline: MetricSet;
  /** Average impressions per person over the window. */
  readonly frequency: number;
}

export const detectCreativeFatigue = ({
  current,
  baseline,
  frequency,
}: CreativeFatigueInput): Severity => {
  if (frequency > CREATIVE_FATIGUE_FREQUENCY.critical) return "critical";

  const currentCtr = ctr(current);
  const baselineCtr = ctr(baseline);
  const currentCpc = cpc(current);
  const baselineCpc = cpc(baseline);

  const ctrFalling =
    currentCtr !== undefined && baselineCtr !== undefined && currentCtr < baselineCtr;
  const cpcRising =
    currentCpc !== undefined && baselineCpc !== undefined && currentCpc > baselineCpc;

  if (ctrFalling && cpcRising && frequency > CREATIVE_FATIGUE_FREQUENCY.warning) {
    return "warning";
  }

  return "ok";
};

/** Run every threshold against a current-vs-baseline pair, keeping only real findings. */
export const detectAnomalies = (
  current: MetricSet,
  baseline: MetricSet,
): readonly Anomaly[] => {
  const readings: Record<ThresholdSpec["kpi"], [number | undefined, number | undefined]> = {
    roas: [roas(current), roas(baseline)],
    ctr: [ctr(current), ctr(baseline)],
    cpa: [cpa(current), cpa(baseline)],
  };

  return THRESHOLDS.map((spec) => classify(spec, ...readings[spec.kpi])).filter(
    (anomaly): anomaly is Anomaly => anomaly !== undefined && anomaly.severity !== "ok",
  );
};
