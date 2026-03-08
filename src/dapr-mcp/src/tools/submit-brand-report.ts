import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { SubmitBrandReportInput } from "../types.js";
import { submitBrandReportSchema } from "../types.js";

const logger = createLogger("submit_brand_report");

/**
 * Effect for submitting a brand insights report to the BrandInsightsActor.
 * Validates and persists the complete report.
 */
const submitBrandReportEffect = (input: SubmitBrandReportInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;

    logger.debug("Submitting brand report", {
      actorId: input.actorId,
      healthScore: input.report.summary.overallHealthScore,
      sources: input.report.metadata.sources,
    });

    yield* actorSvc.invokeMethod(
      "BrandInsightsActor",
      input.actorId,
      "saveReport",
      input.report
    );

    logger.info("Brand report submitted successfully", {
      actorId: input.actorId,
      healthScore: input.report.summary.overallHealthScore,
      dateRange: input.report.metadata.dateRange,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              actorType: "BrandInsightsActor",
              actorId: input.actorId,
              message: "Brand insights report persisted successfully",
              summary: {
                healthScore: input.report.summary.overallHealthScore,
                sources: input.report.metadata.sources,
                dateRange: input.report.metadata.dateRange,
                winsCount: input.report.insights.wins.length,
                concernsCount: input.report.insights.concerns.length,
                recommendationsCount: input.report.insights.recommendations.length,
              },
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        actorType: "BrandInsightsActor",
        actorId: input.actorId,
        message: "Brand insights report persisted successfully",
      },
    };
  }).pipe(
    Effect.catchTags({
      DaprActorError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Failed to submit brand report: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprTimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Brand report submission timed out after ${error.duration}: ${error.message}`,
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
 * Register the submit_brand_report tool on the MCP server.
 * This is a structured output tool for brand orchestrator agents to persist the final report.
 */
export function registerSubmitBrandReportTool(server: McpServer): void {
  server.registerTool(
    "submit_brand_report",
    {
      title: "Submit Brand Insights Report",
      description:
        "Persist a brand insights report to the BrandInsightsActor. Call this after synthesizing analytics data from GA4, Shopify, and other sources. The report will be stored with history for trend analysis.",
      inputSchema: submitBrandReportSchema,
    },
    (args) => {
      const input: SubmitBrandReportInput = {
        actorId: args.actorId as string,
        report: args.report as SubmitBrandReportInput["report"],
      };

      return Effect.runPromise(
        submitBrandReportEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
