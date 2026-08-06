import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { MetaAdsClient } from "../services/meta.js";
import type { GetInsightsInput } from "../types.js";
import { DEFAULT_INSIGHTS_FIELDS, ALL_INSIGHTS_FIELDS } from "../types.js";

const logger = createLogger("meta_get_insights");

/**
 * Input schema for the meta_get_insights tool
 */
export const getInsightsSchema = {
  adAccountId: z.string().optional().describe("Ad Account ID (uses default if not provided)"),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .optional()
    .describe("Level of aggregation (default: campaign)"),
  datePreset: z
    .enum([
      "today",
      "yesterday",
      "this_month",
      "last_month",
      "this_quarter",
      "maximum",
      "last_3d",
      "last_7d",
      "last_14d",
      "last_28d",
      "last_30d",
      "last_90d",
      "last_week_mon_sun",
      "last_week_sun_sat",
      "last_quarter",
      "last_year",
      "this_week_mon_today",
      "this_week_sun_today",
      "this_year",
    ])
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
    .describe(`Fields to retrieve. Default: ${DEFAULT_INSIGHTS_FIELDS.slice(0, 5).join(", ")}...`),
  limit: z.number().min(1).max(500).optional().describe("Maximum results (default 50, max 500)"),
};

/**
 * Get insights effect - the core business logic
 */
const getInsightsEffect = (input: GetInsightsInput) =>
  Effect.gen(function* () {
    const client = yield* MetaAdsClient;

    const adAccountId = input.adAccountId || client.getDefaultAdAccountId();
    const level = input.level || "campaign";

    logger.debug("Fetching Meta insights", {
      adAccountId,
      level,
      datePreset: input.datePreset,
      timeRange: input.timeRange,
    });

    const result = yield* client.getInsights(input);

    logger.debug("Meta insights response", {
      rowCount: result.data.length,
    });

    // Calculate totals for summary
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    result.data.forEach((row) => {
      totalSpend += parseFloat(row.spend || "0");
      totalImpressions += parseInt(row.impressions || "0", 10);
      totalClicks += parseInt(row.clicks || "0", 10);
    });

    const summary = `Meta Ads Insights for ${adAccountId}: ${result.data.length} rows, $${totalSpend.toFixed(2)} spend, ${totalImpressions.toLocaleString()} impressions`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              summary,
              adAccountId,
              level,
              dateRange: input.datePreset || input.timeRange || "last_7d",
              totals: {
                spend: totalSpend.toFixed(2),
                impressions: totalImpressions,
                clicks: totalClicks,
                ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + "%" : "0%",
              },
              rowCount: result.data.length,
              data: result.data,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        summary,
        adAccountId,
        totals: {
          spend: totalSpend,
          impressions: totalImpressions,
          clicks: totalClicks,
        },
        rowCount: result.data.length,
        data: result.data,
      },
    };
  }).pipe(
    Effect.catchTags({
      MetaApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Error fetching Meta insights: ${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      MetaRateLimitError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Meta API rate limit exceeded: ${error.message}${error.retryAfter ? `. Retry after ${error.retryAfter} seconds.` : ""}`,
            },
          ],
          isError: true as const,
        }),
      TimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Request timed out after ${error.duration}: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
    })
  );

/**
 * Register the meta_get_insights tool on the server
 */
export function registerGetInsightsTool(server: McpServer): void {
  server.registerTool(
    "meta_get_insights",
    {
      title: "Get Meta Ads Insights",
      description: `Fetch advertising insights from Meta (Facebook/Instagram) Marketing API.

Levels: account, campaign, adset, ad

Date presets: today, yesterday, last_7d, last_30d, this_month, last_month, etc.

Common fields: ${DEFAULT_INSIGHTS_FIELDS.join(", ")}

All available fields: ${ALL_INSIGHTS_FIELDS.slice(0, 10).join(", ")}...`,
      inputSchema: getInsightsSchema,
    },
    (args) => {
      const input: GetInsightsInput = {
        adAccountId: args.adAccountId,
        level: args.level,
        datePreset: args.datePreset,
        timeRange: args.timeRange,
        campaignIds: args.campaignIds,
        fields: args.fields,
        limit: args.limit,
      };

      return Effect.runPromise(getInsightsEffect(input).pipe(Effect.provide(MetaAdsClient.Default)));
    }
  );
}
