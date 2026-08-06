/**
 * The port the domain exposes to its callers.
 *
 * An MCP tool, a worker, or a test depends on THIS — never on `@google-analytics/data`.
 * Swapping in a fake for tests, or a different transport later, is then a wiring change at
 * the composition root rather than an edit to every call site.
 */

import type { Effect } from "effect";
import type { TimeoutError } from "analytics-core";
import type { GA4ApiError, GA4QuotaError } from "./errors.js";
import type { ReportResult, RunReportInput } from "./models.js";

export type GA4Failure = GA4ApiError | GA4QuotaError | TimeoutError;

export interface GA4ReportReader {
  /** The property used when a call does not name one. */
  readonly defaultPropertyId: string;
  /** Whether credentials were configured; false means calls will fail at auth time. */
  readonly hasCredentials: boolean;
  readonly runReport: (
    input: RunReportInput,
  ) => Effect.Effect<ReportResult, GA4Failure>;
}
