import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import type { SubmitShopifyDataInput } from "../types.js";
import { submitShopifyDataSchema } from "../types.js";
import { DataCacheSvc } from "../services/data-cache.service.js";
import { calculateCacheTTL } from "../utils/cache-ttl.js";

const logger = createLogger("submit_shopify_data");

/**
 * Effect for submitting Shopify data to the state store cache.
 * Validates and persists the data with automatic TTL based on date range.
 */
const submitShopifyDataEffect = (input: SubmitShopifyDataInput) =>
  Effect.gen(function* () {
    const cacheSvc = yield* DataCacheSvc;

    // Calculate TTL based on date range
    const ttl = calculateCacheTTL(input.stateKey);

    logger.debug("Submitting Shopify data to cache", {
      actorId: input.stateKey,
      dateRange: input.data.dateRange,
      ttl: ttl ? `${ttl}s` : "no expiration",
    });

    // Save to state store with TTL
    const result = yield* cacheSvc.saveData(
      input.stateKey,
      input.data,
      ttl
    );

    logger.info("Shopify data cached successfully", {
      actorId: input.stateKey,
      dateRange: input.data.dateRange,
      totalOrders: input.data.totalOrders,
      cachedAt: result.cachedAt,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              cacheKey: input.stateKey,
              message: "Shopify data cached successfully",
              dateRange: input.data.dateRange,
              metrics: {
                totalRevenue: input.data.totalRevenue,
                totalOrders: input.data.totalOrders,
                averageOrderValue: input.data.averageOrderValue,
              },
              cachedAt: result.cachedAt,
              ttl: ttl ? `${ttl} seconds` : "no expiration",
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        cacheKey: input.stateKey,
        message: "Shopify data cached successfully",
        cachedAt: result.cachedAt,
      },
    };
  }).pipe(
    Effect.catchTag("CacheError", (error) =>
      Effect.succeed({
        content: [
          {
            type: "text" as const,
            text: `Failed to cache Shopify data: ${error.message}${error.key ? ` (key: ${error.key})` : ""}`,
          },
        ],
        isError: true as const,
      })
    )
  );

/**
 * Register the submit_shopify_data tool on the MCP server.
 * This is a structured output tool for Shopify analyst agents to persist collected data.
 */
export function registerSubmitShopifyDataTool(server: McpServer): void {
  server.registerTool(
    "submit_shopify_data",
    {
      title: "Submit Shopify Analytics Data",
      description:
        "Cache Shopify analytics data to the state store. Call this after gathering data using shopify_get_analytics or shopify_get_orders to save the results. The data will be cached with automatic TTL and can be retrieved later for analysis without re-fetching from Shopify.",
      inputSchema: submitShopifyDataSchema,
    },
    (args) => {
      const input: SubmitShopifyDataInput = {
        stateKey: args.stateKey as string,
        data: args.data as SubmitShopifyDataInput["data"],
      };

      return Effect.runPromise(
        submitShopifyDataEffect(input).pipe(Effect.provide(DataCacheSvc.Default))
      );
    }
  );
}
