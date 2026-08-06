/**
 * Errors every platform adapter shares.
 *
 * Platform-specific failures (a GA4 quota, a Meta rate limit) belong to that platform's
 * package. These two are genuinely cross-cutting: every outbound call can time out, and
 * every server can be misconfigured, so defining them once keeps the tags stable across
 * packages and lets a caller `catchTag("TimeoutError")` regardless of which platform it
 * was talking to.
 */

import { Data } from "effect";

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  /** The operation that timed out, e.g. "ga4.runReport". */
  readonly operation: string;
  /** Human-readable duration, e.g. "60s". */
  readonly duration?: string;
}> {}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}
