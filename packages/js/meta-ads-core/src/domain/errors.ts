import { Data } from "effect";

/** A Meta Marketing API call failed. `code`/`subcode` are Meta's own error numbers. */
export class MetaApiError extends Data.TaggedError("MetaApiError")<{
  readonly message: string;
  readonly code?: number;
  readonly subcode?: number;
  readonly cause?: unknown;
}> {}

/** Meta throttled the caller. Retrying without backing off extends the block. */
export class MetaRateLimitError extends Data.TaggedError("MetaRateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}

/**
 * The access token is expired, revoked or invalid.
 *
 * Split out from `MetaApiError` because it is **terminal**: no amount of retrying makes an
 * expired token valid. It previously fell through as a generic `MetaApiError` carrying no
 * error code, which the retry predicate treats as "unknown, therefore transient" — so every
 * expired-token call was retried three times with exponential backoff, turning an instant,
 * actionable failure into an 8-second one and sending Meta four doomed requests.
 */
export class MetaAuthError extends Data.TaggedError("MetaAuthError")<{
  readonly message: string;
  readonly code?: number;
}> {}

/** Meta's error code for an invalid/expired OAuth access token. */
export const META_AUTH_ERROR_CODE = 190;

/**
 * Whether a Meta failure is an authentication problem.
 *
 * Checks the code AND the message, because the SDK does not always surface a structured
 * error body — the expired-token failure observed in practice arrived with a readable
 * message and no code at all.
 */
export const isAuthFailure = (input: {
  readonly code?: number;
  readonly message?: string;
}): boolean => {
  if (input.code === META_AUTH_ERROR_CODE) return true;

  const message = (input.message ?? "").toLowerCase();
  return (
    message.includes("access token") ||
    message.includes("oauthexception") ||
    message.includes("session has expired") ||
    message.includes("session is invalid")
  );
};
