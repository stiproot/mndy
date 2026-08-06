/**
 * analytics-core — the platform-agnostic analytics domain.
 *
 * Everything here is reusable machinery: no MCP server, no HTTP, no vendor SDK. An MCP
 * server, a worker or a test can all depend on this without dragging a runtime along.
 * See CLAUDE.md, "Where code lives".
 */

// Domain — pure, no I/O
export {
  CANONICAL_METRICS,
  canonicalMetricName,
  normalizeMetrics,
  sumMetrics,
  type CanonicalMetric,
  type MetricSet,
  type Platform,
} from "./domain/metrics.js";

export {
  aov,
  cpa,
  cpc,
  cpm,
  ctr,
  cvr,
  deriveKpis,
  roas,
  type Kpis,
} from "./domain/kpis.js";

export {
  CREATIVE_FATIGUE_FREQUENCY,
  THRESHOLDS,
  classify,
  detectAnomalies,
  detectCreativeFatigue,
  type Anomaly,
  type CreativeFatigueInput,
  type Severity,
} from "./domain/anomalies.js";

export {
  BrandNotFoundError,
  BrandRegistrySchema,
  BrandSchema,
  NoDefaultBrandError,
  resolveBrand,
  shopifyStoreMatches,
  type Brand,
  type BrandRegistry,
  type BrandRegistryPort,
  type ResolvedBrand,
} from "./domain/brands.js";

export { ConfigError, TimeoutError } from "./domain/errors.js";

export {
  BRAND_TARGETING,
  REPORTING_SEMANTICS,
  buildInstructions,
} from "./domain/guidance.js";

export {
  CurrencyMismatchError,
  DEFAULT_TIMEZONE,
  sumMoney,
  toReportDate,
  type CurrencyCode,
  type Money,
} from "./domain/money.js";

// Infrastructure — adapters. Import these only from a composition root.
export {
  BrandRegistryInvalidError,
  BrandRegistryNotFoundError,
  loadBrandRegistry,
  registrySearchPaths,
} from "./infrastructure/brand-registry.file.js";
