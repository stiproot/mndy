import type {
  McpServerConfig,
  StdioMcpServerConfig,
  SseMcpServerConfig,
  HttpMcpServerConfig,
} from "./types.js";

/**
 * Create a stdio MCP server configuration
 */
export function createStdioMcpServer(
  command: string,
  args?: string[],
  env?: Record<string, string>
): StdioMcpServerConfig {
  return {
    type: "stdio",
    command,
    args,
    env,
  };
}

/**
 * Create an SSE MCP server configuration
 */
export function createSseMcpServer(
  url: string,
  headers?: Record<string, string>
): SseMcpServerConfig {
  return {
    type: "sse",
    url,
    headers,
  };
}

/**
 * Create an HTTP MCP server configuration
 */
export function createHttpMcpServer(
  url: string,
  headers?: Record<string, string>
): HttpMcpServerConfig {
  return {
    type: "http",
    url,
    headers,
  };
}

/**
 * Create an MCP server configuration from options
 */
export function connectMcpServer(config: McpServerConfig): McpServerConfig {
  return config;
}

/**
 * Build MCP servers map for agent configuration
 */
export function buildMcpServersMap(
  servers: Record<string, McpServerConfig>
): Record<string, McpServerConfig> {
  return servers;
}

/**
 * Get the tool name format for an MCP server tool
 * Format: mcp__{serverName}__{toolName}
 */
export function getMcpToolName(serverName: string, toolName: string): string {
  return `mcp__${serverName}__${toolName}`;
}

/**
 * Parse an MCP tool name into server and tool parts
 */
export function parseMcpToolName(
  mcpToolName: string
): { serverName: string; toolName: string } | null {
  const match = mcpToolName.match(/^mcp__([^_]+)__(.+)$/);
  if (!match) return null;
  return {
    serverName: match[1],
    toolName: match[2],
  };
}
