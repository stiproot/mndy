/**
 * Permission modes for agent tool access
 */
export type PermissionMode =
  | "default"
  | "acceptEdits"
  | "bypassPermissions"
  | "plan"
  | "dontAsk";

/**
 * Effort level for agent execution
 */
export type EffortLevel = "low" | "medium" | "high" | "max";

/**
 * MCP server connection types
 */
export type McpServerType = "stdio" | "sse" | "http";

/**
 * Base MCP server configuration
 */
export interface McpServerConfigBase {
  type: McpServerType;
}

/**
 * stdio MCP server configuration
 */
export interface StdioMcpServerConfig extends McpServerConfigBase {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * SSE MCP server configuration
 */
export interface SseMcpServerConfig extends McpServerConfigBase {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
}

/**
 * HTTP MCP server configuration
 */
export interface HttpMcpServerConfig extends McpServerConfigBase {
  type: "http";
  url: string;
  headers?: Record<string, string>;
}

/**
 * Union of all MCP server configurations
 */
export type McpServerConfig =
  | StdioMcpServerConfig
  | SseMcpServerConfig
  | HttpMcpServerConfig;

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /** Agent name for identification */
  name: string;
  /** Model to use (default: claude-sonnet-4-5-20250929) */
  model?: string;
  /** MCP servers to connect */
  mcpServers?: Record<string, McpServerConfig>;
  /** List of allowed tool names */
  allowedTools?: string[];
  /** List of disallowed tool names */
  disallowedTools?: string[];
  /** Permission mode for tool execution */
  permissionMode?: PermissionMode;
  /** Effort level for task completion */
  effort?: EffortLevel;
  /** Maximum number of turns (API calls) */
  maxTurns?: number;
  /** Maximum budget in USD */
  maxBudgetUsd?: number;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** System prompt override */
  systemPrompt?: string;
  /** Whether to persist session (default: true) */
  persistSession?: boolean;
}

/**
 * Result from agent task execution
 */
export interface AgentResult {
  /** Whether the task completed successfully */
  success: boolean;
  /** Result text from the agent */
  result: string;
  /** Session ID for resumption */
  sessionId?: string;
  /** Total cost in USD */
  totalCostUsd?: number;
  /** Number of turns used */
  turnsUsed?: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActivityAt: Date;
  name?: string;
}

/**
 * Permission decision result
 */
export interface PermissionResult {
  behavior: "allow" | "deny" | "ask";
  message?: string;
}

/**
 * Permission handler function type
 */
export type PermissionHandler = (
  toolName: string,
  input: Record<string, unknown>
) => Promise<PermissionResult>;

/**
 * Hook callback input for PreToolUse
 */
export interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

/**
 * Hook callback result
 */
export interface HookResult {
  hookSpecificOutput?: {
    hookEventName: string;
    permissionDecision?: "allow" | "deny";
    permissionDecisionReason?: string;
  };
}

/**
 * Hook callback function type
 */
export type HookCallback = (
  input: PreToolUseInput,
  toolUseId: string,
  options: { signal: AbortSignal }
) => Promise<HookResult>;

/**
 * Tool result content
 */
export interface ToolResultContent {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
}

/**
 * Tool call result
 */
export interface CallToolResult {
  content: ToolResultContent[];
  isError?: boolean;
}
