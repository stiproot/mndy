import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { ShopifyClient } from "../services/shopify.js";
import type { GetOrdersInput, OrdersResult } from "../types.js";

const logger = createLogger("shopify_get_orders");

/**
 * Input schema for the shopify_get_orders tool (Zod for MCP SDK compatibility)
 */
export const getOrdersSchema = {
  limit: z.number().min(1).max(250).optional().describe("Maximum number of orders to return (default 50, max 250)"),
  status: z.enum(["open", "closed", "cancelled", "any"]).optional().describe("Filter by order status"),
  financial_status: z
    .enum(["pending", "authorized", "partially_paid", "paid", "partially_refunded", "refunded", "voided", "any"])
    .optional()
    .describe("Filter by financial status"),
  fulfillment_status: z
    .enum(["shipped", "partial", "unshipped", "unfulfilled", "any"])
    .optional()
    .describe("Filter by fulfillment status"),
  created_at_min: z.string().optional().describe("Show orders created after this date (ISO 8601 format)"),
  created_at_max: z.string().optional().describe("Show orders created before this date (ISO 8601 format)"),
  updated_at_min: z.string().optional().describe("Show orders updated after this date (ISO 8601 format)"),
  updated_at_max: z.string().optional().describe("Show orders updated before this date (ISO 8601 format)"),
  since_id: z.string().optional().describe("Show orders after this ID for pagination"),
};

/**
 * Format orders result for display
 */
const formatOrdersResult = (result: OrdersResult): string => {
  const lines: string[] = [];
  lines.push(`## Orders (${result.count} total)`);
  lines.push("");

  if (result.orders.length === 0) {
    lines.push("No orders found matching the criteria.");
    return lines.join("\n");
  }

  result.orders.forEach((order, idx) => {
    lines.push(`### ${idx + 1}. Order ${order.name} (#${order.order_number})`);
    lines.push(`- **ID:** ${order.id}`);
    lines.push(`- **Created:** ${order.created_at}`);
    lines.push(`- **Status:** ${order.financial_status || "N/A"} / ${order.fulfillment_status || "N/A"}`);
    lines.push(`- **Total:** ${order.currency} ${order.total_price}`);

    if (order.customer) {
      const customerName = [order.customer.first_name, order.customer.last_name].filter(Boolean).join(" ") || "N/A";
      lines.push(`- **Customer:** ${customerName} (${order.customer.email || "no email"})`);
    }

    if (order.line_items.length > 0) {
      lines.push(`- **Items (${order.line_items.length}):**`);
      order.line_items.slice(0, 5).forEach((item) => {
        lines.push(`  - ${item.quantity}x ${item.title} @ ${order.currency} ${item.price}`);
      });
      if (order.line_items.length > 5) {
        lines.push(`  - ... and ${order.line_items.length - 5} more items`);
      }
    }

    if (order.tags) {
      lines.push(`- **Tags:** ${order.tags}`);
    }

    lines.push("");
  });

  return lines.join("\n");
};

/**
 * Get orders effect - the core business logic
 */
const getOrdersEffect = (input: GetOrdersInput) =>
  Effect.gen(function* () {
    const client = yield* ShopifyClient;

    logger.debug("Fetching orders with filters", input);

    if (!client.hasCredentials()) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: Shopify credentials not configured. Please set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET environment variables.",
          },
        ],
        isError: true as const,
      };
    }

    const result = yield* client.getOrders(input);

    logger.debug("Orders response", {
      count: result.count,
      orders: result.orders.map((o) => ({
        id: o.id,
        name: o.name,
        total: o.total_price,
      })),
    });

    const formattedResult = formatOrdersResult(result);

    return {
      content: [
        {
          type: "text" as const,
          text: formattedResult,
        },
      ],
      structuredContent: {
        count: result.count,
        orders: result.orders,
      },
    };
  }).pipe(
    Effect.catchTags({
      ShopifyApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Shopify API error: ${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      ShopifyRateLimitError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Shopify rate limit exceeded: ${error.message}${error.retryAfter ? `. Retry after ${error.retryAfter} seconds.` : ""}`,
            },
          ],
          isError: true as const,
        }),
      TimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Request timed out after ${error.duration}: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      TokenExchangeError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Shopify OAuth token exchange failed: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
    })
  );

/**
 * Register the shopify_get_orders tool on the server
 */
export function registerGetOrdersTool(server: McpServer): void {
  server.registerTool(
    "shopify_get_orders",
    {
      title: "Get Shopify Orders",
      description:
        "Fetch orders from a Shopify store with optional filters for status, date range, and pagination",
      inputSchema: getOrdersSchema,
    },
    (args) => {
      const input: GetOrdersInput = {
        limit: args.limit,
        status: args.status,
        financialStatus: args.financial_status,
        fulfillmentStatus: args.fulfillment_status,
        createdAtMin: args.created_at_min,
        createdAtMax: args.created_at_max,
        updatedAtMin: args.updated_at_min,
        updatedAtMax: args.updated_at_max,
        sinceId: args.since_id,
      };

      // Execute Effect at the boundary (MCP SDK expects Promise)
      return Effect.runPromise(
        getOrdersEffect(input).pipe(Effect.provide(ShopifyClient.Default))
      );
    }
  );
}
