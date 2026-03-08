import type { AnalyzeRequest, DataSource } from "../schemas/data-collection.schema.js";
import type { BrandInsightsResponse } from "../schemas/brand-insights.schema.js";
import type { StreamEvent } from "../types/index.js";
import { AgentError } from "../types/index.js";
import { createBrandOrchestratorAgent } from "../agents/index.js";
import { buildBrandSynthesisPrompt } from "../prompts/index.js";
import { brandInsightsResponseSchema } from "../schemas/index.js";
import { createScopedLogger, logger } from "../utils/logger.js";
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
    const synthesisPrompt = buildBrandSynthesisPrompt(
      startDate,
      endDate,
      cachedData.ga4,
      cachedData.shopify,
      cachedData.meta,
      startTime,
      brandId
    );

    let fullResponse = "";

    try {
      for await (const message of orchestrator.stream(synthesisPrompt)) {
        if (message.type === "text") {
          fullResponse += message.content;
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

    // Parse and validate the final result
    const parsed = this.parseAndValidateResponse(fullResponse, startTime);

    yield {
      type: "complete",
      data: parsed,
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

    return this.parseAndValidateResponse(result.result, startTime);
  }

  /**
   * Parse and validate the JSON response from the orchestrator
   */
  private parseAndValidateResponse(
    result: string,
    startTime: number
  ): BrandInsightsResponse {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = result;

    // Remove markdown code block if present
    const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AgentError(
        "No valid JSON found in orchestrator response",
        "brand-orchestrator",
        { rawResponse: result.substring(0, 500) }
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Update processing time
      if (parsed.metadata) {
        parsed.metadata.processingTimeMs = Date.now() - startTime;
      }

      // Validate with Zod schema
      const validated = brandInsightsResponseSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AgentError(
          `Invalid JSON in orchestrator response: ${error.message}`,
          "brand-orchestrator",
          { rawResponse: result.substring(0, 500) }
        );
      }
      throw error;
    }
  }
}
