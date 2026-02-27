import { z, type ZodRawShape } from "zod";
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { CallToolResult } from "./types.js";

/**
 * Tool definition type - using any to avoid complex generic inference issues
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolDefinition = ReturnType<typeof tool<any>>;

/**
 * Define a custom tool with Zod schema validation
 */
export function defineTool<T extends ZodRawShape>(
  name: string,
  description: string,
  schema: T,
  handler: (args: z.infer<z.ZodObject<T>>) => Promise<CallToolResult>
): ToolDefinition {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return tool(name, description, schema, handler as any);
}

/**
 * Create an in-process MCP server with custom tools
 */
export function createToolServer(
  name: string,
  tools: ToolDefinition[],
  version = "1.0.0"
): ReturnType<typeof createSdkMcpServer> {
  return createSdkMcpServer({
    name,
    version,
    tools,
  });
}

/**
 * Create a simple text response for a tool
 */
export function textResult(text: string, isError = false): CallToolResult {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

/**
 * Create a JSON response for a tool
 */
export function jsonResult(
  data: unknown,
  isError = false
): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

/**
 * Create an error response for a tool
 */
export function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

// Re-export zod for convenience
export { z };
