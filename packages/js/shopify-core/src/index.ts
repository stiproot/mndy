/**
 * shopify-core — the Shopify commerce domain and its Admin API adapter.
 */

export * from "./domain/models.js";
export {
  ShopifyApiError,
  ShopifyRateLimitError,
  TokenExchangeError,
} from "./domain/errors.js";
export type { ShopifyFailure, ShopifyReader } from "./domain/ports.js";

// Infrastructure — wire this from a composition root only.
export { ShopifyClient, ShopifyConfig } from "./infrastructure/shopify.client.js";
