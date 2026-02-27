import type { PermissionResult, PermissionHandler } from "./types.js";

/**
 * Tool categories for permission grouping
 */
export const TOOL_CATEGORIES = {
  read: [
    "Read",
    "Glob",
    "Grep",
    "WebSearch",
    "WebFetch",
    "BashOutput",
  ],
  write: [
    "Write",
    "Edit",
    "NotebookEdit",
  ],
  execute: [
    "Bash",
    "Task",
  ],
  dangerous: [
    "KillShell",
  ],
} as const;

/**
 * Create a permission handler that allows only read operations
 */
export function createReadOnlyPermissions(): PermissionHandler {
  return async (toolName: string): Promise<PermissionResult> => {
    if (TOOL_CATEGORIES.read.includes(toolName as typeof TOOL_CATEGORIES.read[number])) {
      return { behavior: "allow" };
    }
    return {
      behavior: "deny",
      message: `Tool ${toolName} is not allowed in read-only mode`,
    };
  };
}

/**
 * Create a permission handler that allows all operations
 */
export function createFullAccessPermissions(): PermissionHandler {
  return async (): Promise<PermissionResult> => {
    return { behavior: "allow" };
  };
}

/**
 * Permission configuration for custom rules
 */
export interface CustomPermissionConfig {
  /** Tools to always allow */
  allow?: string[];
  /** Tools to always deny */
  deny?: string[];
  /** Tools that require confirmation (returns "ask") */
  requireConfirmation?: string[];
  /** Default behavior for tools not in any list */
  defaultBehavior?: "allow" | "deny" | "ask";
}

/**
 * Create a permission handler with custom rules
 */
export function createCustomPermissions(
  config: CustomPermissionConfig
): PermissionHandler {
  const allowSet = new Set(config.allow ?? []);
  const denySet = new Set(config.deny ?? []);
  const confirmSet = new Set(config.requireConfirmation ?? []);
  const defaultBehavior = config.defaultBehavior ?? "ask";

  return async (toolName: string): Promise<PermissionResult> => {
    // Check explicit deny first
    if (denySet.has(toolName)) {
      return {
        behavior: "deny",
        message: `Tool ${toolName} is explicitly denied`,
      };
    }

    // Check if confirmation required
    if (confirmSet.has(toolName)) {
      return {
        behavior: "ask",
        message: `Tool ${toolName} requires confirmation`,
      };
    }

    // Check explicit allow
    if (allowSet.has(toolName)) {
      return { behavior: "allow" };
    }

    // Return default behavior
    return {
      behavior: defaultBehavior,
      message:
        defaultBehavior === "deny"
          ? `Tool ${toolName} is not in the allowed list`
          : undefined,
    };
  };
}

/**
 * Create a permission handler that allows only specific MCP server tools
 */
export function createMcpOnlyPermissions(
  allowedServers: string[]
): PermissionHandler {
  return async (toolName: string): Promise<PermissionResult> => {
    // Check if it's an MCP tool
    const mcpMatch = toolName.match(/^mcp__([^_]+)__/);
    if (mcpMatch) {
      const serverName = mcpMatch[1];
      if (allowedServers.includes(serverName)) {
        return { behavior: "allow" };
      }
      return {
        behavior: "deny",
        message: `MCP server ${serverName} is not in the allowed list`,
      };
    }

    // Deny non-MCP tools
    return {
      behavior: "deny",
      message: "Only MCP tools are allowed",
    };
  };
}

/**
 * Combine multiple permission handlers (all must allow)
 */
export function combinePermissions(
  ...handlers: PermissionHandler[]
): PermissionHandler {
  return async (
    toolName: string,
    input: Record<string, unknown>
  ): Promise<PermissionResult> => {
    for (const handler of handlers) {
      const result = await handler(toolName, input);
      if (result.behavior === "deny") {
        return result;
      }
      if (result.behavior === "ask") {
        return result;
      }
    }
    return { behavior: "allow" };
  };
}
