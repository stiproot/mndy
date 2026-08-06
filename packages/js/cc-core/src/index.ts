// Core types
export type {
  PermissionMode,
  EffortLevel,
  McpServerType,
  McpServerConfig,
  McpServerConfigBase,
  StdioMcpServerConfig,
  SseMcpServerConfig,
  HttpMcpServerConfig,
  AgentConfig,
  AgentResult,
  SessionInfo,
  PermissionResult,
  PermissionHandler,
  PreToolUseInput,
  HookResult,
  HookCallback,
  ToolResultContent,
  CallToolResult,
} from "./types.js";

// Agent factory and execution
export {
  createAgent,
  executeTask,
  streamTask,
  agentBuilder,
  AgentBuilder,
  DEFAULT_MODEL,
  type Agent,
  type AgentMessage,
  type ExecuteOptions,
} from "./agent.js";

// MCP server integration
export {
  createStdioMcpServer,
  createSseMcpServer,
  createHttpMcpServer,
  connectMcpServer,
  buildMcpServersMap,
  getMcpToolName,
  parseMcpToolName,
} from "./mcp.js";

// Custom tool helpers
export {
  defineTool,
  createToolServer,
  textResult,
  jsonResult,
  errorResult,
  z,
  type ToolDefinition,
} from "./tools.js";

// Permission control
export {
  TOOL_CATEGORIES,
  createReadOnlyPermissions,
  createFullAccessPermissions,
  createCustomPermissions,
  createMcpOnlyPermissions,
  combinePermissions,
  type CustomPermissionConfig,
} from "./permissions.js";

// Lifecycle hooks
export {
  createAuditHook,
  createConsoleAuditHook,
  createBlockingHook,
  createSafetyHook,
  createApprovalHook,
  combineHooks,
  type AuditLogEntry,
  type AuditLogger,
  type BlockedPattern,
  type ApprovalCallback,
} from "./hooks.js";

// Session management
export {
  SessionManager,
  InMemorySessionStorage,
  createSessionManager,
  generateSessionId,
  type SessionStorage,
} from "./session.js";
