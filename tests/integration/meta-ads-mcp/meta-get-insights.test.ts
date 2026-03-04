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

interface InsightsResult {
  data: Array<{
    campaign_id?: string;
    campaign_name?: string;
    adset_id?: string;
    adset_name?: string;
    ad_id?: string;
    ad_name?: string;
    date_start?: string;
    date_stop?: string;
    spend?: string;
    impressions?: string;
    clicks?: string;
    reach?: string;
    ctr?: string;
    cpc?: string;
    cpm?: string;
  }>;
  paging?: {
    cursors?: {
      after?: string;
      before?: string;
    };
  };
}

interface CampaignsResult {
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    objective?: string;
    buying_type?: string;
  }>;
}

describe("meta-ads-mcp", () => {
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

  describe("POST /mcp - tools/call meta_get_insights", () => {
    it("returns insights data for valid ad account with date preset", async () => {
      // Skip if no ad account configured
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_insights", {
          ad_account_id: config.adAccountId,
          level: "campaign",
          date_preset: "last_7d",
          fields: ["spend", "impressions", "clicks", "ctr"],
        })
      );

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const insightsData = extractToolResultJson<InsightsResult>(data);
      expect(insightsData).toHaveProperty("data");
      expect(Array.isArray(insightsData.data)).toBe(true);
    });

    it("supports custom date range", async () => {
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_insights", {
          ad_account_id: config.adAccountId,
          level: "campaign",
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          fields: ["spend", "impressions"],
        })
      );

      expect(response.status).toBe(200);

      const insightsData = extractToolResultJson<InsightsResult>(data);
      expect(insightsData).toHaveProperty("data");
    });

    it("supports adset level breakdown", async () => {
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_insights", {
          ad_account_id: config.adAccountId,
          level: "adset",
          date_preset: "last_30d",
          fields: ["spend", "impressions", "clicks"],
        })
      );

      expect(response.status).toBe(200);

      const insightsData = extractToolResultJson<InsightsResult>(data);
      expect(insightsData).toHaveProperty("data");
      // Adset level should have adset_id in results
      if (insightsData.data.length > 0) {
        expect(insightsData.data[0]).toHaveProperty("adset_id");
      }
    });

    it("supports ad level breakdown", async () => {
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_insights", {
          ad_account_id: config.adAccountId,
          level: "ad",
          date_preset: "last_7d",
          fields: ["spend", "impressions", "clicks", "ctr", "cpc"],
        })
      );

      expect(response.status).toBe(200);

      const insightsData = extractToolResultJson<InsightsResult>(data);
      expect(insightsData).toHaveProperty("data");
    });

    it("returns error for invalid ad account", async () => {
      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_insights", {
          ad_account_id: "act_invalid_12345",
          level: "campaign",
          date_preset: "last_7d",
          fields: ["spend"],
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
            name: "meta_get_insights",
            arguments: {
              // Missing required fields
            },
          },
        }),
      });

      expect(response.status).toBe(200);

      const text = await response.text();
      const data = parseSseResponse(text) as { result?: McpToolResult; error?: unknown };
      expect(data.result?.isError || data.error).toBeTruthy();
    });
  });

  describe("POST /mcp - tools/call meta_get_campaigns", () => {
    it("returns campaigns for valid ad account", async () => {
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_campaigns", {
          ad_account_id: config.adAccountId,
          limit: 10,
        })
      );

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("result");

      const campaignsData = extractToolResultJson<CampaignsResult>(data);
      expect(campaignsData).toHaveProperty("campaigns");
      expect(Array.isArray(campaignsData.campaigns)).toBe(true);

      // Each campaign should have id, name, status
      if (campaignsData.campaigns.length > 0) {
        const campaign = campaignsData.campaigns[0];
        expect(campaign).toHaveProperty("id");
        expect(campaign).toHaveProperty("name");
        expect(campaign).toHaveProperty("status");
      }
    });

    it("respects limit parameter", async () => {
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const limit = 5;
      const { response, data } = await Effect.runPromise(
        callMcpTool(config.mcpUrl, "meta_get_campaigns", {
          ad_account_id: config.adAccountId,
          limit,
        })
      );

      expect(response.status).toBe(200);

      const campaignsData = extractToolResultJson<CampaignsResult>(data);
      expect(campaignsData.campaigns.length).toBeLessThanOrEqual(limit);
    });

    it("maintains session across multiple requests", async () => {
      if (!config.adAccountId) {
        console.log("Skipping: META_TEST_AD_ACCOUNT_ID not configured");
        return;
      }

      const sessionId = generateSessionId();

      // First request - get campaigns
      const { response: response1 } = await Effect.runPromise(
        callMcpTool(
          config.mcpUrl,
          "meta_get_campaigns",
          {
            ad_account_id: config.adAccountId,
            limit: 5,
          },
          sessionId
        )
      );
      expect(response1.status).toBe(200);

      // Second request - get insights
      const { response: response2 } = await Effect.runPromise(
        callMcpTool(
          config.mcpUrl,
          "meta_get_insights",
          {
            ad_account_id: config.adAccountId,
            level: "campaign",
            date_preset: "last_7d",
            fields: ["spend"],
          },
          sessionId
        )
      );
      expect(response2.status).toBe(200);
    });
  });
});
