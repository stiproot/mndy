import { describe, it, expect, beforeAll } from "vitest";
import {
  waitForHealth,
  config,
  callMcpTool,
  generateSessionId,
  initializeMcpSession,
  parseSseResponse,
  extractToolResultJson,
  McpToolResult,
} from "./setup.js";

interface IssuesResponse {
  issues: Array<{
    id: number;
    state: string;
    title: string;
    user: { login: string };
  }>;
  total_count: number;
  per_page: number;
}

describe("github-issues-mcp", () => {
  beforeAll(async () => {
    await waitForHealth(`${config.mcpUrl}/health`);
  });

  describe("GET /health", () => {
    it("returns 200 with status ok", async () => {
      const response = await fetch(`${config.mcpUrl}/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(data).toHaveProperty("sessions");
    });
  });

  describe("POST /mcp - tools/call github_list_issues", () => {
    it("returns issues for repository", async () => {
      const { response, data } = await callMcpTool("github_list_issues", {
        owner: config.testOwner,
        repo: config.testRepo,
        state: "all",
        per_page: 5,
      });

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const issuesData = extractToolResultJson<IssuesResponse>(data);
      expect(issuesData).toHaveProperty("issues");
      expect(issuesData).toHaveProperty("total_count");
      expect(Array.isArray(issuesData.issues)).toBe(true);
    });

    it("filters issues by creator", async () => {
      const { response, data } = await callMcpTool("github_list_issues", {
        owner: config.testOwner,
        repo: config.testRepo,
        creator: config.testUsername,
        state: "all",
        per_page: 10,
      });

      expect(response.status).toBe(200);

      const issuesData = extractToolResultJson<IssuesResponse>(data);
      expect(issuesData).toHaveProperty("issues");
      expect(issuesData).toHaveProperty("total_count");

      // All returned issues should be by the specified creator
      for (const issue of issuesData.issues) {
        expect(issue.user.login.toLowerCase()).toBe(config.testUsername.toLowerCase());
      }
    });

    it("filters issues by state (open)", async () => {
      const { response, data } = await callMcpTool("github_list_issues", {
        owner: config.testOwner,
        repo: config.testRepo,
        state: "open",
        per_page: 5,
      });

      expect(response.status).toBe(200);

      const issuesData = extractToolResultJson<IssuesResponse>(data);

      // All returned issues should be open
      for (const issue of issuesData.issues) {
        expect(issue.state).toBe("open");
      }
    });

    it("filters issues by state (closed)", async () => {
      const { response, data } = await callMcpTool("github_list_issues", {
        owner: config.testOwner,
        repo: config.testRepo,
        state: "closed",
        per_page: 5,
      });

      expect(response.status).toBe(200);

      const issuesData = extractToolResultJson<IssuesResponse>(data);

      // All returned issues should be closed
      for (const issue of issuesData.issues) {
        expect(issue.state).toBe("closed");
      }
    });

    it("respects per_page limit", async () => {
      const perPage = 3;
      const { response, data } = await callMcpTool("github_list_issues", {
        owner: config.testOwner,
        repo: config.testRepo,
        state: "all",
        per_page: perPage,
      });

      expect(response.status).toBe(200);

      const issuesData = extractToolResultJson<IssuesResponse>(data);

      expect(issuesData.issues.length).toBeLessThanOrEqual(perPage);
      expect(issuesData.per_page).toBe(perPage);
    });

    it("returns error for non-existent repository", async () => {
      const { response, data } = await callMcpTool("github_list_issues", {
        owner: "this-owner-does-not-exist-12345",
        repo: "this-repo-does-not-exist-12345",
      });

      expect(response.status).toBe(200); // MCP returns 200 with error in result

      const result = (data as { result: McpToolResult }).result;
      expect(result.isError).toBe(true);
    });

    it("returns error for missing required parameters", async () => {
      const sessionId = generateSessionId();

      // Initialize session first
      await initializeMcpSession(sessionId);

      const response = await fetch(`${config.mcpUrl}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "github_list_issues",
            arguments: {
              // Missing required 'owner' and 'repo'
            },
          },
        }),
      });

      expect(response.status).toBe(200); // JSONRPC returns 200

      const text = await response.text();
      const data = parseSseResponse(text) as { result?: McpToolResult; error?: unknown };
      // Should have an error in the result
      expect(data.result?.isError || data.error).toBeTruthy();
    });

    it("maintains session across multiple requests", async () => {
      const sessionId = generateSessionId();

      // First request
      const { response: response1 } = await callMcpTool(
        "github_list_issues",
        { owner: config.testOwner, repo: config.testRepo, per_page: 1 },
        sessionId
      );
      expect(response1.status).toBe(200);

      // Second request with same session
      const { response: response2 } = await callMcpTool(
        "github_list_issues",
        { owner: config.testOwner, repo: config.testRepo, per_page: 1 },
        sessionId
      );
      expect(response2.status).toBe(200);
    });
  });
});
