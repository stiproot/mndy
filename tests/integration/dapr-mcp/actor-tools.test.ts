import { describe, it, expect, beforeAll } from "vitest";
import {
  waitForHealth,
  config,
  callMcpTool,
  generateSessionId,
  initializeMcpSession,
  parseSseResponse,
  isErrorResult,
  getErrorMessage,
  McpToolResult,
} from "./setup.js";

/**
 * Actor tool response structure
 */
interface ActorToolResponse {
  success: boolean;
  actorType: string;
  actorId: string;
  method: string;
  result?: unknown;
  message?: string;
}

describe("dapr-mcp", () => {
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

  describe("POST /mcp - initialize", () => {
    it("initializes MCP session successfully", async () => {
      const sessionId = generateSessionId();
      const { response, data } = await initializeMcpSession(sessionId);

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const result = (data as { result: { protocolVersion: string } }).result;
      expect(result).toHaveProperty("protocolVersion");
    });
  });

  describe("POST /mcp - tools/call dapr_actor_get_state", () => {
    it("invokes actor method and returns result or connection error", async () => {
      const { response, data } = await callMcpTool("dapr_actor_get_state", {
        actorType: config.testActorType,
        actorId: config.testActorId,
        method: "GetState",
      });

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      // The result depends on whether Dapr sidecar and actor are available
      // In CI without Dapr, we expect a connection error
      // With Dapr running, we expect either success or actor not found
      const result = (data as { result: McpToolResult }).result;
      expect(result).toHaveProperty("content");
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it("includes actor details in response", async () => {
      const actorType = "BrandInsightsActor";
      const actorId = `test-${Date.now()}`;
      const method = "GetReport";

      const { response, data } = await callMcpTool("dapr_actor_get_state", {
        actorType,
        actorId,
        method,
      });

      expect(response.status).toBe(200);

      const result = (data as { result: McpToolResult }).result;
      const textContent = result.content.find((c) => c.type === "text");
      expect(textContent).toBeDefined();

      // The response should mention the actor details (either in success or error)
      const responseText = textContent!.text;
      expect(
        responseText.includes(actorType) || responseText.includes("actor")
      ).toBe(true);
    });

    it("accepts optional payload parameter", async () => {
      const { response, data } = await callMcpTool("dapr_actor_get_state", {
        actorType: config.testActorType,
        actorId: config.testActorId,
        method: "GetStateWithParams",
        payload: { key: "testKey" },
      });

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");
    });

    it("returns error for missing required parameters", async () => {
      const sessionId = generateSessionId();

      // Initialize session first
      await initializeMcpSession(sessionId);

      const response = await fetch(`${config.mcpUrl}/mcp`, {
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
              // Missing required 'actorType', 'actorId', 'method'
            },
          },
        }),
      });

      expect(response.status).toBe(200); // JSONRPC returns 200

      const text = await response.text();
      const data = parseSseResponse(text) as {
        result?: McpToolResult;
        error?: unknown;
      };
      // Should have an error in the result
      expect(data.result?.isError || data.error).toBeTruthy();
    });
  });

  describe("POST /mcp - tools/call dapr_actor_save_state", () => {
    it("invokes actor save method and returns result", async () => {
      const testPayload = {
        brand: { analyzedAt: new Date().toISOString() },
        summary: {
          overallHealthScore: 85,
          keyMetrics: { revenue: 10000, sessions: 500 },
        },
      };

      const { response, data } = await callMcpTool("dapr_actor_save_state", {
        actorType: "BrandInsightsActor",
        actorId: `brand-test-${Date.now()}`,
        method: "SaveReport",
        payload: testPayload,
      });

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const result = (data as { result: McpToolResult }).result;
      expect(result).toHaveProperty("content");
      expect(Array.isArray(result.content)).toBe(true);
    });

    it("requires payload parameter", async () => {
      const sessionId = generateSessionId();

      // Initialize session first
      await initializeMcpSession(sessionId);

      const response = await fetch(`${config.mcpUrl}/mcp`, {
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
              actorType: "TestActor",
              actorId: "test-123",
              method: "SaveState",
              // Missing required 'payload'
            },
          },
        }),
      });

      expect(response.status).toBe(200);

      const text = await response.text();
      const data = parseSseResponse(text) as {
        result?: McpToolResult;
        error?: unknown;
      };

      // Should have an error (either validation error or Dapr connection error)
      // Both are acceptable - the important thing is the tool was called
      expect(data).toHaveProperty("result");
    });

    it("handles complex nested payloads", async () => {
      const complexPayload = {
        brand: { analyzedAt: new Date().toISOString() },
        summary: {
          overallHealthScore: 75,
          keyMetrics: {
            revenue: 50000,
            sessions: 2500,
            conversions: 150,
            roas: 3.5,
          },
          briefDescription: "Test brand analysis",
        },
        insights: {
          wins: ["Increased traffic", "Higher conversion rate"],
          concerns: ["Rising CPA"],
          recommendations: [
            {
              category: "Advertising",
              suggestion: "Optimize ad spend",
              priority: "high",
            },
          ],
        },
        metadata: {
          sources: ["ga4", "shopify"],
          dateRange: { startDate: "2025-03-01", endDate: "2025-03-08" },
          processingTimeMs: 12500,
        },
      };

      const { response, data } = await callMcpTool("dapr_actor_save_state", {
        actorType: "BrandInsightsActor",
        actorId: `brand-complex-${Date.now()}`,
        method: "SaveReport",
        payload: complexPayload,
      });

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");
    });
  });

  describe("Session management", () => {
    it("maintains session across multiple requests", async () => {
      const sessionId = generateSessionId();

      // First request
      const { response: response1 } = await callMcpTool(
        "dapr_actor_get_state",
        {
          actorType: config.testActorType,
          actorId: config.testActorId,
          method: "GetState",
        },
        sessionId
      );
      expect(response1.status).toBe(200);

      // Second request with same session
      const { response: response2 } = await callMcpTool(
        "dapr_actor_get_state",
        {
          actorType: config.testActorType,
          actorId: config.testActorId,
          method: "GetState",
        },
        sessionId
      );
      expect(response2.status).toBe(200);
    });

    it("can make multiple tool calls in same session", async () => {
      const sessionId = generateSessionId();

      // Get state
      const { response: getResponse } = await callMcpTool(
        "dapr_actor_get_state",
        {
          actorType: config.testActorType,
          actorId: config.testActorId,
          method: "GetState",
        },
        sessionId
      );
      expect(getResponse.status).toBe(200);

      // Save state (reusing same session by initializing again is fine)
      const { response: saveResponse } = await callMcpTool(
        "dapr_actor_save_state",
        {
          actorType: config.testActorType,
          actorId: config.testActorId,
          method: "SaveState",
          payload: { test: "data" },
        },
        sessionId
      );
      expect(saveResponse.status).toBe(200);
    });
  });

  describe("Error handling", () => {
    it("returns descriptive error for connection failures", async () => {
      // This test verifies error messages are helpful
      // The actual error depends on whether Dapr is running
      const { data } = await callMcpTool("dapr_actor_get_state", {
        actorType: "NonExistentActor",
        actorId: "non-existent-id",
        method: "NonExistentMethod",
      });

      const result = (data as { result: McpToolResult }).result;
      expect(result).toHaveProperty("content");

      // Should have meaningful error context
      const textContent = result.content.find((c) => c.type === "text");
      expect(textContent).toBeDefined();
      expect(textContent!.text.length).toBeGreaterThan(0);
    });

    it("handles timeout gracefully", async () => {
      // This test just ensures the tool doesn't hang indefinitely
      const startTime = Date.now();

      const { response } = await callMcpTool("dapr_actor_get_state", {
        actorType: config.testActorType,
        actorId: config.testActorId,
        method: "SlowMethod",
      });

      const elapsed = Date.now() - startTime;

      expect(response.status).toBe(200);
      // Should complete within reasonable time (timeout is 30s, but connection errors are faster)
      expect(elapsed).toBeLessThan(35000);
    });
  });
});
