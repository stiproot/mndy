/**
 * Actor interfaces and state types for dapr-actor-svc
 */

// =============================================================================
// BrandInsightsActor Types
// =============================================================================

/**
 * Interface for the BrandInsightsActor.
 * Defines the contract for storing and retrieving brand insights reports.
 */
export interface IBrandInsightsActor {
  /**
   * Save a brand insights report
   */
  saveReport(report: BrandInsightsReport): Promise<void>;

  /**
   * Get the current/latest report
   */
  getReport(): Promise<BrandInsightsReport | null>;

  /**
   * Get the report history (if tracking is enabled)
   */
  getReportHistory(): Promise<BrandInsightsReport[]>;
}

/**
 * Key metrics from the brand analysis
 */
export interface BrandKeyMetrics {
  revenue: number | null;
  sessions: number | null;
  conversions: number | null;
  roas: number | null;
}

/**
 * Summary section of the brand insights report
 */
export interface BrandSummary {
  overallHealthScore: number;
  keyMetrics: BrandKeyMetrics;
  briefDescription: string;
}

/**
 * Recommendation from the analysis
 */
export interface BrandRecommendation {
  category: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
}

/**
 * Insights extracted from the analysis
 */
export interface BrandInsights {
  wins: string[];
  concerns: string[];
  recommendations: BrandRecommendation[];
}

/**
 * Date range for the analysis
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Metadata about the report generation
 */
export interface BrandReportMetadata {
  sources: string[];
  dateRange: DateRange;
  processingTimeMs: number;
}

/**
 * Complete brand insights report structure.
 * Matches the schema from cc-svc brand-insights endpoint.
 */
export interface BrandInsightsReport {
  brand: {
    analyzedAt: string;
  };
  summary: BrandSummary;
  ga4Analysis?: unknown;
  shopifyAnalysis?: unknown;
  metaAnalysis?: unknown;
  insights: BrandInsights;
  metadata: BrandReportMetadata;
}

// =============================================================================
// GA4DataActor Types
// =============================================================================

/**
 * Channel breakdown from GA4
 */
export interface GA4Channel {
  channel: string;
  sessions: number;
  conversions: number;
}

/**
 * Page breakdown from GA4
 */
export interface GA4Page {
  page: string;
  views: number;
}

/**
 * Raw GA4 analytics data collected from the GA4 MCP.
 * Stored by GA4DataActor for later analysis.
 */
export interface GA4RawData {
  dateRange: DateRange;
  collectedAt: string;
  sessions: number;
  activeUsers: number;
  newUsers: number;
  conversions: number;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  topChannels: GA4Channel[];
  topPages: GA4Page[];
  observations?: string[];
}

/**
 * Interface for the GA4DataActor.
 * Stores and retrieves raw GA4 analytics data.
 */
export interface IGA4DataActor {
  saveData(data: GA4RawData): Promise<void>;
  getData(): Promise<GA4RawData | null>;
  getDataHistory(): Promise<GA4RawData[]>;
}

// =============================================================================
// ShopifyDataActor Types
// =============================================================================

/**
 * Product breakdown from Shopify
 */
export interface ShopifyProduct {
  product: string;
  quantity: number;
  revenue: number;
}

/**
 * Raw Shopify analytics data collected from the Shopify MCP.
 * Stored by ShopifyDataActor for later analysis.
 */
export interface ShopifyRawData {
  dateRange: DateRange;
  collectedAt: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  newCustomers: number;
  returningCustomers: number;
  topProducts: ShopifyProduct[];
  observations?: string[];
}

/**
 * Interface for the ShopifyDataActor.
 * Stores and retrieves raw Shopify analytics data.
 */
export interface IShopifyDataActor {
  saveData(data: ShopifyRawData): Promise<void>;
  getData(): Promise<ShopifyRawData | null>;
  getDataHistory(): Promise<ShopifyRawData[]>;
}
