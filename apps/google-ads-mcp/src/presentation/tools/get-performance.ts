/**
 * Inbound adapter for `google_ads_get_performance`.
 */

import { Effect } from "effect";
import { createLogger, z, type McpServer } from "mcp-core";
import { deriveKpis, normalizeMetrics, sumMetrics } from "analytics-core";
import {
  DATE_PRESETS,
  GoogleAdsClient,
  LEVELS,
  type GetPerformanceInput,
} from "google-ads-core";
import type { ToolRunner } from "../../runtime.js";

const logger = createLogger("google_ads_get_performance");

export const getPerformanceSchema = {
  customerId: z
    .string()
    .optional()
    .describe(
      "Google Ads customer ID (10 digits; dashes are stripped). Uses the server's default when omitted.",
    ),
  level: z
    .enum(LEVELS as unknown as [string, ...string[]])
    .optional()
    .describe("Aggregation level (default: campaign)"),
  datePreset: z
    .enum(DATE_PRESETS as unknown as [string, ...string[]])
    .optional()
    .describe("Predefined date range (default: LAST_7_DAYS)"),
  timeRange: z
    .object({
      since: z.string().describe("Start date (YYYY-MM-DD)"),
      until: z.string().describe("End date (YYYY-MM-DD)"),
    })
    .optional()
    .describe("Custom date range (takes precedence over datePreset)"),
  campaignIds: z
    .array(z.string())
    .optional()
    .describe("Filter to specific campaign IDs (numeric)"),
  includeQualityMetrics: z
    .boolean()
    .optional()
    .describe("Include quality score / impression share where the level supports them"),
  limit: z.number().min(1).max(1000).optional().describe("Maximum rows (default 100)"),
};

const getPerformanceEffect = (input: GetPerformanceInput) =>
  Effect.gen(function* () {
    const client = yield* GoogleAdsClient;

    logger.debug("Fetching Google Ads performance", {
      customerId: input.customerId ?? client.defaultCustomerId,
      level: input.level ?? "campaign",
    });

    const result = yield* client.getPerformance(input);

    // Totals and KPIs come from analytics-core, so ROAS here means what it means for
    // Meta and GA4. Google Ads' micros are already converted by the adapter.
    const totals = sumMetrics(
      result.rows.map((row) =>
        normalizeMetrics("googleAds", {
          impressions: row.impressions,
          clicks: row.clicks,
          conversions: row.conversions,
          conversions_value: row.revenue,
        }),
      ),
    );
    // spend is summed directly: the adapter already converted cost_micros, so passing it
    // back through the micros-aware normalizer would divide by a million a second time.
    const spend = result.rows.reduce((sum, row) => sum + (row.spend ?? 0), 0);
    const withSpend = { ...totals, spend };
    const kpis = deriveKpis(withSpend);

    const summary =
      `Google Ads performance for ${result.customerId} (${result.level}): ` +
      `${result.rows.length} rows, ${spend.toFixed(2)} spend, ` +
      `${withSpend.conversions ?? 0} conversions`;

    logger.info("Google Ads performance complete", {
      customerId: result.customerId,
      rows: result.rows.length,
    });

    const payload = {
      summary,
      customerId: result.customerId,
      level: result.level,
      dateRange: input.timeRange ?? input.datePreset ?? "LAST_7_DAYS",
      totals: withSpend,
      kpis,
      rowCount: result.rows.length,
      rows: result.rows,
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }).pipe(
    Effect.catchTags({
      GoogleAdsApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Google Ads API error: ${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      GoogleAdsQuotaError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              // Google Ads quotas are daily — say so, so the agent stops rather than loops.
              text: `Google Ads quota exceeded: ${error.message}. Google Ads quotas reset daily; retrying now will not help.`,
            },
          ],
          isError: true as const,
        }),
      GoogleAdsAuthError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text:
                `Google Ads authentication failed (${error.authType}): ${error.message}. ` +
                (error.authType === "developer_token"
                  ? "Check GOOGLE_ADS_DEVELOPER_TOKEN and that it is approved for this account."
                  : "Check GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET."),
            },
          ],
          isError: true as const,
        }),
      TimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Google Ads request timed out during ${error.operation}${
                error.duration ? ` after ${error.duration}` : ""
              }.`,
            },
          ],
          isError: true as const,
        }),
    }),
  );

export function registerGetPerformanceTool(server: McpServer, run: ToolRunner): void {
  server.registerTool(
    "google_ads_get_performance",
    {
      title: "Get Google Ads Performance",
      description: `Fetch Google Ads performance metrics — spend, impressions, clicks, conversions and conversion value — with derived KPIs (ROAS, CPA, CTR, CVR, CPC, CPM).

Levels: ${LEVELS.join(", ")}

Date presets: ${DATE_PRESETS.join(", ")}

Spend is returned in the account's currency (the API's micros are converted for you).

Pass customerId to target a specific brand's account without restarting the server.`,
      inputSchema: getPerformanceSchema,
    },
    (args) => run(getPerformanceEffect(args as GetPerformanceInput)),
  );
}
