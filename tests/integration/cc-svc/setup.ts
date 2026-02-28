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

  // Test target repository and user
  testOwner: process.env.TEST_OWNER || "Derivco",
  testRepo: process.env.TEST_REPO || "nebula",
  testUsername: process.env.TEST_USERNAME || "si-stip-der",
};

/**
 * Get the full repository string (owner/repo)
 */
export function getTestRepository(): string {
  return `${config.testOwner}/${config.testRepo}`;
}
