import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  waitForHealth,
  config,
  sleep,
  hasAnalyticsMcps,
  getLast7DaysRange,
  isDaprMcpAvailable,
} from "./setup.js";

/**
 * End-to-end tests for the brand insights pipeline.
 * Tests the full flow: collect -> analyze -> verify persistence
 */
describe("Brand Insights E2E: collect -> analyze", () => {
  const testBrandId = `e2e-test-${Date.now()}`;

  beforeAll(async () => {
    await waitForHealth(`${config.ccSvcUrl}/cc-svc/health`);

    if (!hasAnalyticsMcps()) {
      console.log(
        "Skipping E2E tests: No analytics MCPs configured (GA4_MCP_URL or SHOPIFY_MCP_URL)"
      );
    }
  });

  it("completes full pipeline: collect data, then analyze", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const sources: string[] = [];

    if (config.ga4McpUrl) sources.push("ga4");
    if (config.shopifyMcpUrl) sources.push("shopify");

    // Step 1: Collect data
    console.log(`[E2E] Step 1: Collecting data for brand ${testBrandId}...`);
    const collectResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources,
        brandId: testBrandId,
      }),
    });

    expect(collectResponse.status).toBe(200);

    const collectData = await collectResponse.json();
    console.log(`[E2E] Collection complete:`, {
      sources: Object.keys(collectData.collected),
      processingTimeMs: collectData.metadata.processingTimeMs,
    });

    // Verify at least one source was successfully collected
    const successfulSources = Object.entries(collectData.collected)
      .filter(([, result]) => (result as { status: string }).status === "success")
      .map(([source]) => source);

    expect(successfulSources.length).toBeGreaterThan(0);
    console.log(`[E2E] Successfully collected from: ${successfulSources.join(", ")}`);

    // Step 2: Analyze the collected data
    console.log(`[E2E] Step 2: Analyzing data for brand ${testBrandId}...`);
    const analyzeResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: successfulSources,
        brandId: testBrandId,
      }),
    });

    expect(analyzeResponse.status).toBe(200);

    const analyzeData = await analyzeResponse.json();
    console.log(`[E2E] Analysis complete:`, {
      healthScore: analyzeData.summary?.overallHealthScore,
      sources: analyzeData.metadata?.sources,
      processingTimeMs: analyzeData.metadata?.processingTimeMs,
    });

    // Verify the analysis response structure
    expect(analyzeData).toHaveProperty("brand");
    expect(analyzeData).toHaveProperty("summary");
    expect(analyzeData).toHaveProperty("insights");
    expect(analyzeData).toHaveProperty("metadata");

    // Verify health score is valid
    expect(analyzeData.summary.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(analyzeData.summary.overallHealthScore).toBeLessThanOrEqual(100);

    // Verify insights were generated
    expect(analyzeData.insights.wins.length).toBeGreaterThan(0);
    expect(analyzeData.insights.recommendations.length).toBeGreaterThan(0);

    // Verify metadata reflects the sources used
    expect(analyzeData.metadata.sources.length).toBeGreaterThan(0);
    expect(analyzeData.metadata.dateRange).toEqual(dateRange);

    console.log(`[E2E] Brand report generated successfully!`);
    console.log(`[E2E] Health Score: ${analyzeData.summary.overallHealthScore}`);
    console.log(`[E2E] Wins: ${analyzeData.insights.wins.length}`);
    console.log(`[E2E] Concerns: ${analyzeData.insights.concerns.length}`);
    console.log(`[E2E] Recommendations: ${analyzeData.insights.recommendations.length}`);
  }, 300000); // 5 minute timeout for full E2E flow

  it("generates consistent results for same data range", async () => {
    if (!hasAnalyticsMcps()) {
      console.log("Skipping: No analytics MCPs configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const brandId = `consistency-${Date.now()}`;
    const sources = config.ga4McpUrl ? ["ga4"] : ["shopify"];

    // Collect data once
    const collectResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources,
        brandId,
      }),
    });

    expect(collectResponse.status).toBe(200);

    // Analyze twice
    const analyze1Response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources,
        brandId,
      }),
    });

    const analyze2Response = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources,
        brandId,
      }),
    });

    expect(analyze1Response.status).toBe(200);
    expect(analyze2Response.status).toBe(200);

    const data1 = await analyze1Response.json();
    const data2 = await analyze2Response.json();

    // Both should have the same sources
    expect(data1.metadata.sources).toEqual(data2.metadata.sources);
    expect(data1.metadata.dateRange).toEqual(data2.metadata.dateRange);

    // Health scores should be similar (allow some variance due to LLM)
    const scoreDiff = Math.abs(
      data1.summary.overallHealthScore - data2.summary.overallHealthScore
    );
    expect(scoreDiff).toBeLessThan(20); // Within 20 points
  }, 300000);

  it("handles GA4-only analysis", async () => {
    if (!config.ga4McpUrl) {
      console.log("Skipping: GA4_MCP_URL not configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const brandId = `ga4-only-${Date.now()}`;

    // Collect GA4 data
    const collectResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["ga4"],
        brandId,
      }),
    });

    expect(collectResponse.status).toBe(200);

    // Analyze
    const analyzeResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["ga4"],
        brandId,
      }),
    });

    expect(analyzeResponse.status).toBe(200);

    const data = await analyzeResponse.json();

    expect(data.metadata.sources).toContain("ga4");
    expect(data.ga4Analysis).not.toBeNull();
  }, 300000);

  it("handles Shopify-only analysis", async () => {
    if (!config.shopifyMcpUrl) {
      console.log("Skipping: SHOPIFY_MCP_URL not configured");
      return;
    }

    const dateRange = getLast7DaysRange();
    const brandId = `shopify-only-${Date.now()}`;

    // Collect Shopify data
    const collectResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["shopify"],
        brandId,
      }),
    });

    expect(collectResponse.status).toBe(200);

    // Analyze
    const analyzeResponse = await fetch(`${config.ccSvcUrl}/cc-svc/brand-insights/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRange,
        sources: ["shopify"],
        brandId,
      }),
    });

    expect(analyzeResponse.status).toBe(200);

    const data = await analyzeResponse.json();

    expect(data.metadata.sources).toContain("shopify");
    expect(data.shopifyAnalysis).not.toBeNull();
  }, 300000);

  afterAll(async () => {
    await sleep(100);
  });
});
