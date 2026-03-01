/**
 * Test setup utilities for github-issues-mcp integration tests
 */

const DEFAULT_TIMEOUT = 30000;
const POLL_INTERVAL = 1000;

/**
 * Parse Server-Sent Events response text to extract JSON data
 * SSE format: "event: message\ndata: {...json...}\n\n"
 */
export function parseSseResponse(text: string): unknown {
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.slice(6); // Remove "data: " prefix
      return JSON.parse(jsonStr);
    }
  }
  // If no SSE data found, try parsing as plain JSON
  return JSON.parse(text);
}

/**
 * MCP tool result structure
 */
export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Extract the text content from an MCP tool result and parse as JSON
 * Throws descriptive errors for authentication issues
 */
export function extractToolResultJson<T = unknown>(data: unknown): T {
  const response = data as { result: McpToolResult };
  const result = response.result;

  if (result.isError) {
    const errorText = result.content[0]?.text || "Unknown error";
    if (errorText.includes("401") || errorText.includes("Unauthorized") || errorText.includes("Bad credentials")) {
      throw new Error(
        "GITHUB_TOKEN not set or invalid. Set it when starting the MCP server:\n" +
        "  GITHUB_TOKEN=xxx make run-github-issues-mcp"
      );
    }
    throw new Error(`MCP tool error: ${errorText}`);
  }

  const textContent = result.content.find((c) => c.type === "text");
  if (!textContent) {
    throw new Error("No text content in MCP tool result");
  }

  return JSON.parse(textContent.text) as T;
}

/**
 * Wait for a service health endpoint to return 200
 */
export async function waitForHealth(
  url: string,
  timeout = DEFAULT_TIMEOUT
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Service not ready yet
    }
    await sleep(POLL_INTERVAL);
  }

  throw new Error(`Service at ${url} did not become healthy within ${timeout}ms`);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Environment configuration for tests
 */
export const config = {
  mcpUrl: process.env.GITHUB_ISSUES_MCP_URL || "http://localhost:3001",

  // Test target repository and user
  testOwner: process.env.TEST_OWNER || "Derivco",
  testRepo: process.env.TEST_REPO || "nebula",
  testUsername: process.env.TEST_USERNAME || "si-stip-der",
};

/**
 * Generate a unique session ID for MCP requests
 */
export function generateSessionId(): string {
  return `test-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Initialize an MCP session (required before tool calls)
 */
export async function initializeMcpSession(
  sessionId: string
): Promise<{ response: Response; data: unknown }> {
  const response = await fetch(`${config.mcpUrl}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sessionId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      },
    }),
  });

  const text = await response.text();
  const data = parseSseResponse(text);
  return { response, data };
}

/**
 * Make an MCP tool call (initializes session if needed)
 */
export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string
): Promise<{ response: Response; data: unknown }> {
  const sid = sessionId || generateSessionId();

  // Initialize session first
  await initializeMcpSession(sid);

  // Now call the tool
  const response = await fetch(`${config.mcpUrl}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sid,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  const text = await response.text();
  const data = parseSseResponse(text);
  return { response, data };
}
