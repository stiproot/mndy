import type { BrandInsightsRequest, BrandInsightsResponse } from "../schemas/index.js";
import type { StreamEvent } from "../types/index.js";
import { AgentError } from "../types/index.js";
import {
  createGA4AnalystAgent,
  createShopifyAnalystAgent,
  createMetaAnalystAgent,
  createBrandOrchestratorAgent,
  getAvailableAnalyticsSources,
} from "../agents/index.js";
import {
  buildGA4AnalystPrompt,
  buildShopifyAnalystPrompt,
  buildMetaAnalystPrompt,
  buildBrandSynthesisPrompt,
} from "../prompts/index.js";
import { brandInsightsResponseSchema } from "../schemas/index.js";
import { createScopedLogger, logger } from "../utils/logger.js";
import { persistBrandInsightsReport } from "../utils/dapr-persistence.js";
import type { AgentMessage } from "cc-core";

/**
 * Brand insights stream event types
 */
export interface BrandInsightsStreamEvent extends StreamEvent {
  type: "start" | "phase" | "text" | "tool" | "error" | "complete";
}

export class BrandInsightsService {
  /**
   * Get brand insights (synchronous)
   */
  async getInsights(request: BrandInsightsRequest): Promise<BrandInsightsResponse> {
    const startTime = Date.now();
    const { dateRange, options } = request;
    const { startDate, endDate } = dateRange;

    logger.info(
      `Starting brand analysis for ${startDate} to ${endDate}`,
      undefined,
      "BrandInsights"
    );

    // Determine which sources to use
    const availableSources = getAvailableAnalyticsSources();
    const useGA4 = availableSources.ga4 && (options?.includeGA4 !== false);
    const useShopify = availableSources.shopify && (options?.includeShopify !== false);
    const useMeta = availableSources.meta && (options?.includeMeta !== false);

    if (!useGA4 && !useShopify && !useMeta) {
      throw new AgentError(
        "No analytics sources available. Configure at least one MCP URL (GA4_MCP_URL, SHOPIFY_MCP_URL, or META_MCP_URL).",
        "brand-insights"
      );
    }

    // Run available analysts in parallel
    const analysisPromises: Promise<{ source: string; result: string | null }>[] = [];

    if (useGA4) {
      analysisPromises.push(
        this.runGA4Analyst(startDate, endDate)
          .then((result) => ({ source: "ga4", result }))
          .catch((error) => {
            logger.warn(`GA4 analysis failed: ${error.message}`, undefined, "BrandInsights");
            return { source: "ga4", result: null };
          })
      );
    }

    if (useShopify) {
      analysisPromises.push(
        this.runShopifyAnalyst(startDate, endDate)
          .then((result) => ({ source: "shopify", result }))
          .catch((error) => {
            logger.warn(`Shopify analysis failed: ${error.message}`, undefined, "BrandInsights");
            return { source: "shopify", result: null };
          })
      );
    }

    if (useMeta) {
      analysisPromises.push(
        this.runMetaAnalyst(startDate, endDate)
          .then((result) => ({ source: "meta", result }))
          .catch((error) => {
            logger.warn(`Meta analysis failed: ${error.message}`, undefined, "BrandInsights");
            return { source: "meta", result: null };
          })
      );
    }

    const analysisResults = await Promise.all(analysisPromises);

    const ga4Analysis = analysisResults.find((r) => r.source === "ga4")?.result ?? null;
    const shopifyAnalysis = analysisResults.find((r) => r.source === "shopify")?.result ?? null;
    const metaAnalysis = analysisResults.find((r) => r.source === "meta")?.result ?? null;

    // Check if we have at least one successful analysis
    if (!ga4Analysis && !shopifyAnalysis && !metaAnalysis) {
      throw new AgentError(
        "All analytics sources failed. Check MCP server connectivity and credentials.",
        "brand-insights"
      );
    }

    logger.info("Analyst agents completed, synthesizing results...", undefined, "BrandInsights");

    // Synthesize results
    const result = await this.synthesizeResults(
      startDate,
      endDate,
      ga4Analysis,
      shopifyAnalysis,
      metaAnalysis,
      startTime
    );

    // Persist the report to Dapr actor (fire and forget, don't block response)
    persistBrandInsightsReport(result).catch((error) => {
      logger.warn(
        `Background persistence failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        undefined,
        "BrandInsights"
      );
    });

    logger.info(
      `Brand analysis complete in ${Date.now() - startTime}ms`,
      undefined,
      "BrandInsights"
    );

    return result;
  }

  /**
   * Stream brand insights (SSE)
   */
  async *streamInsights(request: BrandInsightsRequest): AsyncGenerator<StreamEvent> {
    const startTime = Date.now();
    const { dateRange, options } = request;
    const { startDate, endDate } = dateRange;

    // Emit start event
    yield {
      type: "start",
      data: { dateRange: { startDate, endDate } },
    };

    // Determine which sources to use
    const availableSources = getAvailableAnalyticsSources();
    const useGA4 = availableSources.ga4 && (options?.includeGA4 !== false);
    const useShopify = availableSources.shopify && (options?.includeShopify !== false);
    const useMeta = availableSources.meta && (options?.includeMeta !== false);

    if (!useGA4 && !useShopify && !useMeta) {
      yield {
        type: "error",
        data: {
          message: "No analytics sources available",
          code: "NO_SOURCES",
        },
      };
      throw new AgentError(
        "No analytics sources available",
        "brand-insights"
      );
    }

    let ga4Analysis: string | null = null;
    let shopifyAnalysis: string | null = null;
    let metaAnalysis: string | null = null;

    // Run GA4 analyst
    if (useGA4) {
      yield {
        type: "phase",
        data: { phase: "ga4-analysis", status: "started" },
      };

      try {
        ga4Analysis = await this.runGA4Analyst(startDate, endDate);
        yield {
          type: "phase",
          data: { phase: "ga4-analysis", status: "completed" },
        };
      } catch (error) {
        yield {
          type: "phase",
          data: {
            phase: "ga4-analysis",
            status: "failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
        // Continue with other sources
      }
    }

    // Run Shopify analyst
    if (useShopify) {
      yield {
        type: "phase",
        data: { phase: "shopify-analysis", status: "started" },
      };

      try {
        shopifyAnalysis = await this.runShopifyAnalyst(startDate, endDate);
        yield {
          type: "phase",
          data: { phase: "shopify-analysis", status: "completed" },
        };
      } catch (error) {
        yield {
          type: "phase",
          data: {
            phase: "shopify-analysis",
            status: "failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
        // Continue with other sources
      }
    }

    // Meta analyst placeholder
    if (useMeta) {
      yield {
        type: "phase",
        data: { phase: "meta-analysis", status: "skipped", message: "Meta MCP not yet implemented" },
      };
    }

    // Check if we have at least one successful analysis
    if (!ga4Analysis && !shopifyAnalysis && !metaAnalysis) {
      yield {
        type: "error",
        data: {
          message: "All analytics sources failed",
          code: "ALL_SOURCES_FAILED",
        },
      };
      throw new AgentError(
        "All analytics sources failed",
        "brand-insights"
      );
    }

    // Synthesis phase with streaming
    yield {
      type: "phase",
      data: { phase: "synthesis", status: "started" },
    };

    const orchestrator = createBrandOrchestratorAgent();
    const synthesisPrompt = buildBrandSynthesisPrompt(
      startDate,
      endDate,
      ga4Analysis,
      shopifyAnalysis,
      metaAnalysis,
      startTime
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

    // Persist the report to Dapr actor (fire and forget)
    persistBrandInsightsReport(parsed).catch((error) => {
      logger.warn(
        `Background persistence failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        undefined,
        "BrandInsights"
      );
    });

    yield {
      type: "complete",
      data: parsed,
    };
  }

