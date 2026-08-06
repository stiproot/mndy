/**
 * What this server tells a client about itself.
 *
 * `instructions` is sent at initialize and reaches EVERY MCP client — Claude Desktop,
 * Claude Code, anything — with nothing for the user to install. Prompts appear in the
 * client UI as ready-made starting points, which for a non-technical user is often the
 * difference between "a tool is available" and "I know what to ask".
 */

import { BRAND_TARGETING, buildInstructions } from "analytics-core";
import { z, type McpServer } from "mcp-core";

export const INSTRUCTIONS = buildInstructions(
  `This server reads Google Analytics 4 — website traffic, engagement and on-site
conversions. Use it for questions about sessions, users, traffic sources, landing pages,
devices and geography.

It knows nothing about ad spend. GA4 does not report cost, so ROAS and CPA cannot be
calculated from this server alone — combine it with the Meta Ads or Google Ads server.`,
  [
    BRAND_TARGETING,
    `Dates accept YYYY-MM-DD or GA4 relative forms: today, yesterday, 7daysAgo, 30daysAgo.
Rows come back flattened, one object per row with dimensions and metrics as keys.`,
  ],
);

/** Starting points a user can pick without knowing the tool surface. */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "ga4_traffic_overview",
    {
      title: "GA4: traffic overview",
      description: "Sessions, users and engagement for a period, broken down by channel.",
      argsSchema: {
        period: z
          .string()
          .optional()
          .describe("e.g. 'last 7 days', 'last month'. Defaults to the last 7 days."),
      },
    },
    ({ period }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using ga4_run_report, show me a traffic overview for ${period || "the last 7 days"}.\n\n` +
              `Include sessions, active users and engagement rate, broken down by ` +
              `sessionDefaultChannelGroup. Compare against the previous equivalent period and ` +
              `call out what moved. Present it as a short table plus two or three sentences ` +
              `of interpretation — not a data dump.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "ga4_top_landing_pages",
    {
      title: "GA4: top landing pages",
      description: "Which landing pages bring traffic, and how well they hold it.",
      argsSchema: {
        period: z.string().optional().describe("Defaults to the last 30 days."),
      },
    },
    ({ period }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using ga4_run_report, list the top 15 landing pages for ${period || "the last 30 days"} ` +
              `by sessions, with engagement rate and conversions for each.\n\n` +
              `Then tell me which pages get meaningful traffic but engage poorly — those are ` +
              `the ones worth fixing first.`,
          },
        },
      ],
    }),
  );
}
