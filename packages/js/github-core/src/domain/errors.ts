import { Data } from "effect";

/**
 * Error when GitHub API request fails
 */
export class GitHubApiError extends Data.TaggedError("GitHubApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly cause?: unknown;
}> {}

/**
 * Error when GitHub rate limit is exceeded
 */
export class GitHubRateLimitError extends Data.TaggedError("GitHubRateLimitError")<{
  readonly message: string;
  readonly resetAt?: Date;
  readonly retryAfter?: number;
}> {}
