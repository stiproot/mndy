import { Config, Data } from "effect";
import { z } from "mcp-core";

// =============================================================================
// Tagged Errors
// =============================================================================

/**
 * MCP-specific error wrapper for Dapr operations
 */
export class DaprMcpError extends Data.TaggedError("DaprMcpError")<{
  readonly message: string;
  readonly tool?: string;
  readonly cause?: unknown;
}> {}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Server configuration using Effect Config module
 */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3006)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

export type ServerConfigType = Config.Config.Success<typeof ServerConfig>;

// =============================================================================
// Tool Input Schemas (Zod for MCP SDK compatibility)
// =============================================================================

/**
 * Input schema for dapr_actor_get_state tool.
 * Invokes an actor method to retrieve state.
 */
export const actorGetStateSchema = {
  actorType: z
    .string()
    .describe(
      "The actor type name (e.g., 'BrandInsightsActor'). This must match a registered actor type in your Dapr application."
    ),
  actorId: z
    .string()
    .describe(
      "The unique actor ID (e.g., 'brand-acme-2025-03-08'). This identifies a specific instance of the actor."
    ),
  method: z
    .string()
    .describe(
      "The actor method to invoke (e.g., 'GetReport', 'GetState'). The method must be implemented by the actor."
    ),
  payload: z
    .unknown()
    .optional()
    .describe(
      "Optional JSON payload to send to the actor method. Use this to pass arguments to the method."
    ),
};

/**
 * Input schema for dapr_actor_save_state tool.
 * Invokes an actor method to save state.
 */
