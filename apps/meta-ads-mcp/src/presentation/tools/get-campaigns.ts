/**
 * Inbound adapter for `meta_get_campaigns`.
 */

import { Effect } from "effect";
import { createLogger, z, type McpServer } from "mcp-core";
import { MetaAdsClient } from "meta-ads-core";
import type { ToolRunner } from "../../runtime.js";

const logger = createLogger("meta_get_campaigns");

export const getCampaignsSchema = {
  adAccountId: z
    .string()
    .optional()
    .describe("Ad Account ID (uses the server's default when omitted)"),
  limit: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe("Maximum results (default 100, max 500)"),
};

interface GetCampaignsInput {
  readonly adAccountId?: string;
  readonly limit?: number;
}

const getCampaignsEffect = (input: GetCampaignsInput) =>
  Effect.gen(function* () {
    const client = yield* MetaAdsClient;
    const adAccountId = input.adAccountId || client.defaultAdAccountId;
    const limit = input.limit || 100;

    logger.debug("Fetching Meta campaigns", { adAccountId, limit });

    const campaigns = yield* client.getCampaigns(adAccountId, limit);
    const summary = `Found ${campaigns.length} campaigns for ad account ${adAccountId}`;

    logger.info("Meta campaigns complete", { adAccountId, count: campaigns.length });

    const payload = { summary, adAccountId, count: campaigns.length, campaigns };

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

export function registerGetCampaignsTool(server: McpServer, run: ToolRunner): void {
  server.registerTool(
    "meta_get_campaigns",
    {
      title: "Get Meta Ads Campaigns",
      description:
        "List campaigns for a Meta ad account, with status, objective and buying type. " +
        "Pass adAccountId to target a specific brand's account without restarting the server.",
      inputSchema: getCampaignsSchema,
    },
    (args) => run(getCampaignsEffect(args as GetCampaignsInput)),
  );
}
