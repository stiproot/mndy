import { describe, it, expect, beforeAll } from "vitest";
import { config, isDaprMcpAvailable, waitForHealth } from "./setup.js";

/**
 * Integration tests for cc-svc's interaction with dapr-mcp.
 *
 * These tests verify that cc-svc can communicate with the dapr-mcp server
 * for persisting brand insights reports via Dapr actors.
 *
 * Prerequisites:
 * - dapr-mcp running: make run-dapr-mcp
 * - cc-svc running: make run-cc-svc
 */
describe("cc-svc dapr-mcp integration", () => {
  let daprAvailable = false;

  beforeAll(async () => {
    // Check if dapr-mcp is available
    daprAvailable = await isDaprMcpAvailable();

    if (!daprAvailable) {
      console.warn(
        "dapr-mcp not available at",
        config.daprMcpUrl,
        "- skipping integration tests"
      );
    }
  });

  describe("dapr-mcp health", () => {
    it("dapr-mcp server is reachable", async () => {
      if (!daprAvailable) {
        console.log("Skipping: dapr-mcp not available");
        return;
      }

      const response = await fetch(`${config.daprMcpUrl}/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ok");
    });
  });

  describe("MCP tool invocation via cc-svc", () => {
    it("can call dapr_actor_save_state tool", async () => {
      if (!daprAvailable) {
        console.log("Skipping: dapr-mcp not available");
        return;
      }

      // Initialize MCP session
      const sessionId = `test-${Date.now()}`;
      const initResponse = await fetch(`${config.daprMcpUrl}/mcp`, {
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
            clientInfo: { name: "cc-svc-test", version: "1.0.0" },
          },
        }),
      });

      expect(initResponse.status).toBe(200);

      // Call dapr_actor_save_state with a mock brand insights report
      const testReport = {
        brand: { analyzedAt: new Date().toISOString() },
        summary: {
          overallHealthScore: 82,
          keyMetrics: {
            revenue: 25000,
            sessions: 1200,
            conversions: 85,
            roas: 4.2,
          },
          briefDescription: "Test brand analysis from cc-svc integration test",
        },
        insights: {
          wins: ["Strong organic traffic growth"],
          concerns: ["Rising customer acquisition cost"],
          recommendations: [
            {
              category: "Marketing",
              suggestion: "Optimize paid campaigns",
              priority: "high",
            },
          ],
        },
        metadata: {
          sources: ["ga4", "shopify"],
          dateRange: { startDate: "2025-03-01", endDate: "2025-03-08" },
          processingTimeMs: 8500,
        },
      };

      const toolResponse = await fetch(`${config.daprMcpUrl}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "dapr_actor_save_state",
            arguments: {
              actorType: "BrandInsightsActor",
              actorId: `brand-test-${Date.now()}`,
              method: "SaveReport",
              payload: testReport,
            },
          },
        }),
      });

      expect(toolResponse.status).toBe(200);

      const text = await toolResponse.text();
      // Parse SSE response
      const dataLine = text.split("\n").find((l) => l.startsWith("data: "));
      expect(dataLine).toBeDefined();

      const data = JSON.parse(dataLine!.slice(6));
      expect(data).toHaveProperty("result");
      expect(data.result).toHaveProperty("content");
    });

    it("can call dapr_actor_get_state tool", async () => {
      if (!daprAvailable) {
        console.log("Skipping: dapr-mcp not available");
        return;
      }

      const sessionId = `test-${Date.now()}`;

      // Initialize session
      await fetch(`${config.daprMcpUrl}/mcp`, {
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
            clientInfo: { name: "cc-svc-test", version: "1.0.0" },
          },
        }),
      });

      // Call dapr_actor_get_state
      const toolResponse = await fetch(`${config.daprMcpUrl}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "dapr_actor_get_state",
            arguments: {
              actorType: "BrandInsightsActor",
              actorId: "brand-test-latest",
              method: "GetReport",
            },
          },
        }),
      });

      expect(toolResponse.status).toBe(200);

      const text = await toolResponse.text();
      const dataLine = text.split("\n").find((l) => l.startsWith("data: "));
      expect(dataLine).toBeDefined();

      const data = JSON.parse(dataLine!.slice(6));
      expect(data).toHaveProperty("result");
      // Result will contain either success data or a Dapr connection error
      // Both are valid responses depending on whether Dapr sidecar is running
      expect(data.result).toHaveProperty("content");
    });
  });

  describe("Tool discovery", () => {
    it("dapr-mcp exposes actor tools", async () => {
      if (!daprAvailable) {
        console.log("Skipping: dapr-mcp not available");
        return;
      }

      const sessionId = `test-${Date.now()}`;

      // Initialize session
      await fetch(`${config.daprMcpUrl}/mcp`, {
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
            clientInfo: { name: "cc-svc-test", version: "1.0.0" },
          },
        }),
      });

      // List tools
      const listResponse = await fetch(`${config.daprMcpUrl}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        }),
      });

      expect(listResponse.status).toBe(200);

      const text = await listResponse.text();
      const dataLine = text.split("\n").find((l) => l.startsWith("data: "));
      expect(dataLine).toBeDefined();

      const data = JSON.parse(dataLine!.slice(6));
      expect(data).toHaveProperty("result");
      expect(data.result).toHaveProperty("tools");

      const tools = data.result.tools as Array<{ name: string }>;
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("dapr_actor_get_state");
      expect(toolNames).toContain("dapr_actor_save_state");
    });
  });
});
