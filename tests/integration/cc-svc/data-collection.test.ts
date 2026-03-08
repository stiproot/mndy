import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  waitForHealth,
  config,
  sleep,
  hasAnalyticsMcps,
  getLast7DaysRange,
  isDaprMcpAvailable,
} from "./setup.js";

describe("POST /cc-svc/brand-insights/collect", () => {
  beforeAll(async () => {
    await waitForHealth(`${config.ccSvcUrl}/cc-svc/health`);

    if (!hasAnalyticsMcps()) {
      console.log(
        "Skipping data-collection tests: No analytics MCPs configured (GA4_MCP_URL or SHOPIFY_MCP_URL)"
      );
    }
  });

  it("returns 400 for missing required fields", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
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

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: [],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid source", async () => {
    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["invalid_source"],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("collects GA4 data when GA4 MCP is configured", async () => {
    if (!config.ga4McpUrl) {
      console.log("Skipping: GA4_MCP_URL not configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["ga4"],
        brandId: "test",
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("collected");
    expect(data).toHaveProperty("cached");
    expect(data).toHaveProperty("metadata");

    // Verify GA4 collection status
    expect(data.collected).toHaveProperty("ga4");
    expect(data.collected.ga4.status).toBe("success");
    expect(data.collected.ga4.actorId).toContain("ga4-test-");

    // Verify metadata
    expect(data.metadata.brandId).toBe("test");
    expect(data.metadata.dateRange).toEqual(dateRange);
    expect(data.metadata.processingTimeMs).toBeGreaterThan(0);
  }, 180000);

  it("collects Shopify data when Shopify MCP is configured", async () => {
    if (!config.shopifyMcpUrl) {
      console.log("Skipping: SHOPIFY_MCP_URL not configured");
      return;
    }

    const dateRange = getLast7DaysRange();

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["shopify"],
        brandId: "test",
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify Shopify collection status
    expect(data.collected).toHaveProperty("shopify");
    expect(data.collected.shopify.status).toBe("success");
    expect(data.collected.shopify.actorId).toContain("shopify-test-");
  }, 180000);

  it("collects from multiple sources in parallel", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const sources: string[] = [];

    if (config.ga4McpUrl) sources.push("ga4");
    if (config.shopifyMcpUrl) sources.push("shopify");

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
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

    // Verify all requested sources were attempted
    for (const source of sources) {
      expect(data.collected).toHaveProperty(source);
      expect(["success", "failed", "skipped"]).toContain(data.collected[source].status);
    }
  }, 180000);

  it("skips unavailable sources gracefully", async () => {
    const dateRange = getLast7DaysRange();

    // Request meta which is not implemented
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["meta"],
        brandId: "test",
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Meta should be skipped (not configured)
    expect(data.collected).toHaveProperty("meta");
    expect(["skipped", "failed"]).toContain(data.collected.meta.status);
  }, 30000);

  it("uses default brandId when not specified", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const sources = config.ga4McpUrl ? ["ga4"] : ["shopify"];

    const response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources,
        // brandId not specified - should default to "default"
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.metadata.brandId).toBe("default");

    // Actor ID should contain "default"
    const source = sources[0];
    if (data.collected[source].actorId) {
      expect(data.collected[source].actorId).toContain("-default-");
    }
  }, 180000);

  afterAll(async () => {
    await sleep(100);
  });
});
