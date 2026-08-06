import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { GA4Client } from "../services/ga4.js";
import type { RunReportInput } from "../types.js";
import { COMMON_DIMENSIONS, COMMON_METRICS } from "../types.js";

const logger = createLogger("ga4_run_report");

/**
 * Input schema for the ga4_run_report tool (Zod for MCP SDK compatibility)
 */
export const runReportSchema = {
  propertyId: z.string().optional().describe("GA4 Property ID (uses default if not provided)"),
  dateRanges: z
    .array(
      z.object({
        startDate: z.string().describe("Start date (YYYY-MM-DD or relative: 'yesterday', '7daysAgo', '30daysAgo')"),
        endDate: z.string().describe("End date (YYYY-MM-DD or relative: 'today', 'yesterday')"),
      })
    )
    .min(1)
    .max(4)
    .describe("Date ranges for the report (max 4)"),
  dimensions: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            `Dimension name. Common: ${COMMON_DIMENSIONS.slice(0, 8).join(", ")}`
          ),
      })
    )
    .optional()
    .describe("Dimensions to include (e.g., date, sessionSource, country)"),
  metrics: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            `Metric name. Common: ${COMMON_METRICS.slice(0, 8).join(", ")}`
          ),
      })
    )
    .min(1)
    .describe("Metrics to include (e.g., sessions, activeUsers, conversions)"),
  dimensionFilter: z
    .object({
      fieldName: z.string().describe("Dimension to filter on"),
      stringFilter: z
        .object({
          matchType: z.enum(["EXACT", "BEGINS_WITH", "ENDS_WITH", "CONTAINS", "FULL_REGEXP", "PARTIAL_REGEXP"]),
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
  limit: z.number().min(1).max(100000).optional().describe("Maximum rows to return (default 10000)"),
  offset: z.number().min(0).optional().describe("Row offset for pagination"),
};

/**
 * Run report effect - the core business logic
 */
const runReportEffect = (input: RunReportInput) =>
  Effect.gen(function* () {
    const client = yield* GA4Client;

    const propertyId = input.propertyId || client.getDefaultPropertyId();

    logger.debug("Running GA4 report", {
      propertyId,
      dateRanges: input.dateRanges,
      dimensions: input.dimensions?.map((d) => d.name),
      metrics: input.metrics.map((m) => m.name),
    });

    const result = yield* client.runReport(input);

    logger.debug("GA4 report response", {
      rowCount: result.rowCount,
      dimensions: result.dimensionHeaders?.map((h) => h.name),
      metrics: result.metricHeaders.map((h) => h.name),
    });

    // Format the response for readability
    const formattedRows = result.rows.map((row) => {
      const obj: Record<string, string> = {};

      // Add dimension values
      result.dimensionHeaders?.forEach((header, i) => {
        obj[header.name] = row.dimensionValues?.[i]?.value || "";
      });

      // Add metric values
      result.metricHeaders.forEach((header, i) => {
        obj[header.name] = row.metricValues[i]?.value || "";
      });

      return obj;
    });

    const summary = `GA4 Report for property ${propertyId}: ${result.rowCount} rows returned`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              summary,
              propertyId,
              dateRanges: input.dateRanges,
              rowCount: result.rowCount,
              dimensions: result.dimensionHeaders?.map((h) => h.name),
              metrics: result.metricHeaders.map((h) => h.name),
              rows: formattedRows,
              metadata: result.metadata,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        summary,
        propertyId,
        rowCount: result.rowCount,
        rows: formattedRows,
        metadata: result.metadata,
      },
    };
  }).pipe(
    Effect.catchTags({
      GA4ApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Error running GA4 report: ${error.message}${error.code ? ` (${error.code})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      GA4QuotaError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `GA4 API quota exceeded: ${error.message}${error.retryAfter ? `. Retry after ${error.retryAfter} seconds.` : ""}`,
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
 * Register the ga4_run_report tool on the server
 */
export function registerRunReportTool(server: McpServer): void {
  server.registerTool(
    "ga4_run_report",
    {
      title: "Run GA4 Report",
      description: `Run a Google Analytics 4 report with custom dimensions, metrics, and filters.

Common dimensions: ${COMMON_DIMENSIONS.join(", ")}

Common metrics: ${COMMON_METRICS.join(", ")}

Date formats: YYYY-MM-DD or relative (today, yesterday, 7daysAgo, 30daysAgo, etc.)`,
      inputSchema: runReportSchema,
    },
    (args) => {
      const input: RunReportInput = {
        propertyId: args.propertyId,
        dateRanges: args.dateRanges,
        dimensions: args.dimensions,
        metrics: args.metrics,
        dimensionFilter: args.dimensionFilter,
        limit: args.limit,
        offset: args.offset,
      };

      // Execute Effect at the boundary (MCP SDK expects Promise)
      return Effect.runPromise(runReportEffect(input).pipe(Effect.provide(GA4Client.Default)));
    }
  );
}
