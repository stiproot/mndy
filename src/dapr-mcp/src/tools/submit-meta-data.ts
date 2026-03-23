import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import type { SubmitMetaDataInput } from "../types.js";
import { submitMetaDataSchema } from "../types.js";
import { DataCacheSvc } from "../services/data-cache.service.js";
import { calculateCacheTTL } from "../utils/cache-ttl.js";

const logger = createLogger("submit_meta_data");

/**
 * Effect for submitting Meta Ads data to the state store cache.
 * Validates and persists the data with automatic TTL based on date range.
 *
 * NOTE: This FIXES the missing MetaDataActor bug - previously this tool
 * referenced a non-existent actor, causing Meta caching to fail.
 */
const submitMetaDataEffect = (input: SubmitMetaDataInput) =>
  Effect.gen(function* () {
    const cacheSvc = yield* DataCacheSvc;

    // Calculate TTL based on date range
    const ttl = calculateCacheTTL(input.actorId);

    logger.debug("Submitting Meta data to cache", {
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

    logger.info("Meta data cached successfully", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
      totalSpend: input.data.totalSpend,
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
              message: "Meta data cached successfully",
              dateRange: input.data.dateRange,
              metrics: {
                totalSpend: input.data.totalSpend,
                totalConversions: input.data.totalConversions,
                averageROAS: input.data.averageROAS,
                averageCPA: input.data.averageCPA,
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
        message: "Meta data cached successfully",
        cachedAt: result.cachedAt,
      },
    };
  }).pipe(
    Effect.catchTag("CacheError", (error) =>
      Effect.succeed({
        content: [
          {
            type: "text" as const,
            text: `Failed to cache Meta data: ${error.message}${error.key ? ` (key: ${error.key})` : ""}`,
          },
        ],
        isError: true as const,
      })
    )
  );

/**
 * Register the submit_meta_data tool on the MCP server.
 * This is a structured output tool for Meta Ads analyst agents to persist collected data.
 */
export function registerSubmitMetaDataTool(server: McpServer): void {
  server.registerTool(
    "submit_meta_data",
    {
      title: "Submit Meta Ads Analytics Data",
      description:
        "Cache Meta Ads analytics data to the state store. Call this after gathering data using meta_get_insights to save the results. The data will be cached with automatic TTL and can be retrieved later for analysis without re-fetching from Meta.",
      inputSchema: submitMetaDataSchema,
    },
    (args) => {
      const input: SubmitMetaDataInput = {
        actorId: args.actorId as string,
        data: args.data as SubmitMetaDataInput["data"],
      };

      return Effect.runPromise(
        submitMetaDataEffect(input).pipe(Effect.provide(DataCacheSvc.Default))
      );
    }
  );
}
