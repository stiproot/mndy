/**
 * Inbound adapter for `meta_get_insights`.
 *
 * zod here is the MCP SDK's schema language — see the note in ga4-mcp's run-report tool.
 */

import { Effect } from "effect";
import { createLogger, z, type McpServer } from "mcp-core";
import { ctr, normalizeMetrics, sumMetrics } from "analytics-core";
import {
  ALL_INSIGHTS_FIELDS,
  DATE_PRESETS,
  DEFAULT_INSIGHTS_FIELDS,
  LEVELS,
  MetaAdsClient,
  type GetInsightsInput,
} from "meta-ads-core";
import type { ToolRunner } from "../../runtime.js";

const logger = createLogger("meta_get_insights");

export const getInsightsSchema = {
  adAccountId: z
    .string()
    .optional()
    .describe("Ad Account ID (uses the server's default when omitted)"),
  level: z
    .enum(LEVELS as unknown as [string, ...string[]])
    .optional()
    .describe("Level of aggregation (default: campaign)"),
  datePreset: z
    .enum(DATE_PRESETS as unknown as [string, ...string[]])
    .optional()
    .describe("Predefined date range (default: last_7d)"),
  timeRange: z
    .object({
      since: z.string().describe("Start date (YYYY-MM-DD)"),
      until: z.string().describe("End date (YYYY-MM-DD)"),
    })
    .optional()
    .describe("Custom date range (use instead of datePreset)"),
  campaignIds: z.array(z.string()).optional().describe("Filter by specific campaign IDs"),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      `Fields to retrieve. Default: ${DEFAULT_INSIGHTS_FIELDS.slice(0, 5).join(", ")}...`,
    ),
  limit: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe("Maximum results (default 50, max 500)"),
};

const getInsightsEffect = (input: GetInsightsInput) =>
  Effect.gen(function* () {
    const client = yield* MetaAdsClient;
    const adAccountId = input.adAccountId || client.defaultAdAccountId;
    const level = input.level || "campaign";

    logger.debug("Fetching Meta insights", { adAccountId, level });

    const result = yield* client.getInsights(input);

    // Totals come from analytics-core rather than a hand-rolled loop, so "spend" and
    // "ctr" mean the same thing here as in every other report.
    const totals = sumMetrics(
      result.data.map((row) =>
        normalizeMetrics("meta", {
          spend: row.spend,
          impressions: row.impressions,
          clicks: row.clicks,
        }),
      ),
    );

    const spend = totals.spend ?? 0;
    const impressions = totals.impressions ?? 0;
    const clicks = totals.clicks ?? 0;
    const clickRate = ctr(totals);

    // Deliberately no currency symbol: the account's currency is a property of the ad
    // account, and printing "$" for a ZAR account was a real bug in the previous version.
    const summary =
      `Meta Ads insights for ${adAccountId}: ${result.data.length} rows, ` +
      `${spend.toFixed(2)} spend, ${impressions.toLocaleString()} impressions`;

    logger.info("Meta insights complete", { adAccountId, rows: result.data.length });

    const payload = {
      summary,
      adAccountId,
      level,
      dateRange: input.datePreset || input.timeRange || "last_7d",
      totals: {
        spend,
        impressions,
        clicks,
        ctrPercent: clickRate === undefined ? null : Number(clickRate.toFixed(2)),
      },
      rowCount: result.data.length,
      data: result.data,
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }).pipe(
    Effect.catchTags({
      MetaApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Meta API error: ${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      MetaRateLimitError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Meta API rate limit exceeded: ${error.message}${
                error.retryAfter ? `. Retry after ${error.retryAfter} seconds.` : ""
              }`,
            },
          ],
          isError: true as const,
        }),
      TimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Meta request timed out during ${error.operation}${
                error.duration ? ` after ${error.duration}` : ""
              }.`,
            },
          ],
          isError: true as const,
        }),
    }),
  );

export function registerGetInsightsTool(server: McpServer, run: ToolRunner): void {
  server.registerTool(
    "meta_get_insights",
    {
      title: "Get Meta Ads Insights",
      description: `Fetch advertising insights from the Meta (Facebook/Instagram) Marketing API.

Levels: ${LEVELS.join(", ")}

Date presets: today, yesterday, last_7d, last_30d, this_month, last_month, etc.

Default fields: ${DEFAULT_INSIGHTS_FIELDS.join(", ")}

All available fields: ${ALL_INSIGHTS_FIELDS.slice(0, 10).join(", ")}...

Pass adAccountId to target a specific brand's account without restarting the server.`,
      inputSchema: getInsightsSchema,
    },
    (args) => run(getInsightsEffect(args as GetInsightsInput)),
  );
}
