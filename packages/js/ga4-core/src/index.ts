/**
 * ga4-core — the Google Analytics 4 reporting domain and its Data API adapter.
 *
 * `apps/ga4-mcp` is a container around this: it declares tool schemas and wires the
 * service. Any other consumer (a worker, a report generator, a test) depends on this
 * package directly.
 */

export {
  COMMON_DIMENSIONS,
  COMMON_METRICS,
  type DateRange,
  type Dimension,
  type DimensionFilter,
  type Metric,
  type ReportResult,
  type ReportRow,
  type RunReportInput,
  type StringMatchType,
} from "./domain/models.js";

export { GA4ApiError, GA4QuotaError } from "./domain/errors.js";
export type { GA4Failure, GA4ReportReader } from "./domain/ports.js";

// Infrastructure — wire this from a composition root only.
export { GA4Client, GA4Config } from "./infrastructure/ga4.client.js";
