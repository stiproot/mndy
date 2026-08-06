import { z } from "zod";

// Date range schema (YYYY-MM-DD format)
const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Available data sources
export const dataSourceSchema = z.enum(["ga4", "shopify", "meta"]);
export type DataSource = z.infer<typeof dataSourceSchema>;

/**
 * Request schema for /brand-insights/collect
 * Collects raw data from analytics sources and persists to state store cache
 */
export const collectRequestSchema = z.object({
  dateRange: dateRangeSchema,
  sources: z.array(dataSourceSchema).min(1, "At least one source is required"),
  brandId: z.string().default("default"),
  force: z.boolean().default(false).describe("Force refresh even if data is cached"),
});

export type CollectRequest = z.infer<typeof collectRequestSchema>;

/**
 * Response schema for /brand-insights/collect
 */
export const collectResponseSchema = z.object({
  collected: z.record(
    dataSourceSchema,
    z.object({
      status: z.enum(["success", "failed", "skipped", "cached"]),
      stateKey: z.string().optional(),
      message: z.string().optional(),
    })
  ),
  cached: z.record(dataSourceSchema, z.boolean()),
  metadata: z.object({
    processingTimeMs: z.number(),
    dateRange: dateRangeSchema,
    brandId: z.string(),
  }),
});

export type CollectResponse = z.infer<typeof collectResponseSchema>;

/**
 * Request schema for /brand-insights/analyze
 * Analyzes cached data and generates brand insights report
 */
export const analyzeRequestSchema = z.object({
  dateRange: dateRangeSchema,
  sources: z.array(dataSourceSchema).min(1, "At least one source is required"),
  brandId: z.string().default("default"),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/**
 * Cache status for a data source
 */
export interface SourceCacheStatus {
  source: DataSource;
  cached: boolean;
  stateKey: string;
  data?: unknown;
}
