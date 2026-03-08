import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  waitForHealth,
  config,
  consumeSSEStream,
  sleep,
  hasAnalyticsMcps,
  getLast7DaysRange,
} from "./setup.js";

describe("POST /cc-svc/brand-insights", () => {
  beforeAll(async () => {
    // Wait for cc-svc health endpoint
    await waitForHealth(`${config.ccSvcUrl}/cc-svc/health`);

    // Check if analytics MCPs are configured
    if (!hasAnalyticsMcps()) {
      console.log(
        "Skipping brand-insights tests: No analytics MCPs configured (GA4_MCP_URL or SHOPIFY_MCP_URL)"
      );
    }
  });

  it("returns 200 for health check", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/health`);
    expect(response.status).toBe(200);
  });

  it("returns 400 for missing required fields", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange: {
          startDate: "01-01-2024", // Invalid format
          endDate: "01-31-2024",
        },
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns brand insights for valid date range", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateRange }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("brand");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("insights");
    expect(data).toHaveProperty("metadata");

    // Verify brand info
    expect(data.brand).toHaveProperty("analyzedAt");

    // Verify summary structure
    expect(data.summary).toHaveProperty("overallHealthScore");
    expect(data.summary).toHaveProperty("keyMetrics");
    expect(data.summary).toHaveProperty("briefDescription");
    expect(data.summary.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(data.summary.overallHealthScore).toBeLessThanOrEqual(100);

    // Verify insights structure
    expect(data.insights).toHaveProperty("wins");
    expect(data.insights).toHaveProperty("concerns");
    expect(data.insights).toHaveProperty("recommendations");
    expect(Array.isArray(data.insights.wins)).toBe(true);
    expect(Array.isArray(data.insights.concerns)).toBe(true);
    expect(Array.isArray(data.insights.recommendations)).toBe(true);

    // Verify metadata
    expect(data.metadata).toHaveProperty("sources");
    expect(data.metadata).toHaveProperty("dateRange");
    expect(data.metadata).toHaveProperty("processingTimeMs");
    expect(Array.isArray(data.metadata.sources)).toBe(true);
    expect(data.metadata.sources.length).toBeGreaterThan(0);

    // Verify at least one analytics source was included
    const validSources = ["ga4", "shopify", "meta"];
    const hasValidSource = data.metadata.sources.some((s: string) =>
      validSources.includes(s)
    );
    expect(hasValidSource).toBe(true);
  }, 180000); // 3 minute timeout for full orchestrator flow

  it("includes GA4 analysis when GA4 MCP is configured", async () => {
    if (!config.ga4McpUrl) {
      console.log("Skipping: GA4_MCP_URL not configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        options: { includeGA4: true, includeShopify: false, includeMeta: false },
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify GA4 analysis is included
    expect(data).toHaveProperty("ga4Analysis");
    expect(data.ga4Analysis).not.toBeNull();
    expect(data.metadata.sources).toContain("ga4");

    // Verify GA4 analysis structure
    expect(data.ga4Analysis).toHaveProperty("sessions");
    expect(data.ga4Analysis).toHaveProperty("activeUsers");
    expect(data.ga4Analysis).toHaveProperty("topChannels");
  }, 180000);

  it("includes Shopify analysis when Shopify MCP is configured", async () => {
    if (!config.shopifyMcpUrl) {
      console.log("Skipping: SHOPIFY_MCP_URL not configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        options: { includeGA4: false, includeShopify: true, includeMeta: false },
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify Shopify analysis is included
    expect(data).toHaveProperty("shopifyAnalysis");
    expect(data.shopifyAnalysis).not.toBeNull();
    expect(data.metadata.sources).toContain("shopify");

    // Verify Shopify analysis structure
    expect(data.shopifyAnalysis).toHaveProperty("totalRevenue");
    expect(data.shopifyAnalysis).toHaveProperty("totalOrders");
    expect(data.shopifyAnalysis).toHaveProperty("averageOrderValue");
  }, 180000);

  it("supports SSE streaming via Accept header", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ dateRange }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    // Consume and verify the SSE stream
    const events = await consumeSSEStream(response);

    // Verify event sequence
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("start");
    expect(eventTypes).toContain("phase");
    expect(eventTypes).toContain("complete");

    // Verify start event structure
    const startEvent = events.find((e) => e.type === "start");
    expect(startEvent).toBeDefined();
    const startPayload = startEvent?.data as {
      type: string;
      data: { dateRange: { startDate: string; endDate: string } };
    };
    expect(startPayload.data.dateRange).toHaveProperty("startDate");
    expect(startPayload.data.dateRange).toHaveProperty("endDate");

    // Verify phase events for analytics
    const phaseEvents = events.filter((e) => e.type === "phase");
    expect(phaseEvents.length).toBeGreaterThan(0);

    // Verify complete event has full response structure
    const completeEvent = events.find((e) => e.type === "complete");
    expect(completeEvent).toBeDefined();
    const completePayload = completeEvent?.data as {
      type: string;
      data: Record<string, unknown>;
    };
    expect(completePayload.data).toHaveProperty("brand");
    expect(completePayload.data).toHaveProperty("summary");
    expect(completePayload.data).toHaveProperty("insights");
  }, 180000); // 3 minute timeout for full orchestrator flow

  it("supports SSE streaming via query parameter", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(
      `${config.ccSvcUrl}/cc-svc/brand-insights?stream=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateRange }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    // Consume and verify the SSE stream
    const events = await consumeSSEStream(response);

    // Verify we received the complete event sequence
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("start");
    expect(eventTypes).toContain("complete");
  }, 180000); // 3 minute timeout for full orchestrator flow

  it("handles partial MCP availability gracefully", async () => {
    // This test verifies the endpoint works even if only some MCPs are available
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    // Request all sources - the service should use what's available
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        options: { includeGA4: true, includeShopify: true, includeMeta: true },
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Should have at least one source
    expect(data.metadata.sources.length).toBeGreaterThan(0);

    // Sources should only contain what was actually used
    for (const source of data.metadata.sources) {
      if (source === "ga4") {
        expect(data.ga4Analysis).not.toBeNull();
      }
      if (source === "shopify") {
        expect(data.shopifyAnalysis).not.toBeNull();
      }
      if (source === "meta") {
        expect(data.metaAnalysis).not.toBeNull();
      }
    }
  }, 180000);

  afterAll(async () => {
    // Allow connections to close gracefully
    await sleep(100);
  });
});
