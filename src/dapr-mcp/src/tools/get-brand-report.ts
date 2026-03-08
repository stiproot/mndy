import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { GetBrandReportInput } from "../types.js";
import { getBrandReportSchema } from "../types.js";

const logger = createLogger("get_brand_report");

/**
 * Effect for retrieving a brand insights report from the BrandInsightsActor.
 */
const getBrandReportEffect = (input: GetBrandReportInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;

    logger.debug("Retrieving brand report", {
      actorId: input.actorId,
    });

    const data = yield* actorSvc.invokeMethod(
      "BrandInsightsActor",
      input.actorId,
      "getReport",
      undefined
    );

    if (!data) {
      logger.info("No brand report found", {
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
                actorId: input.actorId,
                message: "No brand report found for this actor ID",
              },
              null,
              2
            ),
          },
        ],
        structuredContent: {
          success: true,
          found: false,
          actorId: input.actorId,
          data: null,
        },
      };
    }

    logger.info("Brand report retrieved successfully", {
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
              text: `Failed to retrieve brand report: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprTimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Brand report retrieval timed out after ${error.duration}: ${error.message}`,
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
 * Register the get_brand_report tool on the MCP server.
 * This tool retrieves a persisted brand insights report from BrandInsightsActor.
 */
export function registerGetBrandReportTool(server: McpServer): void {
  server.registerTool(
    "get_brand_report",
    {
      title: "Get Brand Insights Report",
      description:
        "Retrieve a persisted brand insights report from the BrandInsightsActor. Use this to get a previously generated report for a brand.",
      inputSchema: getBrandReportSchema,
    },
    (args) => {
      const input: GetBrandReportInput = {
        actorId: args.actorId as string,
      };

      return Effect.runPromise(
        getBrandReportEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
