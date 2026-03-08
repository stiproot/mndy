import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { GetCachedDataInput } from "../types.js";
import { getCachedDataSchema } from "../types.js";

const logger = createLogger("get_cached_data");

/**
 * Map source to actor type
 */
const SOURCE_TO_ACTOR: Record<string, string> = {
  ga4: "GA4DataActor",
  shopify: "ShopifyDataActor",
};

/**
 * Effect for retrieving cached data from a data actor.
 */
const getCachedDataEffect = (input: GetCachedDataInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;
    const actorType = SOURCE_TO_ACTOR[input.source];

    if (!actorType) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown data source: ${input.source}. Valid sources are: ga4, shopify`,
          },
        ],
        isError: true as const,
      };
    }

    logger.debug("Retrieving cached data", {
      source: input.source,
      actorType,
      actorId: input.actorId,
    });

    const data = yield* actorSvc.invokeMethod(
      actorType,
      input.actorId,
      "getData",
      undefined
    );

    if (!data) {
      logger.info("No cached data found", {
        source: input.source,
        actorId: input.actorId,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                found: false,
                source: input.source,
                actorId: input.actorId,
                message: "No cached data found for this actor ID",
              },
              null,
              2
            ),
          },
        ],
        structuredContent: {
          success: true,
          found: false,
          source: input.source,
          actorId: input.actorId,
          data: null,
        },
      };
    }

    logger.info("Cached data retrieved successfully", {
      source: input.source,
      actorId: input.actorId,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              found: true,
              source: input.source,
              actorId: input.actorId,
              data,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        found: true,
        source: input.source,
        actorId: input.actorId,
        data,
      },
    };
  }).pipe(
    Effect.catchTags({
      DaprActorError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Failed to retrieve cached data: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprTimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Data retrieval timed out after ${error.duration}: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprConnectionError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Dapr connection error: ${error.message} (${error.host}:${error.port})`,
            },
          ],
          isError: true as const,
        }),
    })
  );

/**
 * Register the get_cached_data tool on the MCP server.
 * This tool retrieves cached raw data from GA4DataActor or ShopifyDataActor.
 */
export function registerGetCachedDataTool(server: McpServer): void {
  server.registerTool(
    "get_cached_data",
    {
      title: "Get Cached Analytics Data",
      description:
        "Retrieve cached raw analytics data from GA4DataActor or ShopifyDataActor. Use this to check if data exists for a date range before deciding to collect fresh data. Returns null if no data is cached.",
      inputSchema: getCachedDataSchema,
    },
    (args) => {
      const input: GetCachedDataInput = {
        source: args.source as "ga4" | "shopify",
        actorId: args.actorId as string,
      };

      return Effect.runPromise(
        getCachedDataEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
