import { Data } from "effect";

/**
 * Error when Shopify API request fails
 */
export class ShopifyApiError extends Data.TaggedError("ShopifyApiError")<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

/**
 * Error when Shopify rate limit is exceeded
 */
export class ShopifyRateLimitError extends Data.TaggedError("ShopifyRateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}

/**
 * Error when OAuth token exchange fails
 */
export class TokenExchangeError extends Data.TaggedError("TokenExchangeError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
