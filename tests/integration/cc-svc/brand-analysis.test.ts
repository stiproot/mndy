import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  waitForHealth,
  config,
  consumeSSEStream,
  sleep,
  hasAnalyticsMcps,
  getLast7DaysRange,
} from "./setup.js";

describe("POST /cc-svc/brand-insights/analyze", () => {
  beforeAll(async () => {
    await waitForHealth(`${config.ccSvcUrl}/cc-svc/health`);

    if (!hasAnalyticsMcps()) {
      console.log(
        "Skipping brand-analysis tests: No analytics MCPs configured (GA4_MCP_URL or SHOPIFY_MCP_URL)"
      );
    }
  });

  it("returns 400 for missing required fields", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange: {
          startDate: "01-01-2024",
          endDate: "01-31-2024",
        },
        sources: ["ga4"],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for empty sources array", async () => {
    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: [],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("analyzes cached data and returns brand insights", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const sources: string[] = [];

    if (config.ga4McpUrl) sources.push("ga4");
    if (config.shopifyMcpUrl) sources.push("shopify");

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources,
        brandId: "test-parallel",
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure matches BrandInsightsResponse
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
  }, 180000);

  it("supports SSE streaming via Accept header", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const sources = config.ga4McpUrl ? ["ga4"] : ["shopify"];

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        dateRange,
        sources,
        brandId: "test-stream",
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const events = await consumeSSEStream(response);

    // Verify event sequence
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("start");
    expect(eventTypes).toContain("phase");
    expect(eventTypes).toContain("complete");

    // Verify start event
    const startEvent = events.find((e) => e.type === "start");
    expect(startEvent).toBeDefined();

    // Verify complete event has full response
    const completeEvent = events.find((e) => e.type === "complete");
    expect(completeEvent).toBeDefined();
    const completeData = completeEvent?.data as { type: string; data: Record<string, unknown> };
    expect(completeData.data).toHaveProperty("brand");
    expect(completeData.data).toHaveProperty("summary");
    expect(completeData.data).toHaveProperty("insights");
  }, 180000);

  it("supports SSE streaming via query parameter", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const sources = config.ga4McpUrl ? ["ga4"] : ["shopify"];

    const response = await fetch(
      `${config.ccSvcUrl}/cc-svc/brand-insights/analyze?stream=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRange,
          sources,
          brandId: "test-stream-param",
        }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const events = await consumeSSEStream(response);

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("start");
    expect(eventTypes).toContain("complete");
  }, 180000);

  afterAll(async () => {
    await sleep(100);
  });
});
