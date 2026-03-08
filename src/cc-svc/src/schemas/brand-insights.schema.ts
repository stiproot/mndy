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

// Request schema
export const brandInsightsRequestSchema = z.object({
  dateRange: dateRangeSchema,
  options: z
    .object({
      includeGA4: z.boolean().default(true),
      includeShopify: z.boolean().default(true),
      includeMeta: z.boolean().default(true),
    })
    .optional(),
});

export type BrandInsightsRequest = z.infer<typeof brandInsightsRequestSchema>;

// Key metrics schema
const keyMetricsSchema = z.object({
  revenue: z.number().nullable(),
  sessions: z.number().nullable(),
  conversions: z.number().nullable(),
  roas: z.number().nullable(),
});

// GA4 analysis schema
const ga4AnalysisSchema = z.object({
  sessions: z.number(),
  activeUsers: z.number(),
  newUsers: z.number(),
  conversions: z.number(),
  conversionRate: z.number(),
  bounceRate: z.number(),
  avgSessionDuration: z.number(),
  topChannels: z.array(
    z.object({
      channel: z.string(),
      sessions: z.number(),
      conversions: z.number(),
    })
  ),
  topPages: z.array(
    z.object({
      page: z.string(),
      views: z.number(),
    })
  ),
});

// Shopify analysis schema
const shopifyAnalysisSchema = z.object({
  totalRevenue: z.number(),
  totalOrders: z.number(),
  averageOrderValue: z.number(),
  totalItemsSold: z.number(),
  newCustomers: z.number(),
  returningCustomers: z.number(),
  topProducts: z.array(
    z.object({
      product: z.string(),
      quantity: z.number(),
      revenue: z.number(),
    })
  ),
});

// Meta analysis schema (future)
const metaAnalysisSchema = z.object({
  spend: z.number(),
  impressions: z.number(),
  clicks: z.number(),
  ctr: z.number(),
  cpc: z.number(),
  conversions: z.number(),
  roas: z.number(),
  topCampaigns: z.array(
    z.object({
      campaign: z.string(),
      spend: z.number(),
      conversions: z.number(),
      roas: z.number(),
    })
  ),
});

// Recommendation schema
const recommendationSchema = z.object({
  category: z.string(),
  suggestion: z.string(),
  priority: z.enum(["low", "medium", "high"]),
});

// Response schema
export const brandInsightsResponseSchema = z.object({
  brand: z.object({
    analyzedAt: z.string(),
  }),
  summary: z.object({
    overallHealthScore: z.number().min(0).max(100),
    keyMetrics: keyMetricsSchema,
    briefDescription: z.string(),
  }),
  ga4Analysis: ga4AnalysisSchema.nullable(),
  shopifyAnalysis: shopifyAnalysisSchema.nullable(),
  metaAnalysis: metaAnalysisSchema.nullable(),
  insights: z.object({
    wins: z.array(z.string()),
    concerns: z.array(z.string()),
    recommendations: z.array(recommendationSchema),
  }),
  metadata: z.object({
    sources: z.array(z.string()),
    dateRange: dateRangeSchema,
    processingTimeMs: z.number(),
  }),
});

export type BrandInsightsResponse = z.infer<typeof brandInsightsResponseSchema>;

// Sub-agent output schemas (for internal validation)
export const ga4AnalystOutputSchema = ga4AnalysisSchema.extend({
  observations: z.array(z.string()).optional(),
});

export const shopifyAnalystOutputSchema = shopifyAnalysisSchema.extend({
  observations: z.array(z.string()).optional(),
});

export const metaAnalystOutputSchema = metaAnalysisSchema.extend({
  observations: z.array(z.string()).optional(),
});

export type GA4AnalystOutput = z.infer<typeof ga4AnalystOutputSchema>;
export type ShopifyAnalystOutput = z.infer<typeof shopifyAnalystOutputSchema>;
export type MetaAnalystOutput = z.infer<typeof metaAnalystOutputSchema>;
