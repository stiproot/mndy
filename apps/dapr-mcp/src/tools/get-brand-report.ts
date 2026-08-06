import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import type { GetBrandReportInput } from "../types.js";
import { getBrandReportSchema } from "../types.js";
import { DataCacheSvc, CacheError } from "../services/data-cache.service.js";

const logger = createLogger("get_brand_report");

/**
 * Effect for retrieving a brand insights report from the state store.
 * Brand reports don't have TTL expiration (no date ranges).
 */
const getBrandReportEffect = (input: GetBrandReportInput) =>
  Effect.gen(function* () {
    const cacheSvc = yield* DataCacheSvc;

    logger.debug("Retrieving brand report", {
      actorId: input.stateKey,
    });

    // Get report from state store
    const result = yield* cacheSvc.getData(input.stateKey);

    if (!result.found) {
      logger.info("No brand report found", {
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
                actorId: input.stateKey,
                message: "No brand report found for this cache key",
              },
              null,
              2
            ),
          },
        ],
        structuredContent: {
          success: true,
          found: false,
          actorId: input.stateKey,
          data: null,
        },
      };
    }

    logger.info("Brand report retrieved successfully", {
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
        actorId: input.stateKey,
        data: result.data,
        metadata: result.metadata,
      },
    };
  });

/**
 * Register the get_brand_report tool on the MCP server.
 * This tool retrieves a persisted brand insights report from the state store.
 */
export function registerGetBrandReportTool(server: McpServer): void {
  server.registerTool(
    "get_brand_report",
    {
      title: "Get Brand Insights Report",
      description:
        "Retrieve a persisted brand insights report from the state store. Use this to get a previously generated report for a brand. Brand reports don't expire (no TTL).",
      inputSchema: getBrandReportSchema,
    },
    (args) => {
      const input: GetBrandReportInput = {
        stateKey: args.stateKey as string,
      };

      return Effect.runPromise(
        getBrandReportEffect(input).pipe(Effect.provide(DataCacheSvc.Default))
      );
    }
  );
}