export const actorSaveStateSchema = {
  actorType: z
    .string()
    .describe(
      "The actor type name (e.g., 'BrandInsightsActor'). This must match a registered actor type in your Dapr application."
    ),
  actorId: z
    .string()
    .describe(
      "The unique actor ID (e.g., 'brand-acme-2025-03-08'). This identifies a specific instance of the actor."
    ),
  method: z
    .string()
    .describe(
      "The actor method to invoke for saving (e.g., 'SaveReport', 'SetState'). The method must be implemented by the actor."
    ),
  payload: z
    .unknown()
    .describe(
      "JSON payload containing the data to save. This is passed to the actor method."
    ),
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface ActorGetStateInput {
  actorType: string;
  actorId: string;
  method: string;
  payload?: unknown;
}

export interface ActorSaveStateInput {
  actorType: string;
  actorId: string;
  method: string;
  payload: unknown;
}

// =============================================================================
// Structured Submit Tool Schemas
// =============================================================================

/**
 * Date range schema used across analytics tools
 */
const dateRangeSchema = z.object({
  startDate: z.string().describe("Start date in YYYY-MM-DD format"),
  endDate: z.string().describe("End date in YYYY-MM-DD format"),
});

/**
 * GA4 channel breakdown schema
 */
const ga4ChannelSchema = z.object({
  channel: z.string().describe("Channel name (e.g., 'Organic Search', 'Direct')"),
  sessions: z.number().describe("Number of sessions from this channel"),
  conversions: z.number().describe("Number of conversions from this channel"),
});

/**
 * GA4 page breakdown schema
 */
const ga4PageSchema = z.object({
  page: z.string().describe("Page path (e.g., '/products/item-1')"),
  views: z.number().describe("Number of page views"),
});

/**
 * Input schema for submit_ga4_data tool.
 * Structured output tool for GA4 analyst agents.
 */
export const submitGA4DataSchema = {
  actorId: z
    .string()
    .describe(
      "The actor ID for storing this data. Use format: 'ga4-{brandId}-{startDate}-{endDate}' (e.g., 'ga4-default-2025-03-01-2025-03-07')"
    ),
  data: z.object({
    dateRange: dateRangeSchema.describe("The date range this data covers"),
    sessions: z.number().describe("Total number of sessions"),
    activeUsers: z.number().describe("Number of active users"),
    newUsers: z.number().describe("Number of new users"),
    conversions: z.number().describe("Total number of conversions"),
    conversionRate: z.number().describe("Conversion rate as percentage (0-100)"),
    bounceRate: z.number().describe("Bounce rate as percentage (0-100)"),
    avgSessionDuration: z.number().describe("Average session duration in seconds"),
    topChannels: z.array(ga4ChannelSchema).describe("Top traffic channels (limit to 5)"),
    topPages: z.array(ga4PageSchema).describe("Top pages by views (limit to 5)"),
    observations: z.array(z.string()).optional().describe("Key observations from the data (2-3 insights)"),
  }).describe("The GA4 analytics data to persist"),
};

/**
 * Shopify product breakdown schema
 */
const shopifyProductSchema = z.object({
  product: z.string().describe("Product name"),
  quantity: z.number().describe("Number of units sold"),
  revenue: z.number().describe("Revenue from this product"),
});

/**
 * Input schema for submit_shopify_data tool.
 * Structured output tool for Shopify analyst agents.
 */
export const submitShopifyDataSchema = {
  actorId: z
    .string()
    .describe(
      "The actor ID for storing this data. Use format: 'shopify-{brandId}-{startDate}-{endDate}' (e.g., 'shopify-default-2025-03-01-2025-03-07')"
    ),
  data: z.object({
    dateRange: dateRangeSchema.describe("The date range this data covers"),
    totalRevenue: z.number().describe("Total revenue in store currency"),
    totalOrders: z.number().describe("Total number of orders"),
    averageOrderValue: z.number().describe("Average order value (totalRevenue / totalOrders)"),
    totalItemsSold: z.number().describe("Total number of items sold"),
    newCustomers: z.number().describe("Number of new customers"),
    returningCustomers: z.number().describe("Number of returning customers"),
    topProducts: z.array(shopifyProductSchema).describe("Top selling products (limit to 5)"),
    observations: z.array(z.string()).optional().describe("Key observations from the data (2-3 insights)"),
  }).describe("The Shopify analytics data to persist"),
};

/**
 * Brand recommendation schema
 */
const brandRecommendationSchema = z.object({
  category: z.string().describe("Category of the recommendation (e.g., 'Advertising', 'Content')"),
  suggestion: z.string().describe("The actionable recommendation"),
  priority: z.enum(["low", "medium", "high"]).describe("Priority level"),
});

/**
 * Input schema for submit_brand_report tool.
 * Structured output tool for brand orchestrator agents.
 */
export const submitBrandReportSchema = {
  actorId: z
    .string()
    .describe(
      "The actor ID for storing this report. Use format: 'brand-{brandId}' (e.g., 'brand-default')"
    ),
  report: z.object({
    brand: z.object({
      analyzedAt: z.string().describe("ISO timestamp of when the analysis was performed"),
    }),
    summary: z.object({
      overallHealthScore: z.number().min(0).max(100).describe("Overall brand health score (0-100)"),
      keyMetrics: z.object({
        revenue: z.number().nullable().describe("Total revenue"),
        sessions: z.number().nullable().describe("Total sessions"),
        conversions: z.number().nullable().describe("Total conversions"),
        roas: z.number().nullable().describe("Return on ad spend"),
      }),
      briefDescription: z.string().describe("2-3 sentence summary of brand health"),
    }),
    ga4Analysis: z.unknown().nullable().describe("Raw GA4 analysis data"),
    shopifyAnalysis: z.unknown().nullable().describe("Raw Shopify analysis data"),
    metaAnalysis: z.unknown().nullable().describe("Raw Meta Ads analysis data"),
    insights: z.object({
      wins: z.array(z.string()).describe("Positive findings (2-4 items)"),
      concerns: z.array(z.string()).describe("Issues requiring attention (2-4 items)"),
      recommendations: z.array(brandRecommendationSchema).describe("Actionable recommendations (3-5 items)"),
    }),
    metadata: z.object({
      sources: z.array(z.string()).describe("Data sources used (e.g., ['ga4', 'shopify'])"),
      dateRange: dateRangeSchema,
      processingTimeMs: z.number().describe("Processing time in milliseconds"),
    }),
  }).describe("The complete brand insights report"),
};

/**
 * Input schema for get_cached_data tool.
 * Retrieves cached raw data from data actors.
 */
export const getCachedDataSchema = {
  source: z
    .enum(["ga4", "shopify"])
    .describe("The data source to retrieve from"),
  actorId: z
    .string()
    .describe(
      "The actor ID to query. Use format: '{source}-{brandId}-{startDate}-{endDate}' (e.g., 'ga4-default-2025-03-01-2025-03-07')"
    ),
};

// =============================================================================
// Structured Submit Tool Input Types
// =============================================================================

export interface SubmitGA4DataInput {
  actorId: string;
  data: {
    dateRange: { startDate: string; endDate: string };
    sessions: number;
    activeUsers: number;
    newUsers: number;
    conversions: number;
    conversionRate: number;
    bounceRate: number;
    avgSessionDuration: number;
    topChannels: Array<{ channel: string; sessions: number; conversions: number }>;
    topPages: Array<{ page: string; views: number }>;
    observations?: string[];
  };
}

export interface SubmitShopifyDataInput {
  actorId: string;
  data: {
    dateRange: { startDate: string; endDate: string };
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
    newCustomers: number;
    returningCustomers: number;
    topProducts: Array<{ product: string; quantity: number; revenue: number }>;
    observations?: string[];
  };
}

export interface SubmitBrandReportInput {
  actorId: string;
  report: {
    brand: { analyzedAt: string };
    summary: {
      overallHealthScore: number;
      keyMetrics: {
        revenue: number | null;
        sessions: number | null;
        conversions: number | null;
        roas: number | null;
      };
      briefDescription: string;
    };
    ga4Analysis: unknown | null;
    shopifyAnalysis: unknown | null;
    metaAnalysis: unknown | null;
    insights: {
      wins: string[];
      concerns: string[];
      recommendations: Array<{
        category: string;
        suggestion: string;
        priority: "low" | "medium" | "high";
      }>;
    };
    metadata: {
      sources: string[];
      dateRange: { startDate: string; endDate: string };
      processingTimeMs: number;
    };
  };
}

export interface GetCachedDataInput {
  source: "ga4" | "shopify";
  actorId: string;
}

/**
 * Schema for get_brand_report tool.
 * Retrieves a persisted brand insights report from BrandInsightsActor.
 */
export const getBrandReportSchema = {
  actorId: z
    .string()
    .describe(
      "The actor ID for the brand report. Use format: 'brand-{brandId}' (e.g., 'brand-default', 'brand-test')"
    ),
};

export interface GetBrandReportInput {
  actorId: string;
}
