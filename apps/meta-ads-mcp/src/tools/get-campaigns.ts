import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { MetaAdsClient } from "../services/meta.js";

const logger = createLogger("meta_get_campaigns");

/**
 * Input schema for the meta_get_campaigns tool
 */
export const getCampaignsSchema = {
  adAccountId: z.string().optional().describe("Ad Account ID (uses default if not provided)"),
  limit: z.number().min(1).max(500).optional().describe("Maximum results (default 100, max 500)"),
};

/**
 * Input type for get campaigns
 */
interface GetCampaignsInput {
  adAccountId?: string;
  limit?: number;
}

/**
 * Get campaigns effect - the core business logic
 */
const getCampaignsEffect = (input: GetCampaignsInput) =>
  Effect.gen(function* () {
    const client = yield* MetaAdsClient;

    const adAccountId = input.adAccountId || client.getDefaultAdAccountId();
    const limit = input.limit || 100;

    logger.debug("Fetching Meta campaigns", {
      adAccountId,
      limit,
    });

    const campaigns = yield* client.getCampaigns(adAccountId, limit);

    logger.debug("Meta campaigns response", {
      count: campaigns.length,
    });

    const summary = `Found ${campaigns.length} campaigns for ad account ${adAccountId}`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              summary,
              adAccountId,
              count: campaigns.length,
              campaigns,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        summary,
        adAccountId,
        count: campaigns.length,
        campaigns,
      },
    };
  }).pipe(
    Effect.catchTags({
      MetaApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Error fetching Meta campaigns: ${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
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
 * Register the meta_get_campaigns tool on the server
 */
export function registerGetCampaignsTool(server: McpServer): void {
  server.registerTool(
    "meta_get_campaigns",
    {
      title: "Get Meta Ad Campaigns",
      description: `Fetch campaigns from Meta (Facebook/Instagram) Marketing API.

Returns campaign details including:
- id: Campaign ID
- name: Campaign name
- status: Campaign status (ACTIVE, PAUSED, ARCHIVED)
- objective: Campaign objective (e.g., OUTCOME_TRAFFIC, OUTCOME_LEADS)
- buying_type: Buying type (AUCTION, RESERVED)`,
      inputSchema: getCampaignsSchema,
    },
    (args) => {
      const input: GetCampaignsInput = {
        adAccountId: args.adAccountId,
        limit: args.limit,
      };

      return Effect.runPromise(getCampaignsEffect(input).pipe(Effect.provide(MetaAdsClient.Default)));
    }
  );
}
