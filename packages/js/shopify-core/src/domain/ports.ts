import type { Effect } from "effect";
import type { TimeoutError } from "analytics-core";
import type {
  ShopifyApiError,
  ShopifyRateLimitError,
  TokenExchangeError,
} from "./errors.js";
import type {
  AnalyticsSummary,
  GetAnalyticsInput,
  GetOrdersInput,
  OrdersResult,
} from "./models.js";

export type ShopifyFailure =
  | ShopifyApiError
  | ShopifyRateLimitError
  | TokenExchangeError
  | TimeoutError;

/**
 * Note the absence of a store parameter: Shopify auth is OAuth bound to one store, so a
 * running server serves exactly one. Brand switching is therefore a *check*, not an
 * override — see `shopifyStoreMatches` in analytics-core.
 */
export interface ShopifyReader {
  readonly storeUrl: string;
  readonly hasCredentials: boolean;
  readonly getOrders: (
    input: GetOrdersInput,
  ) => Effect.Effect<OrdersResult, ShopifyFailure>;
  readonly getAnalytics: (
    input: GetAnalyticsInput,
  ) => Effect.Effect<AnalyticsSummary, ShopifyFailure>;
}
