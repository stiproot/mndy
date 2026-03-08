import type { CollectRequest, CollectResponse, DataSource, SourceCacheStatus } from "../schemas/data-collection.schema.js";
import { AgentError } from "../types/index.js";
import {
  createGA4AnalystAgent,
  createShopifyAnalystAgent,
  getAvailableAnalyticsSources,
} from "../agents/index.js";
import {
  buildGA4AnalystPrompt,
  buildShopifyAnalystPrompt,
} from "../prompts/index.js";
import { createScopedLogger, logger } from "../utils/logger.js";
import type { AgentMessage } from "cc-core";

/**
 * Service for collecting raw analytics data from various sources
 * and persisting to Dapr actors via the submit tools.
 */
export class DataCollectionService {
  /**
   * Collect data from specified sources
   */
  async collectData(request: CollectRequest): Promise<CollectResponse> {
    const startTime = Date.now();
    const { dateRange, sources, brandId, force } = request;
    const { startDate, endDate } = dateRange;

    logger.info(
      `Starting data collection for ${startDate} to ${endDate}`,
      { sources, brandId, force },
      "DataCollection"
    );

    // Check which sources are available
    const availableSources = getAvailableAnalyticsSources();

    // Check cache status if not forcing refresh
    const cacheStatus: Record<DataSource, boolean> = {
      ga4: false,
      shopify: false,
      meta: false,
    };

    if (!force) {
      const cacheChecks = await this.checkCachedData(dateRange, sources, brandId);
      for (const check of cacheChecks) {
        cacheStatus[check.source] = check.cached;
      }
    }

    // Collect data from each source
    const collectionResults: CollectResponse["collected"] = {};

    const collectionPromises = sources.map(async (source) => {
      // Skip if cached and not forcing refresh
      if (cacheStatus[source] && !force) {
        const actorId = this.buildActorId(source, brandId, startDate, endDate);
        return {
          source,
          result: {
            status: "cached" as const,
            actorId,
            message: "Data already cached",
          },
        };
      }

      // Check if source is available
      if (!this.isSourceAvailable(source, availableSources)) {
        return {
          source,
          result: {
            status: "skipped" as const,
            message: `${source.toUpperCase()} MCP not configured`,
          },
        };
      }

      try {
        const actorId = await this.collectFromSource(source, startDate, endDate, brandId);
        return {
          source,
          result: {
            status: "success" as const,
            actorId,
          },
        };
      } catch (error) {
        logger.warn(
          `${source} collection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          undefined,
          "DataCollection"
        );
        return {
          source,
          result: {
            status: "failed" as const,
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    });

    const results = await Promise.all(collectionPromises);

    for (const { source, result } of results) {
      collectionResults[source] = result;
    }

    const processingTimeMs = Date.now() - startTime;

    logger.info(
      `Data collection complete in ${processingTimeMs}ms`,
      { results: Object.keys(collectionResults) },
      "DataCollection"
    );

    return {
      collected: collectionResults,
      cached: cacheStatus,
      metadata: {
        processingTimeMs,
        dateRange,
        brandId,
      },
    };
  }

  /**
   * Check if data is cached for the given sources
   */
  async checkCachedData(
    dateRange: { startDate: string; endDate: string },
    sources: DataSource[],
    brandId: string
  ): Promise<SourceCacheStatus[]> {
    // For now, we assume data is not cached
    // In a full implementation, this would query the actors via dapr-mcp
    return sources.map((source) => ({
      source,
      cached: false,
      actorId: this.buildActorId(source, brandId, dateRange.startDate, dateRange.endDate),
    }));
  }

  /**
   * Build actor ID for a source
   */
  private buildActorId(
    source: DataSource,
    brandId: string,
    startDate: string,
    endDate: string
  ): string {
    return `${source}-${brandId}-${startDate}-${endDate}`;
  }

  /**
   * Check if a source is available
   */
  private isSourceAvailable(
    source: DataSource,
    availableSources: { ga4: boolean; shopify: boolean; meta: boolean }
  ): boolean {
    return availableSources[source] ?? false;
  }

  /**
   * Collect data from a specific source
   */
  private async collectFromSource(
    source: DataSource,
    startDate: string,
    endDate: string,
    brandId: string
  ): Promise<string> {
    switch (source) {
      case "ga4":
        return this.runGA4Collector(startDate, endDate, brandId);
      case "shopify":
        return this.runShopifyCollector(startDate, endDate, brandId);
      case "meta":
        throw new AgentError("Meta collection not yet implemented", "data-collection");
      default:
        throw new AgentError(`Unknown source: ${source}`, "data-collection");
    }
  }

  /**
   * Create an onMessage callback for debug logging
   */
  private createMessageLogger(agentName: string): (message: AgentMessage) => void {
    const scopedLogger = createScopedLogger(agentName);
    return (message: AgentMessage) => {
      if (message.type === "text") {
        scopedLogger.debug("Agent response", { content: message.content?.substring(0, 200) });
      } else if (message.type === "tool_use") {
        scopedLogger.debug("Tool call", { tool: message.toolName, input: message.toolInput });
      } else if (message.type === "tool_result") {
        scopedLogger.debug("Tool result", { isError: message.isError });
      }
    };
  }

  /**
   * Run GA4 data collection agent
   */
  private async runGA4Collector(
    startDate: string,
    endDate: string,
    brandId: string
  ): Promise<string> {
    const agent = createGA4AnalystAgent();

    if (!agent) {
      throw new AgentError("GA4 MCP not configured", "ga4-collector");
    }

    const prompt = buildGA4AnalystPrompt(startDate, endDate, brandId);

    const result = await agent.execute(prompt, {
      onMessage: this.createMessageLogger("ga4-collector"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "GA4 data collection failed",
        "ga4-collector"
      );
    }

    // Return the actor ID where data was persisted
    return `ga4-${brandId}-${startDate}-${endDate}`;
  }

  /**
   * Run Shopify data collection agent
   */
  private async runShopifyCollector(
    startDate: string,
    endDate: string,
    brandId: string
  ): Promise<string> {
    const agent = createShopifyAnalystAgent();

    if (!agent) {
      throw new AgentError("Shopify MCP not configured", "shopify-collector");
    }

    const prompt = buildShopifyAnalystPrompt(startDate, endDate, brandId);

    const result = await agent.execute(prompt, {
      onMessage: this.createMessageLogger("shopify-collector"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Shopify data collection failed",
        "shopify-collector"
      );
    }

    // Return the actor ID where data was persisted
    return `shopify-${brandId}-${startDate}-${endDate}`;
  }
}
