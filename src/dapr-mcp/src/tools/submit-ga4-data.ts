import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { SubmitGA4DataInput } from "../types.js";
import { submitGA4DataSchema } from "../types.js";

const logger = createLogger("submit_ga4_data");

/**
 * Effect for submitting GA4 data to the GA4DataActor.
 * Validates and persists the data, adding collection timestamp.
 */
const submitGA4DataEffect = (input: SubmitGA4DataInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;

    // Add collection timestamp
    const dataWithTimestamp = {
      ...input.data,
      collectedAt: new Date().toISOString(),
    };

    logger.debug("Submitting GA4 data", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
    });

    yield* actorSvc.invokeMethod(
      "GA4DataActor",
      input.actorId,
      "saveData",
      dataWithTimestamp
    );

    logger.info("GA4 data submitted successfully", {
      actorId: input.actorId,
      dateRange: input.data.dateRange,
      sessions: input.data.sessions,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              actorType: "GA4DataActor",
              actorId: input.actorId,
              message: "GA4 data persisted successfully",
              dateRange: input.data.dateRange,
              metrics: {
                sessions: input.data.sessions,
                activeUsers: input.data.activeUsers,
                conversions: input.data.conversions,
              },
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        actorType: "GA4DataActor",
        actorId: input.actorId,
        message: "GA4 data persisted successfully",
      },
    };
  }).pipe(
    Effect.catchTags({
      DaprActorError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Failed to submit GA4 data: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprTimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `GA4 data submission timed out after ${error.duration}: ${error.message}`,
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
 * Register the submit_ga4_data tool on the MCP server.
 * This is a structured output tool for GA4 analyst agents to persist collected data.
 */
export function registerSubmitGA4DataTool(server: McpServer): void {
  server.registerTool(
    "submit_ga4_data",
    {
      title: "Submit GA4 Analytics Data",
      description:
        "Persist GA4 analytics data to the GA4DataActor. Call this after gathering data using ga4_run_report to save the results. The data will be stored and can be retrieved later for analysis without re-fetching from GA4.",
      inputSchema: submitGA4DataSchema,
    },
    (args) => {
      const input: SubmitGA4DataInput = {
        actorId: args.actorId as string,
        data: args.data as SubmitGA4DataInput["data"],
      };

      return Effect.runPromise(
        submitGA4DataEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
