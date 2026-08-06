import { Config, Data, Schema } from "effect";

// =============================================================================
// Tagged Errors
// =============================================================================

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
 * Error when request times out
 */
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly duration: string;
}> {}

/**
 * Error when configuration is invalid or missing
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

/**
 * Error when OAuth token exchange fails
 */
export class TokenExchangeError extends Data.TaggedError("TokenExchangeError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Shopify configuration from environment
 * Uses client credentials grant (OAuth 2.0) for token exchange
 */
export const ShopifyConfig = Config.all({
  clientId: Config.string("SHOPIFY_CLIENT_ID"),
  clientSecret: Config.string("SHOPIFY_CLIENT_SECRET"),
  storeUrl: Config.string("SHOPIFY_STORE_URL"),
  apiVersion: Config.string("SHOPIFY_API_VERSION").pipe(Config.withDefault("2024-10")),
});

/**
 * Server configuration from environment
 */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3005)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

// =============================================================================
// Schemas
// =============================================================================

/**
 * Schema for order financial status
 */
export const FinancialStatusSchema = Schema.Literal(
  "pending",
  "authorized",
  "partially_paid",
  "paid",
  "partially_refunded",
  "refunded",
  "voided",
  "any"
);

export type FinancialStatus = Schema.Schema.Type<typeof FinancialStatusSchema>;

/**
 * Schema for order fulfillment status
 */
export const FulfillmentStatusSchema = Schema.Literal(
  "shipped",
  "partial",
  "unshipped",
  "unfulfilled",
  "any"
);

export type FulfillmentStatus = Schema.Schema.Type<typeof FulfillmentStatusSchema>;

/**
 * Schema for get orders input
 */
export const GetOrdersInputSchema = Schema.Struct({
  limit: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(250))).annotations({
    description: "Maximum number of orders to return (default 50, max 250)",
  }),
  status: Schema.optional(Schema.Literal("open", "closed", "cancelled", "any")).annotations({
    description: "Filter by order status",
  }),
  financialStatus: Schema.optional(FinancialStatusSchema).annotations({
    description: "Filter by financial status",
  }),
  fulfillmentStatus: Schema.optional(FulfillmentStatusSchema).annotations({
    description: "Filter by fulfillment status",
  }),
  createdAtMin: Schema.optional(Schema.String).annotations({
    description: "Show orders created after this date (ISO 8601 format)",
  }),
  createdAtMax: Schema.optional(Schema.String).annotations({
    description: "Show orders created before this date (ISO 8601 format)",
  }),
  updatedAtMin: Schema.optional(Schema.String).annotations({
    description: "Show orders updated after this date (ISO 8601 format)",
  }),
  updatedAtMax: Schema.optional(Schema.String).annotations({
    description: "Show orders updated before this date (ISO 8601 format)",
  }),
  sinceId: Schema.optional(Schema.String).annotations({
    description: "Show orders after this ID for pagination",
  }),
});

export type GetOrdersInput = Schema.Schema.Type<typeof GetOrdersInputSchema>;

/**
 * Schema for get analytics input
 */
export const GetAnalyticsInputSchema = Schema.Struct({
  startDate: Schema.String.annotations({
    description: "Start date (YYYY-MM-DD format)",
  }),
  endDate: Schema.String.annotations({
    description: "End date (YYYY-MM-DD format)",
  }),
});

export type GetAnalyticsInput = Schema.Schema.Type<typeof GetAnalyticsInputSchema>;

/**
 * Schema for line item
 */
export const LineItemSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  quantity: Schema.Number,
  price: Schema.String,
  sku: Schema.optional(Schema.NullOr(Schema.String)),
  variant_id: Schema.optional(Schema.NullOr(Schema.String)),
  product_id: Schema.optional(Schema.NullOr(Schema.String)),
});

export type LineItem = Schema.Schema.Type<typeof LineItemSchema>;

/**
 * Schema for customer
 */
export const CustomerSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.optional(Schema.NullOr(Schema.String)),
  first_name: Schema.optional(Schema.NullOr(Schema.String)),
  last_name: Schema.optional(Schema.NullOr(Schema.String)),
  orders_count: Schema.optional(Schema.Number),
  total_spent: Schema.optional(Schema.String),
});

export type Customer = Schema.Schema.Type<typeof CustomerSchema>;

/**
 * Schema for order
 */
export const OrderSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  order_number: Schema.Number,
  created_at: Schema.String,
  updated_at: Schema.String,
  processed_at: Schema.optional(Schema.NullOr(Schema.String)),
  closed_at: Schema.optional(Schema.NullOr(Schema.String)),
  cancelled_at: Schema.optional(Schema.NullOr(Schema.String)),
  financial_status: Schema.optional(Schema.NullOr(Schema.String)),
  fulfillment_status: Schema.optional(Schema.NullOr(Schema.String)),
  currency: Schema.String,
  total_price: Schema.String,
  subtotal_price: Schema.String,
  total_tax: Schema.String,
  total_discounts: Schema.String,
  total_line_items_price: Schema.String,
  line_items: Schema.Array(LineItemSchema),
  customer: Schema.optional(Schema.NullOr(CustomerSchema)),
  tags: Schema.optional(Schema.String),
  note: Schema.optional(Schema.NullOr(Schema.String)),
});

export type Order = Schema.Schema.Type<typeof OrderSchema>;

/**
 * Schema for orders result
 */
export const OrdersResultSchema = Schema.Struct({
  orders: Schema.Array(OrderSchema),
  count: Schema.Number,
});

export type OrdersResult = Schema.Schema.Type<typeof OrdersResultSchema>;

/**
 * Schema for analytics summary
 */
export const AnalyticsSummarySchema = Schema.Struct({
  totalOrders: Schema.Number,
  totalRevenue: Schema.Number,
  averageOrderValue: Schema.Number,
  totalItemsSold: Schema.Number,
  newCustomers: Schema.Number,
  returningCustomers: Schema.Number,
  dateRange: Schema.Struct({
    start: Schema.String,
    end: Schema.String,
  }),
});

export type AnalyticsSummary = Schema.Schema.Type<typeof AnalyticsSummarySchema>;
