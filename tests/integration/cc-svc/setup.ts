/**
 * Test setup utilities for cc-svc integration tests
 */

const DEFAULT_TIMEOUT = 30000;
const POLL_INTERVAL = 1000;

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
  // Service URLs
  ccSvcUrl: process.env.CC_SVC_URL || "http://localhost:3002",
  githubIssuesMcpUrl: process.env.GITHUB_ISSUES_MCP_URL || "http://localhost:3001",

  // Analytics MCP URLs
  ga4McpUrl: process.env.GA4_MCP_URL || "",
  shopifyMcpUrl: process.env.SHOPIFY_MCP_URL || "",
  metaMcpUrl: process.env.META_MCP_URL || "",

  // Dapr MCP URL (for actor state persistence)
  daprMcpUrl: process.env.DAPR_MCP_URL || "http://localhost:3006",

  // Test target repository and user
  testOwner: process.env.TEST_OWNER || "Derivco",
  testRepo: process.env.TEST_REPO || "nebula",
  testUsername: process.env.TEST_USERNAME || "si-stip-der",
};

/**
 * Check if analytics MCPs are available for brand-insights tests
 */
export function hasAnalyticsMcps(): boolean {
  return !!(config.ga4McpUrl || config.shopifyMcpUrl);
}

/**
 * Check if dapr-mcp is available
 */
export async function isDaprMcpAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${config.daprMcpUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get a date range for the last 7 days
 */
export function getLast7DaysRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Get the full repository string (owner/repo)
 */
export function getTestRepository(): string {
  return `${config.testOwner}/${config.testRepo}`;
}

/**
 * Parsed SSE event
 */
export interface SSEEvent {
  type: string;
  data: unknown;
}

/**
 * Parse a single SSE event chunk into type and data
 */
function parseSSEEvent(chunk: string): SSEEvent | null {
  const lines = chunk.split("\n");
  let type = "";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      type = line.slice(7);
    } else if (line.startsWith("data: ")) {
      data = line.slice(6);
    }
  }

  if (!type) return null;

  try {
    return { type, data: JSON.parse(data) };
  } catch {
    return { type, data };
  }
}

/**
 * Read and parse an SSE stream until the 'done' event or timeout
 */
export async function consumeSSEStream(
  response: Response,
  timeout = 180000 // 3 minutes to match test timeout
): Promise<SSEEvent[]> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  const events: SSEEvent[] = [];
  const startTime = Date.now();
  let buffer = "";

  while (Date.now() - startTime < timeout) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse complete SSE events from buffer (events are separated by double newlines)
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? ""; // Keep incomplete event in buffer

    for (const chunk of chunks) {
      const event = parseSSEEvent(chunk);
      if (event) {
        events.push(event);
        if (event.type === "done") {
          reader.releaseLock();
          return events;
        }
      }
    }
  }

  reader.releaseLock();
  return events;
}
