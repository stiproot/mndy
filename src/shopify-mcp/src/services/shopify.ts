import { Duration, Effect, Schedule } from "effect";
import type { GetOrdersInput, Order, OrdersResult, GetAnalyticsInput, AnalyticsSummary, LineItem, Customer } from "../types.js";
import { ShopifyApiError, ShopifyRateLimitError, TimeoutError, ShopifyConfig } from "../types.js";

const REQUEST_TIMEOUT = Duration.seconds(60);
const MAX_RETRIES = 3;

/**
 * Retry schedule with exponential backoff and jitter
 */
const retrySchedule = Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES))
);

/**
 * Check if an error is retryable (transient)
 */
const isRetryableError = (error: ShopifyApiError): boolean => {
  const code = error.code;
  if (!code) return true;
  return code === "429" || code === "500" || code === "502" || code === "503" || code === "504";
};

/**
 * Wrap Shopify API call with timeout, error handling, and retry
 */
const withApiResilience = <T>(
  effect: Effect.Effect<T, ShopifyApiError | ShopifyRateLimitError, never>,
  spanName: string,
  attributes: Record<string, string | number>
): Effect.Effect<T, ShopifyApiError | ShopifyRateLimitError | TimeoutError> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "Shopify API request timed out",
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "ShopifyApiError" && isRetryableError(error),
    })
  );

/**
 * Build Shopify Admin API URL
 */
