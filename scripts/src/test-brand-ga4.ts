#!/usr/bin/env bun
/**
 * Test Brand Insights: Google Analytics 4
 *
 * Tests the brand insights endpoint with GA4 website analytics data
 * and verifies markdown report generation.
 *
 * Usage:
 *   npm run test:brand:ga4
 */

import { resolve } from "path";
import { streamBrandInsights } from "./lib/sse-client.js";
import { getLast7Days } from "./lib/date-utils.js";
import { formatSSEEvent, MarkdownMcpTracker } from "./lib/console-formatter.js";

// Load .env from scripts directory
const envPath = resolve(import.meta.dir, "../.env");
if (await Bun.file(envPath).exists()) {
  const envContent = await Bun.file(envPath).text();
  for (const line of envContent.split("\n")) {
    if (line && !line.startsWith("#") && line.includes("=")) {
      const [key, ...rest] = line.split("=");
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

const CC_SVC_URL = process.env.CC_SVC_URL ?? "http://localhost:3002";
const ENDPOINT = `${CC_SVC_URL}/cc-svc/brand-insights`;

async function main() {
  const dateRange = getLast7Days();

  console.log(`\n=== Brand Insights Test: Google Analytics 4 ===`);
  console.log(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  const request = {
    dateRange,
    options: {
      includeGA4: true,
      includeShopify: false,
      includeMeta: false,
    },
  };

  const tracker = new MarkdownMcpTracker();
  let hasError = false;

  try {
    await streamBrandInsights(request, {
      url: ENDPOINT,
      onEvent: (event) => {
        formatSSEEvent(event);
        tracker.track(event);
      },
      onError: (error) => {
        console.error("\n❌ Stream error:", error.message);
        hasError = true;
      },
      onComplete: () => {
        console.log("\n✓ Stream completed successfully");
      },
      verbose: true,
    });

    // Report markdown MCP usage
    console.log();
    tracker.report();

    if (!hasError) {
      console.log("\n✓ Test completed successfully");
      process.exit(0);
    } else {
      console.log("\n✗ Test completed with errors");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

main();
