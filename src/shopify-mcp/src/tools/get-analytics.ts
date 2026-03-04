import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { ShopifyClient } from "../services/shopify.js";
import type { GetAnalyticsInput, AnalyticsSummary } from "../types.js";

const logger = createLogger("shopify_get_analytics");

/**
 * Input schema for the shopify_get_analytics tool (Zod for MCP SDK compatibility)
 */
export const getAnalyticsSchema = {
  start_date: z.string().describe("Start date for analytics period (YYYY-MM-DD format)"),
  end_date: z.string().describe("End date for analytics period (YYYY-MM-DD format)"),
};

/**
 * Format analytics summary for display
 */
const formatAnalyticsSummary = (summary: AnalyticsSummary): string => {
  const lines: string[] = [];
  lines.push(`## Shopify Analytics Summary`);
  lines.push(`**Date Range:** ${summary.dateRange.start} to ${summary.dateRange.end}`);
  lines.push("");
  lines.push(`### Key Metrics`);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Orders | ${summary.totalOrders.toLocaleString()} |`);
  lines.push(`| Total Revenue | $${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} |`);
  lines.push(`| Average Order Value | $${summary.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} |`);
  lines.push(`| Total Items Sold | ${summary.totalItemsSold.toLocaleString()} |`);
  lines.push("");
  lines.push(`### Customer Breakdown`);
  lines.push(`| Type | Count |`);
  lines.push(`|------|-------|`);
  lines.push(`| New Customers | ${summary.newCustomers.toLocaleString()} |`);
  lines.push(`| Returning Customers | ${summary.returningCustomers.toLocaleString()} |`);
  lines.push(`| Total Unique Customers | ${(summary.newCustomers + summary.returningCustomers).toLocaleString()} |`);
  lines.push("");

  if (summary.totalOrders > 0) {
    const repeatRate = (summary.returningCustomers / (summary.newCustomers + summary.returningCustomers)) * 100;
    lines.push(`**Repeat Customer Rate:** ${repeatRate.toFixed(1)}%`);
  }

  return lines.join("\n");
};

/**
 * Get analytics effect - the core business logic
 */
const getAnalyticsEffect = (input: GetAnalyticsInput) =>
  Effect.gen(function* () {
    const client = yield* ShopifyClient;

    logger.debug("Fetching analytics for date range", input);

    if (!client.hasAccessToken()) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: Shopify access token not configured. Please set SHOPIFY_ACCESS_TOKEN environment variable.",
          },
        ],
        isError: true as const,
      };
    }

    const result = yield* client.getAnalytics(input);

    logger.debug("Analytics response", {
      totalOrders: result.totalOrders,
      totalRevenue: result.totalRevenue,
      averageOrderValue: result.averageOrderValue,
    });

    const formattedResult = formatAnalyticsSummary(result);

    return {
      content: [
        {
          type: "text" as const,
          text: formattedResult,
        },
      ],
      structuredContent: result,
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
    })
  );

/**
 * Register the shopify_get_analytics tool on the server
 */
export function registerGetAnalyticsTool(server: McpServer): void {
  server.registerTool(
    "shopify_get_analytics",
    {
      title: "Get Shopify Analytics",
      description:
        "Calculate analytics summary for a Shopify store over a date range, including revenue, order counts, average order value, and customer metrics",
      inputSchema: getAnalyticsSchema,
    },
    (args) => {
      const input: GetAnalyticsInput = {
        startDate: args.start_date,
        endDate: args.end_date,
      };

      // Execute Effect at the boundary (MCP SDK expects Promise)
      return Effect.runPromise(
        getAnalyticsEffect(input).pipe(Effect.provide(ShopifyClient.Default))
      );
    }
  );
}