const buildApiUrl = (storeUrl: string, apiVersion: string, resource: string): string => {
  const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${cleanStoreUrl}/admin/api/${apiVersion}/${resource}.json`;
};

/**
 * Make authenticated request to Shopify Admin API (internal helper)
 */
const fetchResponse = (
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Effect.Effect<Response, ShopifyApiError> =>
  Effect.tryPromise({
    try: () =>
      fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
          ...options.headers,
        },
      }),
    catch: (error) =>
      new ShopifyApiError({
        message: error instanceof Error ? error.message : "Fetch failed",
        cause: error,
      }),
  });

/**
 * Handle error response from Shopify API
 */
const handleErrorResponse = (
  response: Response
): Effect.Effect<never, ShopifyApiError | ShopifyRateLimitError> =>
  Effect.tryPromise({
    try: () => response.text(),
    catch: () => new ShopifyApiError({ message: "Failed to read error response" }),
  }).pipe(
    Effect.mapError((e): ShopifyApiError | ShopifyRateLimitError => e),
    Effect.flatMap((errorText): Effect.Effect<never, ShopifyApiError | ShopifyRateLimitError> => {
      if (response.status === 429) {
        return Effect.fail(
          new ShopifyRateLimitError({
            message: `Shopify rate limit exceeded: ${errorText}`,
            retryAfter: 2,
          })
        );
      }
      return Effect.fail(
        new ShopifyApiError({
          message: `Shopify API error (${response.status}): ${errorText}`,
          code: response.status.toString(),
        })
      );
    })
  );

/**
 * Parse JSON response from Shopify API
 */
const parseJsonResponse = <T>(response: Response): Effect.Effect<T, ShopifyApiError> =>
  Effect.tryPromise({
    try: () => response.json() as Promise<T>,
    catch: (error) =>
      new ShopifyApiError({
        message: "Failed to parse JSON response",
        cause: error,
      }),
  });

/**
 * Make authenticated request to Shopify Admin API
 */
const shopifyFetch = <T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Effect.Effect<T, ShopifyApiError | ShopifyRateLimitError> =>
  fetchResponse(url, accessToken, options).pipe(
    Effect.flatMap((response) =>
      response.ok
        ? parseJsonResponse<T>(response)
        : handleErrorResponse(response)
    )
  );

/**
 * ShopifyClient service interface
 */
export class ShopifyClient extends Effect.Service<ShopifyClient>()("ShopifyClient", {
  effect: Effect.gen(function* () {
    const config = yield* ShopifyConfig;

    const accessToken = config.accessToken;
    const storeUrl = config.storeUrl;
    const apiVersion = config.apiVersion;

    return {
      /**
       * Check if access token is configured
       */
      hasAccessToken: (): boolean => accessToken !== "",

      /**
       * Get the store URL
       */
      getStoreUrl: (): string => storeUrl,

      /**
       * Get orders from the store
       */
      getOrders: (
        input: GetOrdersInput
      ): Effect.Effect<OrdersResult, ShopifyApiError | ShopifyRateLimitError | TimeoutError> => {
        const fetchOrders = Effect.gen(function* () {
          // Build query parameters
          const params = new URLSearchParams();
          if (input.limit) params.set("limit", input.limit.toString());
          if (input.status) params.set("status", input.status);
          if (input.financialStatus) params.set("financial_status", input.financialStatus);
          if (input.fulfillmentStatus) params.set("fulfillment_status", input.fulfillmentStatus);
          if (input.createdAtMin) params.set("created_at_min", input.createdAtMin);
          if (input.createdAtMax) params.set("created_at_max", input.createdAtMax);
          if (input.updatedAtMin) params.set("updated_at_min", input.updatedAtMin);
          if (input.updatedAtMax) params.set("updated_at_max", input.updatedAtMax);
          if (input.sinceId) params.set("since_id", input.sinceId);

          const url = buildApiUrl(storeUrl, apiVersion, "orders");
          const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

          const response = yield* shopifyFetch<{ orders: unknown[] }>(fullUrl, accessToken);

          const orders: Order[] = response.orders.map((o: unknown) => {
            const order = o as Record<string, unknown>;
            return {
              id: String(order.id),
              name: order.name as string,
              order_number: order.order_number as number,
              created_at: order.created_at as string,
              updated_at: order.updated_at as string,
              processed_at: order.processed_at as string | null | undefined,
              closed_at: order.closed_at as string | null | undefined,
              cancelled_at: order.cancelled_at as string | null | undefined,
              financial_status: order.financial_status as string | null | undefined,
              fulfillment_status: order.fulfillment_status as string | null | undefined,
              currency: order.currency as string,
              total_price: order.total_price as string,
              subtotal_price: order.subtotal_price as string,
              total_tax: order.total_tax as string,
              total_discounts: order.total_discounts as string,
              total_line_items_price: order.total_line_items_price as string,
              line_items: ((order.line_items as unknown[]) || []).map((li: unknown) => {
                const item = li as Record<string, unknown>;
                return {
                  id: String(item.id),
                  title: item.title as string,
                  quantity: item.quantity as number,
                  price: item.price as string,
                  sku: item.sku as string | null | undefined,
                  variant_id: item.variant_id ? String(item.variant_id) : null,
                  product_id: item.product_id ? String(item.product_id) : null,
                } as LineItem;
              }),
              customer: order.customer
                ? {
                    id: String((order.customer as Record<string, unknown>).id),
                    email: (order.customer as Record<string, unknown>).email as string | null | undefined,
                    first_name: (order.customer as Record<string, unknown>).first_name as string | null | undefined,
                    last_name: (order.customer as Record<string, unknown>).last_name as string | null | undefined,
                    orders_count: (order.customer as Record<string, unknown>).orders_count as number | undefined,
                    total_spent: (order.customer as Record<string, unknown>).total_spent as string | undefined,
                  } as Customer
                : null,
              tags: order.tags as string | undefined,
              note: order.note as string | null | undefined,
            };
          });

          return {
            orders,
            count: orders.length,
          };
        });

        return withApiResilience(
          fetchOrders,
          "shopify.getOrders",
          {
            "shopify.storeUrl": storeUrl,
            "shopify.limit": input.limit || 50,
          }
        ).pipe(Effect.withSpan("ShopifyClient.getOrders"));
      },

      /**
       * Calculate analytics summary for a date range
       */
      getAnalytics: (
        input: GetAnalyticsInput
      ): Effect.Effect<AnalyticsSummary, ShopifyApiError | ShopifyRateLimitError | TimeoutError> => {
        const fetchAnalytics = Effect.gen(function* () {
          // Fetch all orders in the date range
          const params = new URLSearchParams({
            status: "any",
            created_at_min: `${input.startDate}T00:00:00Z`,
            created_at_max: `${input.endDate}T23:59:59Z`,
            limit: "250",
          });

          const url = buildApiUrl(storeUrl, apiVersion, "orders");
          const fullUrl = `${url}?${params.toString()}`;

          const response = yield* shopifyFetch<{ orders: unknown[] }>(fullUrl, accessToken);

          const orders = response.orders as Array<Record<string, unknown>>;

          // Calculate analytics
          let totalRevenue = 0;
          let totalItemsSold = 0;
          const customerIds = new Set<string>();
          const newCustomerIds = new Set<string>();

          orders.forEach((order) => {
            totalRevenue += parseFloat(order.total_price as string);

            const lineItems = (order.line_items as Array<Record<string, unknown>>) || [];
            lineItems.forEach((item) => {
              totalItemsSold += item.quantity as number;
            });

            const customer = order.customer as Record<string, unknown> | null;
            if (customer) {
              const customerId = String(customer.id);
              customerIds.add(customerId);

              // Check if new customer (first order)
              const ordersCount = customer.orders_count as number | undefined;
              if (ordersCount === 1) {
                newCustomerIds.add(customerId);
              }
            }
          });

          const totalOrders = orders.length;
          const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

          return {
            totalOrders,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            totalItemsSold,
            newCustomers: newCustomerIds.size,
            returningCustomers: customerIds.size - newCustomerIds.size,
            dateRange: {
              start: input.startDate,
              end: input.endDate,
            },
          };
        });

        return withApiResilience(
          fetchAnalytics,
          "shopify.getAnalytics",
          {
            "shopify.storeUrl": storeUrl,
            "shopify.startDate": input.startDate,
            "shopify.endDate": input.endDate,
          }
        ).pipe(Effect.withSpan("ShopifyClient.getAnalytics"));
      },
    };
  }),
}) {}

/**
 * Live layer for ShopifyClient
 */
export const ShopifyClientLive = ShopifyClient.Default;
