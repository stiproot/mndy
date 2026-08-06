import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import type { SubmitBrandReportInput } from "../types.js";
import { submitBrandReportSchema } from "../types.js";
import { DataCacheSvc } from "../services/data-cache.service.js";
import { calculateCacheTTL } from "../utils/cache-ttl.js";

const logger = createLogger("submit_brand_report");

/**
 * Effect for submitting a brand insights report to the state store cache.
 * Validates and persists the complete report with history tracking.
 */
const submitBrandReportEffect = (input: SubmitBrandReportInput) =>
  Effect.gen(function* () {
    const cacheSvc = yield* DataCacheSvc;

    // Brand reports don't expire (no date range in actorId)
    const ttl = calculateCacheTTL(input.stateKey);

    logger.debug("Submitting brand report to cache", {
      actorId: input.stateKey,
      healthScore: input.report.summary.overallHealthScore,
      sources: input.report.metadata.sources,
      ttl: ttl ? `${ttl}s` : "no expiration",
    });

    // Save to state store
    const result = yield* cacheSvc.saveData(
      input.stateKey,
      input.report,
      ttl
    );

    logger.info("Brand report cached successfully", {
      actorId: input.stateKey,
      healthScore: input.report.summary.overallHealthScore,
      dateRange: input.report.metadata.dateRange,
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
              message: "Brand insights report cached successfully",
              summary: {
                healthScore: input.report.summary.overallHealthScore,
                sources: input.report.metadata.sources,
                dateRange: input.report.metadata.dateRange,
                winsCount: input.report.insights.wins.length,
                concernsCount: input.report.insights.concerns.length,
                recommendationsCount: input.report.insights.recommendations.length,
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
        message: "Brand insights report cached successfully",
        cachedAt: result.cachedAt,
      },
    };
  }).pipe(
    Effect.catchTag("CacheError", (error) =>
      Effect.succeed({
        content: [
          {
            type: "text" as const,
            text: `Failed to cache brand report: ${error.message}${error.key ? ` (key: ${error.key})` : ""}`,
          },
        ],
        isError: true as const,
      })
    )
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
        "Cache a brand insights report to the state store. Call this after synthesizing analytics data from GA4, Shopify, and other sources. The report will be cached with history tracking for trend analysis.",
      inputSchema: submitBrandReportSchema,
    },
    (args) => {
      const input: SubmitBrandReportInput = {
        stateKey: args.stateKey as string,
        report: args.report as SubmitBrandReportInput["report"],
      };

      return Effect.runPromise(
        submitBrandReportEffect(input).pipe(Effect.provide(DataCacheSvc.Default))
      );
    }
  );
}
