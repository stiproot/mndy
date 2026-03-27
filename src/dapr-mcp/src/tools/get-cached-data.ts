import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import type { GetCachedDataInput } from "../types.js";
import { getCachedDataSchema } from "../types.js";
import { DataCacheSvc, CacheError } from "../services/data-cache.service.js";

const logger = createLogger("get_cached_data");

/**
 * Effect for retrieving cached data from the state store.
 * Validates TTL and returns metadata about cache status.
 */
const getCachedDataEffect = (input: GetCachedDataInput) =>
  Effect.gen(function* () {
    const cacheSvc = yield* DataCacheSvc;

    logger.debug("Retrieving cached data", {
      source: input.source,
      actorId: input.stateKey,
    });

    // Get data from state store with TTL validation
    const result = yield* cacheSvc.getData(input.stateKey);

    if (!result.found) {
      logger.info("No cached data found", {
        source: input.source,
        actorId: input.stateKey,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                found: false,
                valid: false,
                source: input.source,
                actorId: input.stateKey,
                message: "No cached data found for this cache key",
              },
              null,
              2
            ),
          },
        ],
        structuredContent: {
          success: true,
          found: false,
          valid: false,
          source: input.source,
          actorId: input.stateKey,
          data: null,
        },
      };
    }

    // Check if data is still valid (not expired)
    if (!result.valid) {
      logger.info("Cached data found but expired", {
        source: input.source,
        actorId: input.stateKey,
        expiresAt: result.metadata?.expiresAt,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                found: true,
                valid: false,
                source: input.source,
                actorId: input.stateKey,
                message: "Cached data found but has expired",
                metadata: result.metadata,
              },
              null,
              2
            ),
          },
        ],
        structuredContent: {
          success: true,
          found: true,
          valid: false,
          source: input.source,
          actorId: input.stateKey,
          data: null,
          metadata: result.metadata,
        },
      };
    }

    logger.info("Cached data retrieved successfully", {
      source: input.source,
      actorId: input.stateKey,
      cachedAt: result.metadata?.cachedAt,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              found: true,
              valid: true,
              source: input.source,
              actorId: input.stateKey,
              data: result.data,
              metadata: result.metadata,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        found: true,
        valid: true,
        source: input.source,
        actorId: input.stateKey,
        data: result.data,
        metadata: result.metadata,
      },
    };
  });

/**
 * Register the get_cached_data tool on the MCP server.
 * This tool retrieves cached raw data from the state store with TTL validation.
 */
export function registerGetCachedDataTool(server: McpServer): void {
  server.registerTool(
    "get_cached_data",
    {
      title: "Get Cached Analytics Data",
      description:
        "Retrieve cached raw analytics data from the state store. Use this to check if data exists for a date range before deciding to collect fresh data. Returns the data with cache metadata (cachedAt, expiresAt) and validation status. If data is expired (valid=false), you should collect fresh data.",
      inputSchema: getCachedDataSchema,
    },
    (args) => {
      const input: GetCachedDataInput = {
        source: args.source as "ga4" | "shopify" | "meta",
        stateKey: args.stateKey as string,
      };

      return Effect.runPromise(
        getCachedDataEffect(input).pipe(Effect.provide(DataCacheSvc.Default))
      );
    }
  );
}
