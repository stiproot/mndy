import { describe, it, expect, beforeAll } from "vitest";
import { Effect } from "effect";
import {
  TestConfig,
  type TestConfigType,
  waitForHealth,
  callMcpTool,
  extractToolResultJson,
  generateSessionId,
  initializeMcpSession,
  parseSseResponse,
  type McpToolResult,
} from "./setup.js";

interface ReportResult {
  summary?: string;
  propertyId?: string;
  dimensions?: string[];
  metrics?: string[];
  rows?: Array<Record<string, string>>;
  rowCount?: number;
  metadata?: {
    currencyCode?: string;
    timeZone?: string;
  };
}

describe("ga4-mcp", () => {
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

  describe("POST /mcp - tools/call ga4_run_report", () => {
    it("returns report data for valid property and date range", async () => {
      // Skip if no property ID configured
      if (!config.propertyId) {
        console.log("Skipping: GA4_TEST_PROPERTY_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "ga4_run_report", {
          propertyId: config.propertyId,
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "sessions" }],
          dimensions: [{ name: "date" }],
        })
      );

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const reportData = extractToolResultJson<ReportResult>(data);
      expect(reportData).toHaveProperty("rows");
      expect(reportData).toHaveProperty("rowCount");
      expect(reportData.metrics).toBeDefined();
      expect(reportData.metrics?.includes("sessions")).toBe(true);
    });

    it("supports multiple metrics", async () => {
      if (!config.propertyId) {
        console.log("Skipping: GA4_TEST_PROPERTY_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "ga4_run_report", {
          propertyId: config.propertyId,
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }],
        })
      );

      expect(response.status).toBe(200);

      const reportData = extractToolResultJson<ReportResult>(data);
      expect(reportData.metrics?.length).toBe(3);
    });

    it("supports dimension filtering", async () => {
      if (!config.propertyId) {
        console.log("Skipping: GA4_TEST_PROPERTY_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "ga4_run_report", {
          propertyId: config.propertyId,
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [{ name: "sessions" }],
          dimensions: [{ name: "country" }],
          limit: 10,
        })
      );

      expect(response.status).toBe(200);

      const reportData = extractToolResultJson<ReportResult>(data);
      expect(reportData.rows).toBeDefined();
      expect((reportData.rows?.length || 0) <= 10).toBe(true);
    });

    it("returns error for invalid property ID", async () => {
      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "ga4_run_report", {
          propertyId: "invalid-property-12345",
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "sessions" }],
        })
      );

      expect(response.status).toBe(200); // MCP returns 200 with error in result

      const result = (data as { result: McpToolResult }).result;
      expect(result.isError).toBe(true);
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
            name: "ga4_run_report",
            arguments: {
              // Missing required property_id, start_date, end_date, metrics
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
      if (!config.propertyId) {
        console.log("Skipping: GA4_TEST_PROPERTY_ID not configured");
        return;
      }

      const sessionId = generateSessionId();

      // First request
      const { response: response1 } = await Effect.runPromise(
        callMcpTool(
          config.mcpUrl,
          "ga4_run_report",
          {
            propertyId: config.propertyId,
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            metrics: [{ name: "sessions" }],
          },
          sessionId
        )
      );
      expect(response1.status).toBe(200);

      // Second request with same session
      const { response: response2 } = await Effect.runPromise(
        callMcpTool(
          config.mcpUrl,
          "ga4_run_report",
          {
            propertyId: config.propertyId,
            dateRanges: [{ startDate: "14daysAgo", endDate: "7daysAgo" }],
            metrics: [{ name: "sessions" }],
          },
          sessionId
        )
      );
      expect(response2.status).toBe(200);
    });
  });
});
