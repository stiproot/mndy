/**
 * Inbound adapter for `ga4_run_report`.
 *
 * This layer owns exactly two things: the wire schema, and the shape of what goes back to
 * the agent. The report itself is `ga4-core`'s job.
 *
 * The schema is zod because that is the only schema language the MCP SDK accepts
 * (`registerTool` takes a zod raw shape or a zod type — no JSON Schema path). zod is
 * therefore an inbound-adapter concern, confined to `presentation/`, and never appears in a
 * domain or infrastructure module.
 */

import { Effect } from "effect";
import { createLogger, z, type McpServer } from "mcp-core";
import {
  COMMON_DIMENSIONS,
  COMMON_METRICS,
  GA4Client,
  type RunReportInput,
} from "ga4-core";
import type { ToolRunner } from "../../runtime.js";

const logger = createLogger("ga4_run_report");

export const runReportSchema = {
  propertyId: z
    .string()
    .optional()
    .describe("GA4 Property ID (uses the server's default when omitted)"),
  dateRanges: z
    .array(
      z.object({
        startDate: z
          .string()
          .describe("Start date (YYYY-MM-DD or relative: 'yesterday', '7daysAgo')"),
        endDate: z.string().describe("End date (YYYY-MM-DD or relative: 'today')"),
      }),
    )
    .min(1)
    .max(4)
    .describe("Date ranges for the report (max 4)"),
  dimensions: z
    .array(
      z.object({
        name: z
          .string()
          .describe(`Dimension name. Common: ${COMMON_DIMENSIONS.slice(0, 8).join(", ")}`),
      }),
    )
    .optional()
    .describe("Dimensions to include (e.g., date, sessionSource, country)"),
  metrics: z
    .array(
      z.object({
        name: z
          .string()
          .describe(`Metric name. Common: ${COMMON_METRICS.slice(0, 8).join(", ")}`),
      }),
    )
    .min(1)
    .describe("Metrics to include (e.g., sessions, activeUsers, conversions)"),
  dimensionFilter: z
    .object({
      fieldName: z.string().describe("Dimension to filter on"),
      stringFilter: z
        .object({
          matchType: z.enum([
            "EXACT",
            "BEGINS_WITH",
            "ENDS_WITH",
            "CONTAINS",
            "FULL_REGEXP",
            "PARTIAL_REGEXP",
          ]),
          value: z.string(),
          caseSensitive: z.boolean().optional(),
        })
        .optional(),
      inListFilter: z
        .object({
          values: z.array(z.string()),
          caseSensitive: z.boolean().optional(),
        })
        .optional(),
    })
    .optional()
    .describe("Filter to apply to dimensions"),
  limit: z.number().min(1).max(100000).optional().describe("Maximum rows (default 10000)"),
  offset: z.number().min(0).optional().describe("Row offset for pagination"),
};

/** Flatten GA4's parallel header/value arrays into one object per row, which reads far
 *  better in a tool result than positional arrays. */
const formatRows = (result: {
  dimensionHeaders?: readonly { name: string }[];
  metricHeaders: readonly { name: string }[];
  rows: readonly {
    dimensionValues?: readonly { value: string }[];
    metricValues: readonly { value: string }[];
  }[];
}) =>
  result.rows.map((row) => {
    const flat: Record<string, string> = {};
    result.dimensionHeaders?.forEach((header, index) => {
      flat[header.name] = row.dimensionValues?.[index]?.value || "";
    });
    result.metricHeaders.forEach((header, index) => {
      flat[header.name] = row.metricValues[index]?.value || "";
    });
    return flat;
  });

const runReportEffect = (input: RunReportInput) =>
  Effect.gen(function* () {
    const client = yield* GA4Client;
    const propertyId = input.propertyId || client.defaultPropertyId;

    logger.debug("Running GA4 report", {
      propertyId,
      dimensions: input.dimensions?.map((d) => d.name),
      metrics: input.metrics.map((m) => m.name),
    });

    const result = yield* client.runReport(input);
    const rows = formatRows(result);
    const summary = `GA4 Report for property ${propertyId}: ${result.rowCount} rows returned`;

    logger.info("GA4 report complete", { propertyId, rowCount: result.rowCount });

    const payload = {
      summary,
      propertyId,
      dateRanges: input.dateRanges,
      rowCount: result.rowCount,
      dimensions: result.dimensionHeaders?.map((h) => h.name),
      metrics: result.metricHeaders.map((h) => h.name),
      rows,
      metadata: result.metadata,
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }).pipe(
    Effect.catchTags({
      GA4ApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `GA4 API error: ${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      GA4QuotaError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `GA4 API quota exceeded: ${error.message}${
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
              text: `GA4 request timed out during ${error.operation}${
                error.duration ? ` after ${error.duration}` : ""
              }.`,
            },
          ],
          isError: true as const,
        }),
    }),
  );

export function registerRunReportTool(server: McpServer, run: ToolRunner): void {
  server.registerTool(
    "ga4_run_report",
    {
      title: "Run GA4 Report",
      description: `Run a Google Analytics 4 report with custom dimensions, metrics, and filters.

Common dimensions: ${COMMON_DIMENSIONS.join(", ")}

Common metrics: ${COMMON_METRICS.join(", ")}

Date formats: YYYY-MM-DD or relative (today, yesterday, 7daysAgo, 30daysAgo, etc.)

Pass propertyId to target a specific brand's property without restarting the server.`,
      inputSchema: runReportSchema,
    },
    (args) => run(runReportEffect(args as RunReportInput)),
  );
}