  /**
   * Create an onMessage callback for debug logging
   */
  private createMessageLogger(agentName: string): (message: AgentMessage) => void {
    const scopedLogger = createScopedLogger(agentName);
    return (message: AgentMessage) => {
      if (message.type === "text") {
        scopedLogger.debug("Claude thinking", { content: message.content });
      } else if (message.type === "tool_use") {
        scopedLogger.debug("Tool call", { tool: message.toolName, input: message.toolInput });
      } else if (message.type === "tool_result") {
        scopedLogger.debug("Tool result", { content: message.content, isError: message.isError });
      }
    };
  }

  /**
   * Run the GA4 analyst agent
   */
  private async runGA4Analyst(startDate: string, endDate: string): Promise<string> {
    const agent = createGA4AnalystAgent();

    if (!agent) {
      throw new AgentError("GA4 MCP not configured", "ga4-analyst");
    }

    const prompt = buildGA4AnalystPrompt(startDate, endDate);

    const result = await agent.execute(prompt, {
      onMessage: this.createMessageLogger("ga4-analyst"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "GA4 analyst failed",
        "ga4-analyst"
      );
    }

    return result.result;
  }

  /**
   * Run the Shopify analyst agent
   */
  private async runShopifyAnalyst(startDate: string, endDate: string): Promise<string> {
    const agent = createShopifyAnalystAgent();

    if (!agent) {
      throw new AgentError("Shopify MCP not configured", "shopify-analyst");
    }

    const prompt = buildShopifyAnalystPrompt(startDate, endDate);

    const result = await agent.execute(prompt, {
      onMessage: this.createMessageLogger("shopify-analyst"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Shopify analyst failed",
        "shopify-analyst"
      );
    }

    return result.result;
  }

  /**
   * Run the Meta Ads analyst agent
   */
  private async runMetaAnalyst(startDate: string, endDate: string): Promise<string> {
    const agent = createMetaAnalystAgent();

    if (!agent) {
      throw new AgentError("Meta MCP not configured", "meta-analyst");
    }

    const prompt = buildMetaAnalystPrompt(startDate, endDate);

    const result = await agent.execute(prompt, {
      onMessage: this.createMessageLogger("meta-analyst"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Meta analyst failed",
        "meta-analyst"
      );
    }

    return result.result;
  }

  /**
   * Synthesize results from all analyst agents
   */
  private async synthesizeResults(
    startDate: string,
    endDate: string,
    ga4Analysis: string | null,
    shopifyAnalysis: string | null,
    metaAnalysis: string | null,
    startTime: number
  ): Promise<BrandInsightsResponse> {
    const orchestrator = createBrandOrchestratorAgent();
    const synthesisPrompt = buildBrandSynthesisPrompt(
      startDate,
      endDate,
      ga4Analysis,
      shopifyAnalysis,
      metaAnalysis,
      startTime
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
