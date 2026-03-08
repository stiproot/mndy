export type {
  ContributorInsightsRequest,
  ContributorInsightsResponse,
  IssueAnalyzerOutput,
  ActivityTrackerOutput,
  QualityAssessorOutput,
  ChatRequest,
  ChatResponse,
  ChatContextMessage,
  ChatMessageRole,
  BrandInsightsRequest,
  BrandInsightsResponse,
  GA4AnalystOutput,
  ShopifyAnalystOutput,
  MetaAnalystOutput,
} from "../schemas/index.js";

/**
 * SSE stream event types
 */
export interface StreamEvent {
  type: "start" | "phase" | "text" | "tool" | "error" | "complete";
  data: unknown;
}

export interface StartEvent extends StreamEvent {
  type: "start";
  data: {
    owner: string;
    repo: string;
    username: string;
  };
}

export interface PhaseEvent extends StreamEvent {
  type: "phase";
  data: {
    phase: string;
    status: "started" | "completed" | "failed";
    message?: string;
  };
}

export interface TextEvent extends StreamEvent {
  type: "text";
  data: {
    content: string;
  };
}

export interface ToolEvent extends StreamEvent {
  type: "tool";
  data: {
    tool: string;
    input?: Record<string, unknown>;
  };
}

export interface ErrorEvent extends StreamEvent {
  type: "error";
  data: {
    message: string;
    code?: string;
  };
}

export interface CompleteEvent extends StreamEvent {
  type: "complete";
  data: import("../schemas/index.js").ContributorInsightsResponse;
}

/**
 * Custom error types
 */
export class CcSvcError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "CcSvcError";
  }
}

export class ValidationError extends CcSvcError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class AgentError extends CcSvcError {
  constructor(message: string, agentName: string, details?: unknown) {
    super(message, "AGENT_ERROR", 500, { agentName, ...((details as object) ?? {}) });
    this.name = "AgentError";
  }
}

export class McpConnectionError extends CcSvcError {
  constructor(message: string, serverUrl: string) {
    super(message, "MCP_CONNECTION_ERROR", 503, { serverUrl });
    this.name = "McpConnectionError";
  }
}
