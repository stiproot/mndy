import { buildInstructions } from "analytics-core";
import { z, type McpServer } from "mcp-core";

export const INSTRUCTIONS = buildInstructions(
  `This server reads a Shopify store — orders, line items, customers and sales totals. Use
it for questions about what actually sold, as opposed to what was clicked or advertised.

It is the source of truth for revenue. When an ad platform's reported conversion value
disagrees with Shopify, Shopify is what the business was actually paid.`,
  [
    `IMPORTANT — one store per server. Shopify authentication is bound to a single store, so
unlike the GA4 and Meta tools there is NO per-call store parameter. This process serves
exactly the store it was configured with.

If the user asks about a different store or brand than this server is bound to, say so
plainly and treat Shopify data as unavailable for that brand. Do not answer with this
store's numbers.`,
  ],
);

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "shopify_sales_summary",
    {
      title: "Shopify: sales summary",
      description: "Orders, revenue and average order value for a period.",
      argsSchema: {
        period: z
          .string()
          .optional()
          .describe("e.g. 'last 30 days'. Defaults to the last 30 days."),
      },
    },
    ({ period }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using shopify_get_analytics for ${period || "the last 30 days"}, summarise ` +
              `sales.\n\n` +
              `Give total orders, total revenue and average order value, and name the store ` +
              `and currency explicitly. Compare with the previous equivalent period and say ` +
              `whether the change is meaningful or noise.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "shopify_recent_orders",
    {
      title: "Shopify: recent orders",
      description: "The latest orders, with what was bought.",
      argsSchema: {
        limit: z.string().optional().describe("How many orders. Defaults to 20."),
      },
    },
    ({ limit }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Using shopify_get_orders, show the ${limit || "20"} most recent orders with ` +
              `their totals and line items.\n\n` +
              `Summarise what is selling rather than listing every order verbatim: the ` +
              `products appearing most often, and anything unusual about order values.`,
          },
        },
      ],
    }),
  );
}
