import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { SubmitShopifyDataInput } from "../types.js";
import { submitShopifyDataSchema } from "../types.js";

const logger = createLogger("submit_shopify_data");

/**
 * Effect for submitting Shopify data to the ShopifyDataActor.
 * Validates and persists the data, adding collection timestamp.
 */
const submitShopifyDataEffect = (input: SubmitShopifyDataInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;

    // Add collection timestamp
    const dataWithTimestamp = {
      ...input.data,
      collectedAt: new Date().toISOString(),
    };

    logger.debug("Submitting Shopify data", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
    });

    yield* actorSvc.invokeMethod(
      "ShopifyDataActor",
      input.actorId,
      "saveData",
      dataWithTimestamp
    );

    logger.info("Shopify data submitted successfully", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
      totalOrders: input.data.totalOrders,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              actorType: "ShopifyDataActor",
              actorId: input.actorId,
              message: "Shopify data persisted successfully",
              dateRange: input.data.dateRange,
              metrics: {
                totalRevenue: input.data.totalRevenue,
                totalOrders: input.data.totalOrders,
                averageOrderValue: input.data.averageOrderValue,
              },
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        actorType: "ShopifyDataActor",
        actorId: input.actorId,
        message: "Shopify data persisted successfully",
      },
    };
  }).pipe(
    Effect.catchTags({
      DaprActorError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Failed to submit Shopify data: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprTimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Shopify data submission timed out after ${error.duration}: ${error.message}`,
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
 * Register the submit_shopify_data tool on the MCP server.
 * This is a structured output tool for Shopify analyst agents to persist collected data.
 */
export function registerSubmitShopifyDataTool(server: McpServer): void {
  server.registerTool(
    "submit_shopify_data",
    {
      title: "Submit Shopify Analytics Data",
      description:
        "Persist Shopify analytics data to the ShopifyDataActor. Call this after gathering data using shopify_get_analytics or shopify_get_orders to save the results. The data will be stored and can be retrieved later for analysis without re-fetching from Shopify.",
      inputSchema: submitShopifyDataSchema,
    },
    (args) => {
      const input: SubmitShopifyDataInput = {
        actorId: args.actorId as string,
        data: args.data as SubmitShopifyDataInput["data"],
      };

      return Effect.runPromise(
        submitShopifyDataEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
