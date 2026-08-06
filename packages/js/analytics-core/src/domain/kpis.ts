/**
 * The derived KPIs, in one place.
 *
 * These formulas previously lived only as prose in `.claude/rules/marketing-analytics.md`,
 * to be re-implemented by hand at each call site. Prose cannot be tested and cannot be
 * imported; two implementations of `roas` will eventually disagree. This module is the
 * single definition, and the rules file now cites it.
 *
 * Every KPI returns `undefined` rather than `NaN`/`Infinity` when its inputs cannot support
 * an answer — a missing input, or a zero denominator. "No answer" and "zero" are different
 * claims, and a report that prints `ROAS 0.00` because spend was zero is lying.
 */

import type { MetricSet } from "./metrics.js";

/** Divide, or return undefined when the result would not be a meaningful number. */
const ratio = (numerator?: number, denominator?: number): number | undefined => {
  if (numerator === undefined || denominator === undefined) return undefined;
  if (denominator === 0) return undefined;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : undefined;
};

/** Cost per acquisition — spend per conversion. */
export const cpa = (metrics: MetricSet): number | undefined =>
  ratio(metrics.spend, metrics.conversions);

/** Return on ad spend — revenue per unit of spend. */
export const roas = (metrics: MetricSet): number | undefined =>
  ratio(metrics.revenue, metrics.spend);

/** Click-through rate, as a percentage. */
export const ctr = (metrics: MetricSet): number | undefined => {
  const value = ratio(metrics.clicks, metrics.impressions);
  return value === undefined ? undefined : value * 100;
};

/** Conversion rate, as a percentage of clicks. */
export const cvr = (metrics: MetricSet): number | undefined => {
  const value = ratio(metrics.conversions, metrics.clicks);
  return value === undefined ? undefined : value * 100;
};

/** Average order value. */
export const aov = (metrics: MetricSet): number | undefined =>
  ratio(metrics.revenue, metrics.orders);

/** Cost per click. */
export const cpc = (metrics: MetricSet): number | undefined =>
  ratio(metrics.spend, metrics.clicks);

/** Cost per mille — spend per thousand impressions. */
export const cpm = (metrics: MetricSet): number | undefined => {
  const value = ratio(metrics.spend, metrics.impressions);
  return value === undefined ? undefined : value * 1000;
};

/** Every derived KPI for a metric set. Absent entries mean "not computable", not zero. */
export interface Kpis {
  readonly cpa?: number;
  readonly roas?: number;
  readonly ctr?: number;
  readonly cvr?: number;
  readonly aov?: number;
  readonly cpc?: number;
  readonly cpm?: number;
}

export const deriveKpis = (metrics: MetricSet): Kpis => ({
  cpa: cpa(metrics),
  roas: roas(metrics),
  ctr: ctr(metrics),
  cvr: cvr(metrics),
  aov: aov(metrics),
  cpc: cpc(metrics),
  cpm: cpm(metrics),
});
