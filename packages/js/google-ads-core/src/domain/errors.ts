import { Data } from "effect";

/** A Google Ads API call failed. */
export class GoogleAdsApiError extends Data.TaggedError("GoogleAdsApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

/** The account's API quota was exhausted. Google Ads quotas are daily, so a retry loop
 *  will not recover — the caller must stop and report. */
export class GoogleAdsQuotaError extends Data.TaggedError("GoogleAdsQuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly dailyLimit?: number;
}> {}

/**
 * Authentication failed. Google Ads needs BOTH an OAuth refresh token and a developer
 * token, and they fail for completely different reasons — the token that failed is named
 * so the user knows which of the two to go and fix.
 */
export class GoogleAdsAuthError extends Data.TaggedError("GoogleAdsAuthError")<{
  readonly message: string;
  readonly authType: "refresh_token" | "developer_token";
}> {}
