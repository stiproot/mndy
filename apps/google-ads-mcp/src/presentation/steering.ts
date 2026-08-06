import { BRAND_TARGETING, buildInstructions } from "analytics-core";
import { z, type McpServer } from "mcp-core";

export const INSTRUCTIONS = buildInstructions(
  `This server reads Google Ads — paid search and display. Use it for questions about
search campaigns, ad groups, keywords, quality score and impression share.

It covers paid search only. Paid social lives in the Meta Ads server, website behaviour in
GA4, and orders in Shopify. "Paid media" means Google Ads AND Meta together — answering
with one of them alone is a partial answer, and you should say which you used.`,
  [
    BRAND_TARGETING.replace("account id", "customerId (10 digits, dashes optional)"),
    `Spend is already converted to the account's currency — the API reports micros and this
server divides them out. Do not divide by 1,000,000 again.

Quality score is keyword-level; impression share is campaign and ad-group level. Ask for
quality metrics only at a level that has them.

Quota errors are terminal: Google Ads quotas reset daily, so retrying will not help. Report
the problem instead of trying again.`,
  ],
);

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "google_ads_performance_review",
    {
      title: "Google Ads: performance review",
      description: "Spend, conversions and efficiency by campaign, with what to act on.",
      argsSchema: {
        period: z
          .string()
          .optional()
          .describe("e.g. 'last 30 days'. Defaults to the last 7 days."),
      },
    },
    ({ period }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using google_ads_get_performance at campaign level for ` +
              `${period || "the last 7 days"}, review performance.\n\n` +
              `Report spend, conversions, conversion value and the derived KPIs. Name the ` +
              `currency once. Identify campaigns worth more budget and campaigns worth ` +
              `cutting, and say what evidence supports each. Where a KPI is null, say it is ` +
              `not available rather than reporting zero.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "google_ads_wasted_spend",
    {
      title: "Google Ads: find wasted spend",
      description: "Keywords and campaigns spending without converting.",
      argsSchema: {},
    },
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using google_ads_get_performance at keyword level for the last 30 days with ` +
              `quality metrics included, find wasted spend.\n\n` +
              `Look for keywords with meaningful spend and no or very few conversions, and ` +
              `for low quality scores driving up cost. Rank by money at stake, not by count. ` +
              `Be explicit that pausing is a judgement call — show me the numbers and your ` +
              `recommendation, and note where volume is too low to conclude anything.`,
          },
        },
      ],
    }),
  );
}
