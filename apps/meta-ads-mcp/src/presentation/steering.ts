import { BRAND_TARGETING, buildInstructions } from "analytics-core";
import { z, type McpServer } from "mcp-core";

export const INSTRUCTIONS = buildInstructions(
  `This server reads Meta advertising data — Facebook and Instagram campaigns, ad sets and
ads. Use it for questions about ad spend, reach, impressions, clicks and purchases driven
by paid social.

It covers paid social only. Website behaviour lives in the GA4 server, paid search in the
Google Ads server, and actual orders in the Shopify server.`,
  [
    BRAND_TARGETING.replace("account id", "adAccountId (the act_… value)"),
    `Ask for the level you need: campaign for budget decisions, adset for targeting, ad for
creative. Each level adds its own identifier fields automatically.

Meta reports conversions inside nested "actions"/"action_values" arrays rather than as flat
numbers — read the relevant action type out of them rather than assuming a single total.`,
  ],
);

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "meta_performance_review",
    {
      title: "Meta Ads: performance review",
      description: "Spend, results and efficiency by campaign, with what to act on.",
      argsSchema: {
        period: z
          .string()
          .optional()
          .describe("e.g. 'last 7 days', 'last 30 days'. Defaults to last 7 days."),
      },
    },
    ({ period }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using meta_get_insights at campaign level for ${period || "the last 7 days"}, ` +
              `review performance.\n\n` +
              `Report total spend, impressions, clicks and CTR, then the best and worst ` +
              `campaigns by efficiency. State the currency once and do not guess a symbol. ` +
              `Finish with the two or three changes you would actually make, and say what ` +
              `evidence supports each. If a metric is unavailable, say so rather than ` +
              `reporting zero.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "meta_creative_fatigue",
    {
      title: "Meta Ads: creative fatigue check",
      description: "Find ads whose audience has seen them too often to keep responding.",
      argsSchema: {},
    },
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using meta_get_insights at ad level for the last 14 days, include frequency, ` +
              `ctr and cpc.\n\n` +
              `Identify creative fatigue: frequency climbing while CTR falls and CPC rises. ` +
              `Frequency above 3.5 with those trends is a warning; above 5 is critical. ` +
              `A single moving metric is noise — only flag ads where the signals agree. ` +
              `List what to refresh, most urgent first.`,
          },
        },
      ],
    }),
  );
}
