import type { AnalyzeRequest, DataSource } from "../schemas/data-collection.schema.js";
import type { BrandInsightsResponse } from "../schemas/brand-insights.schema.js";
import type { StreamEvent } from "../types/index.js";
import { AgentError } from "../types/index.js";
import { createBrandOrchestratorAgent } from "../agents/index.js";
import { buildBrandSynthesisPrompt } from "../prompts/index.js";
import { createScopedLogger, logger } from "../utils/logger.js";
import { getBrandInsightsReport } from "../utils/dapr-persistence.js";
import type { AgentMessage } from "cc-core";

/**
 * Service for analyzing cached data and generating brand insights reports.
 * This service expects data to already be collected and cached via DataCollectionService.
 */
export class BrandAnalysisService {
  /**
   * Analyze cached data and generate brand insights report (synchronous)
   */
  async analyze(request: AnalyzeRequest): Promise<BrandInsightsResponse> {
    const startTime = Date.now();
    const { dateRange, sources, brandId } = request;
    const { startDate, endDate } = dateRange;

    logger.info(
      `Starting brand analysis for ${startDate} to ${endDate}`,
      { sources, brandId },
      "BrandAnalysis"
    );

    // Retrieve cached data from actors
    const cachedData = await this.retrieveCachedData(sources, brandId, startDate, endDate);

    // Check if we have at least one source with data
    const availableData = Object.entries(cachedData).filter(([, data]) => data !== null);
    if (availableData.length === 0) {
      throw new AgentError(
        "No cached data found for the specified sources. Run /brand-insights/collect first.",
        "brand-analysis"
      );
    }

    // Synthesize results using orchestrator
    const result = await this.synthesizeResults(
      startDate,
      endDate,
      cachedData.ga4,
      cachedData.shopify,
      cachedData.meta,
      startTime,
      brandId
    );

    logger.info(
      `Brand analysis complete in ${Date.now() - startTime}ms`,
      undefined,
      "BrandAnalysis"
    );

    return result;
  }

  /**
   * Analyze cached data with streaming (SSE)
   */
  async *streamAnalyze(request: AnalyzeRequest): AsyncGenerator<StreamEvent> {
    const startTime = Date.now();
    const { dateRange, sources, brandId } = request;
    const { startDate, endDate } = dateRange;

    yield {
      type: "start",
      data: { dateRange, sources, brandId },
    };

    // Retrieve cached data
    yield {
      type: "phase",
      data: { phase: "retrieve-cached-data", status: "started" },
    };

    let cachedData: Record<string, string | null>;
    try {
      cachedData = await this.retrieveCachedData(sources, brandId, startDate, endDate);
      yield {
        type: "phase",
        data: { phase: "retrieve-cached-data", status: "completed" },
      };
    } catch (error) {
      yield {
        type: "phase",
        data: {
          phase: "retrieve-cached-data",
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
      throw error;
    }

    // Check if we have data
    const availableData = Object.entries(cachedData).filter(([, data]) => data !== null);
    if (availableData.length === 0) {
      yield {
        type: "error",
        data: {
          message: "No cached data found",
          code: "NO_CACHED_DATA",
        },
      };
      throw new AgentError(
        "No cached data found. Run /brand-insights/collect first.",
        "brand-analysis"
      );
    }

    // Synthesis phase
    yield {
      type: "phase",
      data: { phase: "synthesis", status: "started" },
    };

    const orchestrator = createBrandOrchestratorAgent();
    const actorId = `brand-${brandId}`;
    const synthesisPrompt = buildBrandSynthesisPrompt(
      startDate,
      endDate,
      cachedData.ga4,
      cachedData.shopify,
      cachedData.meta,
      startTime,
      brandId
    );

    try {
      for await (const message of orchestrator.stream(synthesisPrompt)) {
        if (message.type === "text") {
          yield {
            type: "text",
            data: { content: message.content },
          };
        } else if (message.type === "tool_use") {
          yield {
            type: "tool",
            data: {
              tool: message.toolName ?? "unknown",
              input: message.toolInput,
            },
          };
        }
      }

      yield {
        type: "phase",
        data: { phase: "synthesis", status: "completed" },
      };
    } catch (error) {
      yield {
        type: "phase",
        data: {
          phase: "synthesis",
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
      throw error;
    }

    // Retrieve the report from the actor (persisted by submit_brand_report)
    const report = await getBrandInsightsReport(actorId);

    if (!report) {
      throw new AgentError(
        `Brand report not found in actor ${actorId}. The orchestrator may have failed to call submit_brand_report.`,
        "brand-orchestrator"
      );
    }

    // Update processing time with actual value
    if (report.metadata) {
      report.metadata.processingTimeMs = Date.now() - startTime;
    }

    yield {
      type: "complete",
      data: report,
    };
  }

  /**
   * Retrieve cached data from Dapr actors
   * In the new architecture, the orchestrator will use get_cached_data tool
   * to retrieve data directly. This method prepares the data context.
   */
  private async retrieveCachedData(
    sources: DataSource[],
    brandId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, string | null>> {
    // In the new flow, we pass actor IDs to the orchestrator
    // which will use get_cached_data to retrieve the data.
    // For now, we return formatted strings indicating where to find data.

    const result: Record<string, string | null> = {
      ga4: null,
      shopify: null,
      meta: null,
    };

    for (const source of sources) {
      const actorId = `${source}-${brandId}-${startDate}-${endDate}`;
      // Provide context about where to find the data
      result[source] = JSON.stringify({
        actorId,
        source,
        instruction: `Use get_cached_data tool with source="${source}" and actorId="${actorId}" to retrieve the data.`,
      });
    }

    return result;
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
   * Synthesize results from cached data
   */
  private async synthesizeResults(
    startDate: string,
    endDate: string,
    ga4Data: string | null,
    shopifyData: string | null,
    metaData: string | null,
    startTime: number,
    brandId: string
  ): Promise<BrandInsightsResponse> {
    const orchestrator = createBrandOrchestratorAgent();
    const actorId = `brand-${brandId}`;
    const synthesisPrompt = buildBrandSynthesisPrompt(
      startDate,
      endDate,
      ga4Data,
      shopifyData,
      metaData,
      startTime,
      brandId
    );

    const result = await orchestrator.execute(synthesisPrompt, {
      onMessage: this.createMessageLogger("brand-orchestrator"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Brand orchestrator synthesis failed",
        "brand-orchestrator"
      );
    }

    // The orchestrator calls submit_brand_report to persist the report.
    // Now retrieve it from the actor to return to the caller.
    const report = await getBrandInsightsReport(actorId);

    if (!report) {
      throw new AgentError(
        `Brand report not found in actor ${actorId}. The orchestrator may have failed to call submit_brand_report.`,
        "brand-orchestrator"
      );
    }

    // Update processing time with actual value
    if (report.metadata) {
      report.metadata.processingTimeMs = Date.now() - startTime;
    }

    return report;
  }
}
