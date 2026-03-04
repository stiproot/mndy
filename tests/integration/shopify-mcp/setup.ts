/**
 * Test setup utilities for shopify-mcp integration tests
 * Uses Effect-TS patterns for configuration and API calls
 */
import { Config, Duration, Effect } from "effect";

const DEFAULT_TIMEOUT = 30000;
const POLL_INTERVAL = Duration.seconds(1);

/**
 * Test configuration from environment
 */
export const TestConfig = Effect.gen(function* () {
  const mcpUrl = yield* Config.string("SHOPIFY_MCP_URL").pipe(
    Config.withDefault("http://localhost:3005")
  );
  const storeUrl = yield* Config.string("SHOPIFY_TEST_STORE_URL").pipe(
    Config.withDefault("")
  );

  return { mcpUrl, storeUrl };
});

export type TestConfigType = Effect.Effect.Success<typeof TestConfig>;

/**
 * Parse Server-Sent Events response text to extract JSON data
 * SSE format: "event: message\ndata: {...json...}\n\n"
 */
export function parseSseResponse(text: string): unknown {
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.slice(6);
      return JSON.parse(jsonStr);
    }
  }
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
 */
export function extractToolResultJson<T = unknown>(data: unknown): T {
  const response = data as { result: McpToolResult };
  const result = response.result;

  if (result.isError) {
    const errorText = result.content[0]?.text || "Unknown error";
    throw new Error(`MCP tool error: ${errorText}`);
  }

  const textContent = result.content.find((c) => c.type === "text");
  if (!textContent) {
    throw new Error("No text content in MCP tool result");
  }

  return JSON.parse(textContent.text) as T;
}

/**
 * Extract the raw text content from an MCP tool result (for formatted output)
 */
export function extractToolResultText(data: unknown): string {
  const response = data as { result: McpToolResult };
  const result = response.result;

  if (result.isError) {
    const errorText = result.content[0]?.text || "Unknown error";
    throw new Error(`MCP tool error: ${errorText}`);
  }

  const textContent = result.content.find((c) => c.type === "text");
  if (!textContent) {
    throw new Error("No text content in MCP tool result");
  }

  return textContent.text;
}

/**
 * Wait for a service health endpoint to return 200
 */
export const waitForHealth = (url: string, timeout = DEFAULT_TIMEOUT) =>
  Effect.gen(function* () {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const result = yield* Effect.tryPromise({
        try: () => fetch(url),
        catch: () => new Error("Health check fetch failed"),
      }).pipe(Effect.option);

      if (result._tag === "Some" && result.value.ok) {
        return;
      }

      yield* Effect.sleep(POLL_INTERVAL);
    }

    yield* Effect.fail(new Error(`Service at ${url} did not become healthy within ${timeout}ms`));
  });

/**
 * Generate a unique session ID for MCP requests
 */
export function generateSessionId(): string {
  return `test-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Initialize an MCP session (required before tool calls)
 */
export const initializeMcpSession = (mcpUrl: string, sessionId: string) =>
  Effect.tryPromise({
    try: () =>
      fetch(`${mcpUrl}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
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
      }),
    catch: (error) => new Error(`MCP session initialization failed: ${error}`),
  }).pipe(
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => response.text(),
        catch: (error) => new Error(`Failed to read response: ${error}`),
      }).pipe(
        Effect.map((text) => ({
          response,
          data: parseSseResponse(text),
        }))
      )
    )
  );

/**
 * Make an MCP tool call (initializes session if needed)
 */
export const callMcpTool = (
  mcpUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string
) =>
  Effect.gen(function* () {
    const sid = sessionId || generateSessionId();

    // Initialize session first
    yield* initializeMcpSession(mcpUrl, sid);

    // Now call the tool
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${mcpUrl}/mcp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
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
        }),
      catch: (error) => new Error(`MCP tool call failed: ${error}`),
    });

    const text = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (error) => new Error(`Failed to read tool response: ${error}`),
    });

    const data = parseSseResponse(text);
    return { response, data, sessionId: sid };
  });
