import { Data } from "effect";

/** A GA4 Data API call failed. `code` carries the gRPC status where one was returned. */
export class GA4ApiError extends Data.TaggedError("GA4ApiError")<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

/** GA4's per-property quota was exhausted. Distinct from a generic API error: retrying
 *  immediately makes it worse, so callers must back off rather than loop. */
export class GA4QuotaError extends Data.TaggedError("GA4QuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}
