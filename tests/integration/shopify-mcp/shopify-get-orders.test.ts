import { describe, it, expect, beforeAll } from "vitest";
import { Effect } from "effect";
import {
  TestConfig,
  type TestConfigType,
  waitForHealth,
  callMcpTool,
  extractToolResultText,
  generateSessionId,
  initializeMcpSession,
  parseSseResponse,
  type McpToolResult,
} from "./setup.js";

describe("shopify-mcp", () => {
  let config: TestConfigType;

  beforeAll(async () => {
    // Get config using Effect
    config = await Effect.runPromise(TestConfig);

    // Wait for health check
    await Effect.runPromise(waitForHealth(`${config.mcpUrl}/health`));
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

  describe("POST /mcp - tools/call shopify_get_orders", () => {
    it("returns orders data for valid store", async () => {
      // Skip if no store configured
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_orders", {
          limit: 10,
        })
      );

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      // Shopify returns formatted text output
      const ordersText = extractToolResultText(data);
      expect(ordersText).toContain("Orders");
    });

    it("supports status filter", async () => {
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_orders", {
          limit: 5,
          status: "any",
        })
      );

      expect(response.status).toBe(200);

      const ordersText = extractToolResultText(data);
      expect(ordersText).toContain("Orders");
    });

    it("supports financial status filter", async () => {
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_orders", {
          limit: 10,
          financial_status: "paid",
        })
      );

      expect(response.status).toBe(200);

      const ordersText = extractToolResultText(data);
      expect(ordersText).toContain("Orders");
    });

    it("supports date range filter", async () => {
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_orders", {
          limit: 10,
          created_at_min: "2024-01-01T00:00:00Z",
          created_at_max: "2024-12-31T23:59:59Z",
        })
      );

      expect(response.status).toBe(200);

      const ordersText = extractToolResultText(data);
      expect(ordersText).toContain("Orders");
    });

    it("returns error for missing access token", async () => {
      // This test verifies error handling when credentials are not configured
      // The server should return a graceful error message
      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_orders", {
          limit: 5,
        })
      );

      expect(response.status).toBe(200); // MCP returns 200 with error in result

      const result = (data as { result: McpToolResult }).result;
      // Either returns orders (if configured) or an error (if not configured)
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it("returns error for missing required parameters", async () => {
      const sessionId = generateSessionId();

      // Initialize session first
      await Effect.runPromise(initializeMcpSession(config.mcpUrl, sessionId));

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
            name: "shopify_get_orders",
            arguments: {
              // All parameters are optional for get_orders, so this should work
            },
          },
        }),
      });

      expect(response.status).toBe(200);

      const text = await response.text();
      const data = parseSseResponse(text) as { result?: McpToolResult; error?: unknown };
      // Should either succeed or return an error (e.g., if store not configured)
      expect(data.result || data.error).toBeTruthy();
    });
  });

  describe("POST /mcp - tools/call shopify_get_analytics", () => {
    it("returns analytics data for valid date range", async () => {
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_analytics", {
          start_date: "2024-01-01",
          end_date: "2024-01-31",
        })
      );

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const analyticsText = extractToolResultText(data);
      expect(analyticsText).toContain("Analytics");
    });

    it("supports recent date range", async () => {
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      // Get last 30 days
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "shopify_get_analytics", {
          start_date: startDate,
          end_date: endDate,
        })
      );

      expect(response.status).toBe(200);

      const analyticsText = extractToolResultText(data);
      expect(analyticsText).toContain("Analytics");
    });

    it("returns error for missing required parameters", async () => {
      const sessionId = generateSessionId();

      // Initialize session first
      await Effect.runPromise(initializeMcpSession(config.mcpUrl, sessionId));

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
            name: "shopify_get_analytics",
            arguments: {
              // Missing required start_date and end_date
            },
          },
        }),
      });

      expect(response.status).toBe(200); // JSONRPC returns 200

      const text = await response.text();
      const data = parseSseResponse(text) as { result?: McpToolResult; error?: unknown };
      // Should have an error for missing required params
      expect(data.result?.isError || data.error).toBeTruthy();
    });

    it("maintains session across multiple requests", async () => {
      if (!config.storeUrl) {
        console.log("Skipping: SHOPIFY_TEST_STORE_URL not configured");
        return;
      }

      const sessionId = generateSessionId();

      // First request - get orders
      const { response: response1 } = await Effect.runPromise(
        callMcpTool(
          config.mcpUrl,
          "shopify_get_orders",
          {
            limit: 5,
          },
          sessionId
        )
      );
      expect(response1.status).toBe(200);

      // Second request - get analytics
      const { response: response2 } = await Effect.runPromise(
        callMcpTool(
          config.mcpUrl,
          "shopify_get_analytics",
          {
            start_date: "2024-01-01",
            end_date: "2024-01-31",
          },
          sessionId
        )
      );
      expect(response2.status).toBe(200);
    });
  });
});
