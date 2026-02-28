import type {
  ContributorInsightsRequest,
  ContributorInsightsResponse,
  StreamEvent,
} from "../types/index.js";
import { AgentError } from "../types/index.js";
import {
  createIssueAnalyzerAgent,
  createActivityTrackerAgent,
  createQualityAssessorAgent,
  createOrchestratorAgent,
} from "../agents/index.js";
import {
  buildIssueAnalyzerPrompt,
  buildActivityTrackerPrompt,
  buildQualityAssessorPrompt,
  buildSynthesisPrompt,
} from "../prompts/index.js";
import { contributorInsightsResponseSchema } from "../schemas/index.js";

export class OrchestratorService {
  /**
   * Get contributor insights (synchronous)
   */
  async getInsights(
    request: ContributorInsightsRequest
  ): Promise<ContributorInsightsResponse> {
    const startTime = Date.now();
    const { owner, repo, username, options } = request;

    console.log(
      `[Orchestrator] Starting analysis for ${username} in ${owner}/${repo}`
    );

    // Phase 1: Run sub-agents in parallel to gather data
    const [issueAnalysis, activityData, qualityAssessment] = await Promise.all([
      this.runIssueAnalyzer(owner, repo, username, options),
      this.runActivityTracker(owner, repo, username, options),
      this.runQualityAssessor(owner, repo, username),
    ]);

    console.log(`[Orchestrator] Sub-agents completed, synthesizing results...`);

    // Phase 2: Orchestrator synthesizes results
    const result = await this.synthesizeResults(
      owner,
      repo,
      username,
      issueAnalysis,
      activityData,
      qualityAssessment,
      startTime
    );

    console.log(
      `[Orchestrator] Analysis complete in ${Date.now() - startTime}ms`
    );

    return result;
  }

  /**
   * Stream contributor insights (SSE)
   */
  async *streamInsights(
    request: ContributorInsightsRequest
  ): AsyncGenerator<StreamEvent> {
    const startTime = Date.now();
    const { owner, repo, username, options } = request;

    // Emit start event
    yield {
      type: "start",
      data: { owner, repo, username },
    };

    // Phase 1: Run sub-agents with progress updates
    yield {
      type: "phase",
      data: { phase: "issue-analysis", status: "started" },
    };

    let issueAnalysis: string;
    try {
      issueAnalysis = await this.runIssueAnalyzer(owner, repo, username, options);
      yield {
        type: "phase",
        data: { phase: "issue-analysis", status: "completed" },
      };
    } catch (error) {
      yield {
        type: "phase",
        data: {
          phase: "issue-analysis",
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
      throw error;
    }

    yield {
      type: "phase",
      data: { phase: "activity-tracking", status: "started" },
    };

    let activityData: string;
    try {
      activityData = await this.runActivityTracker(owner, repo, username, options);
      yield {
        type: "phase",
        data: { phase: "activity-tracking", status: "completed" },
      };
    } catch (error) {
      yield {
        type: "phase",
        data: {
          phase: "activity-tracking",
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
      throw error;
    }

    yield {
      type: "phase",
      data: { phase: "quality-assessment", status: "started" },
    };

    let qualityAssessment: string;
    try {
      qualityAssessment = await this.runQualityAssessor(owner, repo, username);
      yield {
        type: "phase",
        data: { phase: "quality-assessment", status: "completed" },
      };
    } catch (error) {
      yield {
        type: "phase",
        data: {
          phase: "quality-assessment",
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
      throw error;
    }

    // Phase 2: Synthesis with streaming
    yield {
      type: "phase",
      data: { phase: "synthesis", status: "started" },
    };

    const orchestrator = createOrchestratorAgent();
    const synthesisPrompt = buildSynthesisPrompt(
      owner,
      repo,
      username,
      issueAnalysis,
      activityData,
      qualityAssessment,
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

    yield {
      type: "complete",
      data: parsed,
    };
  }

  /**
   * Run the issue analyzer sub-agent
   */
  private async runIssueAnalyzer(
    owner: string,
    repo: string,
    username: string,
    options?: ContributorInsightsRequest["options"]
  ): Promise<string> {
    const agent = createIssueAnalyzerAgent();
    const prompt = buildIssueAnalyzerPrompt(owner, repo, username, {
      maxIssues: options?.maxIssues,
      includeClosedIssues: options?.includeClosedIssues,
    });

    const result = await agent.execute(prompt);

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Issue analyzer failed",
        "issue-analyzer"
      );
    }

    return result.result;
  }

  /**
   * Run the activity tracker sub-agent
   */
  private async runActivityTracker(
    owner: string,
    repo: string,
    username: string,
    options?: ContributorInsightsRequest["options"]
  ): Promise<string> {
    const agent = createActivityTrackerAgent();
    const prompt = buildActivityTrackerPrompt(owner, repo, username, {
      lookbackDays: options?.lookbackDays,
    });

    const result = await agent.execute(prompt);

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Activity tracker failed",
        "activity-tracker"
      );
    }

    return result.result;
  }

  /**
   * Run the quality assessor sub-agent
   */
  private async runQualityAssessor(
    owner: string,
    repo: string,
    username: string
  ): Promise<string> {
    const agent = createQualityAssessorAgent();
    const prompt = buildQualityAssessorPrompt(owner, repo, username);

    const result = await agent.execute(prompt);

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Quality assessor failed",
        "quality-assessor"
      );
    }

    return result.result;
  }

  /**
   * Synthesize results from all sub-agents
   */
  private async synthesizeResults(
    owner: string,
    repo: string,
    username: string,
    issueAnalysis: string,
    activityData: string,
    qualityAssessment: string,
    startTime: number
  ): Promise<ContributorInsightsResponse> {
    const orchestrator = createOrchestratorAgent();
    const synthesisPrompt = buildSynthesisPrompt(
      owner,
      repo,
      username,
      issueAnalysis,
      activityData,
      qualityAssessment,
      startTime
    );

    const result = await orchestrator.execute(synthesisPrompt);

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Orchestrator synthesis failed",
        "orchestrator"
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
  ): ContributorInsightsResponse {
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
        "orchestrator",
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
      const validated = contributorInsightsResponseSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AgentError(
          `Invalid JSON in orchestrator response: ${error.message}`,
          "orchestrator",
          { rawResponse: result.substring(0, 500) }
        );
      }
      throw error;
    }
  }
}
