/**
 * Inbound adapter for `google_ads_get_campaigns`.
 */

import { Effect } from "effect";
import { createLogger, z, type McpServer } from "mcp-core";
import {
  CAMPAIGN_STATUSES,
  GoogleAdsClient,
  type GetCampaignsInput,
} from "google-ads-core";
import type { ToolRunner } from "../../runtime.js";

const logger = createLogger("google_ads_get_campaigns");

export const getCampaignsSchema = {
  customerId: z
    .string()
    .optional()
    .describe(
      "Google Ads customer ID (10 digits; dashes are stripped). Uses the server's default when omitted.",
    ),
  status: z
    .array(z.enum(CAMPAIGN_STATUSES as unknown as [string, ...string[]]))
    .optional()
    .describe("Filter by campaign status (default: ENABLED, PAUSED)"),
  limit: z.number().min(1).max(500).optional().describe("Maximum results (default 100)"),
};

const getCampaignsEffect = (input: GetCampaignsInput) =>
  Effect.gen(function* () {
    const client = yield* GoogleAdsClient;
    const customerId = input.customerId ?? client.defaultCustomerId;

    logger.debug("Fetching Google Ads campaigns", { customerId });

    const campaigns = yield* client.getCampaigns(input);
    const summary = `Found ${campaigns.length} campaigns for Google Ads customer ${customerId}`;

    logger.info("Google Ads campaigns complete", { customerId, count: campaigns.length });

    const payload = { summary, customerId, count: campaigns.length, campaigns };

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

export function registerGetCampaignsTool(server: McpServer, run: ToolRunner): void {
  server.registerTool(
    "google_ads_get_campaigns",
    {
      title: "Get Google Ads Campaigns",
      description:
        "List campaigns for a Google Ads account, with status, channel type and bidding strategy. " +
        "Pass customerId to target a specific brand's account without restarting the server.",
      inputSchema: getCampaignsSchema,
    },
    (args) => run(getCampaignsEffect(args as GetCampaignsInput)),
  );
}
