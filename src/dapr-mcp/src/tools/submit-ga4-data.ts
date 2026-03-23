import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import type { SubmitGA4DataInput } from "../types.js";
import { submitGA4DataSchema } from "../types.js";
import { DataCacheSvc } from "../services/data-cache.service.js";
import { calculateCacheTTL } from "../utils/cache-ttl.js";

const logger = createLogger("submit_ga4_data");

/**
 * Effect for submitting GA4 data to the state store cache.
 * Validates and persists the data with automatic TTL based on date range.
 */
const submitGA4DataEffect = (input: SubmitGA4DataInput) =>
  Effect.gen(function* () {
    const cacheSvc = yield* DataCacheSvc;

    // Calculate TTL based on date range
    const ttl = calculateCacheTTL(input.actorId);

    logger.debug("Submitting GA4 data to cache", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
      ttl: ttl ? `${ttl}s` : "no expiration",
    });

    // Save to state store with TTL
    const result = yield* cacheSvc.saveData(
      input.actorId,
      input.data,
      ttl
    );

    logger.info("GA4 data cached successfully", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
      sessions: input.data.sessions,
      cachedAt: result.cachedAt,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              cacheKey: input.actorId,
              message: "GA4 data cached successfully",
              dateRange: input.data.dateRange,
              metrics: {
                sessions: input.data.sessions,
                activeUsers: input.data.activeUsers,
                conversions: input.data.conversions,
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
        cacheKey: input.actorId,
        message: "GA4 data cached successfully",
        cachedAt: result.cachedAt,
      },
    };
  }).pipe(
    Effect.catchTag("CacheError", (error) =>
      Effect.succeed({
        content: [
          {
            type: "text" as const,
            text: `Failed to cache GA4 data: ${error.message}${error.key ? ` (key: ${error.key})` : ""}`,
          },
        ],
        isError: true as const,
      })
    )
  );

/**
 * Register the submit_ga4_data tool on the MCP server.
 * This is a structured output tool for GA4 analyst agents to persist collected data.
 */
export function registerSubmitGA4DataTool(server: McpServer): void {
  server.registerTool(
    "submit_ga4_data",
    {
      title: "Submit GA4 Analytics Data",
      description:
        "Cache GA4 analytics data to the state store. Call this after gathering data using ga4_run_report to save the results. The data will be cached with automatic TTL and can be retrieved later for analysis without re-fetching from GA4.",
      inputSchema: submitGA4DataSchema,
    },
    (args) => {
      const input: SubmitGA4DataInput = {
        actorId: args.actorId as string,
        data: args.data as SubmitGA4DataInput["data"],
      };

      return Effect.runPromise(
        submitGA4DataEffect(input).pipe(Effect.provide(DataCacheSvc.Default))
      );
    }
  );
}
