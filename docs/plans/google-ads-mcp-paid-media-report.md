# Google Ads MCP & Paid Media Report Implementation Plan

**Status:** 🚧 In Progress
**Start Date:** 2026-03-30
**Target Completion:** TBD
**Priority:** High

---

## 📋 Executive Summary

Build a Google Ads MCP server to enable comprehensive paid media reporting across Google Ads, Meta Ads, GA4, and Shopify. This will allow generation of markdown reports similar to the sample PDF at `docs/reports/samples/arthur-ford-paid-media-overview-3-months.pdf`.

**Key Deliverables:**
1. Google Ads MCP server with campaign performance tools
2. Dapr integration for data persistence
3. Google Ads analyst agent in cc-svc
4. Paid media report generation with markdown output
5. Test scripts and documentation

---

## 🎯 Objectives

### Primary Goal
Enable users to request 3-month paid media reports that synthesize data from:
- **Google Ads** - Paid search/display advertising (NEW)
- **Meta Ads** - Facebook/Instagram advertising (EXISTS)
- **GA4** - Website analytics (EXISTS)
- **Shopify** - E-commerce data (EXISTS)

### Report Structure
- Executive summary with health score
- Platform performance comparison table
- Campaign analysis (top performers, underperformers)
- Wins and concerns
- Prioritized recommendations
- Budget optimization suggestions

---

## 📊 Current State Analysis

### Existing Infrastructure
✅ **Meta Ads MCP** - Full advertising data (spend, ROAS, conversions)
✅ **GA4 MCP** - Website traffic and conversion analytics
✅ **Shopify MCP** - E-commerce sales and order data
✅ **Markdown MCP** - Report generation capability
✅ **Brand Insights** - Multi-agent orchestration system

### Critical Gap
❌ **Google Ads MCP** - Required for paid search/display advertising data

---

## 🏗️ Architecture Overview

### Data Flow
```
User Request (POST /brand-insights)
    ↓
BrandInsightsService
    ↓
Parallel Sub-Agent Execution:
├── Google Ads Analyst → google-ads-mcp → Dapr cache
├── Meta Ads Analyst → meta-ads-mcp → Dapr cache
├── GA4 Analyst → ga4-mcp → Dapr cache
└── Shopify Analyst → shopify-mcp → Dapr cache
    ↓
Brand Orchestrator Agent (synthesis)
    ↓
├── Aggregate data from all sources
├── Calculate health score (0-100)
├── Generate insights (wins, concerns, recommendations)
└── Create markdown report via markdown-mcp
    ↓
Return JSON + Markdown Report
```

### Google Ads MCP Components
```
google-ads-mcp (port 3006)
├── Tools
│   ├── google_ads_get_campaigns - List campaigns
│   └── google_ads_get_performance - Performance metrics (account/campaign/ad_group/keyword)
├── Service
│   └── GoogleAdsClient - GAQL query builder, API client wrapper
├── Config
│   └── OAuth 2.0 + Developer Token authentication
└── Errors
    ├── GoogleAdsApiError - General API errors
    ├── GoogleAdsQuotaError - Rate limit/quota errors
    ├── GoogleAdsAuthError - Authentication failures
    └── TimeoutError - Request timeouts
```

---

## 📝 Implementation Phases

### Phase 1: Google Ads MCP Server ⏳

#### 1.1 Directory Structure ✅
**Status:** Ready to create
**Files:**
```
src/google-ads-mcp/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── services/
│   │   └── google-ads.service.ts
│   └── tools/
│       ├── index.ts
│       ├── get-campaigns.ts
│       └── get-performance.ts
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.template
└── README.md
```

#### 1.2 Core Types & Configuration ⏳
**File:** `src/google-ads-mcp/src/types.ts`

**Configuration:**
```typescript
ServerConfig: { port: 3006, logLevel: "info" }
GoogleAdsConfig: {
  clientId: string
  clientSecret: string (secret)
  developerToken: string (secret)
  refreshToken: string (secret)
  customerId: string (10 digits, no dashes)
}
```

**Error Types:**
- `GoogleAdsApiError` - API failures with status/code
- `GoogleAdsQuotaError` - 15K ops/day limit exceeded
- `GoogleAdsAuthError` - OAuth token issues
- `TimeoutError` - 60s request timeout
- `ConfigError` - Missing/invalid config

#### 1.3 GoogleAdsClient Service ⏳
**File:** `src/google-ads-mcp/src/services/google-ads.service.ts`

**Dependencies:** `google-ads-api` npm package (v15.3.0)

**Methods:**
- `getCampaigns(customerId?, status?, limit?)` - List campaigns
- `getPerformance(input)` - GAQL query for metrics

**Resilience Patterns:**
- ✅ 60-second timeout on all API calls
- ✅ Exponential backoff retry (3 attempts)
- ✅ OpenTelemetry spans for observability
- ✅ Type-safe error handling

**GAQL Query Example:**
```sql
SELECT
  campaign.id, campaign.name, campaign.status,
  metrics.cost_micros, metrics.impressions, metrics.clicks,
  metrics.conversions, metrics.conversions_value,
  metrics.ctr, metrics.average_cpc
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status IN ('ENABLED', 'PAUSED')
ORDER BY metrics.cost_micros DESC
LIMIT 100
```

#### 1.4 Tool: google_ads_get_campaigns ⏳
**File:** `src/google-ads-mcp/src/tools/get-campaigns.ts`

**Parameters:**
- `customerId?: string` - Account ID (optional, uses default)
- `status?: Array<"ENABLED" | "PAUSED" | "REMOVED">` - Filter by status
- `limit?: number` - Max results (default 100, max 500)

**Returns:**
```typescript
{
  summary: string,
  customerId: string,
  count: number,
  campaigns: Array<{
    id: string,
    name: string,
    status: string,
    advertising_channel_type: string,
    bidding_strategy: string
  }>
}
```

#### 1.5 Tool: google_ads_get_performance ⏳
**File:** `src/google-ads-mcp/src/tools/get-performance.ts`

**Parameters:**
- `customerId?: string` - Account ID (optional)
- `level?: "account" | "campaign" | "ad_group" | "keyword"` - Aggregation level (default: campaign)
- `datePreset?: string` - "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | etc.
- `timeRange?: { since, until }` - Custom date range (YYYY-MM-DD)
- `campaignIds?: string[]` - Filter specific campaigns
- `includeQualityMetrics?: boolean` - Include quality_score, impression_share
- `limit?: number` - Max results (default 100, max 1000)

**Metrics Returned:**
| Metric | Source | Calculation |
|--------|--------|-------------|
| spend | metrics.cost_micros | / 1,000,000 |
| impressions | metrics.impressions | Direct |
| clicks | metrics.clicks | Direct |
| conversions | metrics.conversions | Direct |
| revenue | metrics.conversions_value | Direct |
| ctr | metrics.ctr | × 100 (%) |
| cpc | metrics.average_cpc | / 1,000,000 |
| cpm | metrics.average_cpm | / 1,000,000 |
| roas | Calculated | revenue / spend |
| conversion_rate | metrics.conversions_rate | × 100 (%) |

**Returns:**
```typescript
{
  summary: string,
  customerId: string,
  level: string,
  totals: {
    spend: number,
    impressions: number,
    clicks: number,
    conversions: number,
    revenue: number,
    roas: number,
    ctr: string (%)
  },
  rowCount: number,
  data: Array<PerformanceRow>
}
```

#### 1.6 Server Bootstrap ⏳
**File:** `src/google-ads-mcp/src/index.ts`

**Pattern:** Follow github-issues-mcp (not original template)
- Effect.gen for async startup
- createMcpApp with tool registration
- SIGINT handler for graceful shutdown
- Provide GoogleAdsClient.Default at top level

#### 1.7 Configuration Files ⏳
**Files:**
- `package.json` - Dependencies, scripts
- `tsconfig.json` - TypeScript config
- `Dockerfile` - Container image
- `.env.template` - Environment variables template
- `README.md` - Setup guide with OAuth flow

**Key Dependencies:**
```json
{
  "dependencies": {
    "mcp-core": "workspace:*",
    "google-ads-api": "^15.3.0",
    "dotenv": "^16.4.5",
    "effect": "^3.12.5"
  }
}
```

#### 1.8 Authentication Setup Documentation ⏳
**README Section:** OAuth 2.0 Setup Guide

**Steps:**
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Apply for Developer Token at https://ads.google.com/aw/apicenter
3. Generate Refresh Token using OAuth 2.0 Playground:
   - URL: https://developers.google.com/oauthplayground/
   - Scope: `https://www.googleapis.com/auth/adwords`
4. Configure environment variables in `.env`

**Rate Limits:**
- Test Access: Test accounts only, no prod limit
- Basic Access: 15,000 operations/day (application required)
- Standard Access: Higher limits (by invitation)

---

### Phase 2: Dapr MCP Integration ⏳

#### 2.1 Data Submission Tool ⏳
**File:** `src/dapr-mcp/src/tools/submit-google-ads-data.ts`

**Schema:**
```typescript
{
  stateKey: string,  // "google-ads-{brandId}-{startDate}-{endDate}"
  data: {
    dateRange: { startDate, endDate },
    totalSpend: number,
    totalImpressions: number,
    totalClicks: number,
    totalConversions: number,
    totalRevenue: number,
    avgCpc: number,
    avgCtr: number,
    roas: number,
    campaigns: Array<{
      campaignId: string,
      campaignName: string,
      spend: number,
      impressions: number,
      clicks: number,
      conversions: number,
      revenue: number,
      roas: number
    }>,  // Top 10 campaigns
    observations: string[]  // 2-3 key insights
  }
}
```

**Pattern:** Follow `submit-meta-data.ts`
- Effect.gen for effect composition
- Schema validation with Effect Schema
- TTL calculation based on date range
- Structured output with success flag

#### 2.2 Tool Registration ⏳
**File:** `src/dapr-mcp/src/tools/index.ts`

**Update:**
```typescript
import { registerSubmitGoogleAdsDataTool } from "./submit-google-ads-data.js";

export function registerTools(server: McpServer): void {
  // ... existing tools
  registerSubmitGoogleAdsDataTool(server);  // ADD
}

export * from "./submit-google-ads-data.js";  // ADD
```

---

### Phase 3: Brand Insights Integration ⏳

#### 3.1 Google Ads Analyst Agent ⏳
**File:** `src/cc-svc/src/agents/index.ts`

**Functions to Add:**
```typescript
// MCP server getter
export function getGoogleAdsMcpServer(): McpClient | null {
  const config = getConfig();
  return config.GOOGLE_ADS_MCP_URL
    ? { url: config.GOOGLE_ADS_MCP_URL, name: "google-ads" }
    : null;
}

// Agent creator
export function createGoogleAdsAnalystAgent(): Agent | null {
  const config = getConfig();
  const googleAdsServer = getGoogleAdsMcpServer();
  const daprServer = getDaprMcpServer();

  if (!googleAdsServer) return null;

  return agentBuilder("google-ads-analyst")
    .model(config.CLAUDE_MODEL)
    .mcpServer("google-ads", googleAdsServer)
    .mcpServer("dapr", daprServer)
    .systemPrompt(GOOGLE_ADS_ANALYST_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    .disallowTools("Read", "Write", "Edit", "Bash", "Glob", "Grep")
    .build();
}
```

**Update:**
```typescript
export function getAvailableAnalyticsSources() {
  return {
    ga4: !!getGA4McpServer(),
    shopify: !!getShopifyMcpServer(),
    meta: !!getMetaMcpServer(),
    googleAds: !!getGoogleAdsMcpServer(),  // ADD
  };
}
```

#### 3.2 Google Ads Analyst Prompts ⏳
**File:** `src/cc-svc/src/prompts/brand-insights.prompt.ts`

**System Prompt:**
```typescript
export const GOOGLE_ADS_ANALYST_PROMPT = `...
## Your Task
1. Retrieve ad spend and performance metrics
2. Analyze campaign effectiveness (ROAS, CPA, CTR)
3. Identify top performing campaigns
4. Calculate key advertising KPIs
5. PERSIST findings using submit_google_ads_data

## Tools Available
- google_ads_get_campaigns
- google_ads_get_performance
- submit_google_ads_data (REQUIRED)
...`;
```

**Task Prompt Builder:**
```typescript
export function buildGoogleAdsAnalystPrompt(
  startDate: string,
  endDate: string,
  brandId = "default"
): string {
  const stateKey = `google-ads-${brandId}-${startDate}-${endDate}`;
  return `Analyze Google Ads data for ${startDate} to ${endDate}

Cache Key: ${stateKey}

WORKFLOW:
1. Use google_ads_get_performance to gather metrics
2. REQUIRED: Call submit_google_ads_data with stateKey "${stateKey}"

submit_google_ads_data expects:
- stateKey: "${stateKey}"
- data: { dateRange, totalSpend, ..., campaigns, observations }
`;
}
```

#### 3.3 Brand Insights Service Updates ⏳
**File:** `src/cc-svc/src/services/brand-insights.service.ts`

**Add Google Ads Execution:**
```typescript
const useGoogleAds = availableSources.googleAds && (options?.includeGoogleAds !== false);

if (useGoogleAds) {
  analysisPromises.push(
    this.runGoogleAdsAnalyst(startDate, endDate)
      .then((result) => ({ source: "google-ads", result }))
      .catch((error) => {
        logger.warn(`Google Ads analysis failed: ${error.message}`);
        return { source: "google-ads", result: null };
      })
  );
}
```

**Add Method:**
```typescript
private async runGoogleAdsAnalyst(startDate: string, endDate: string): Promise<string> {
  const agent = createGoogleAdsAnalystAgent();
  if (!agent) throw new AgentError("Google Ads analyst not available");

  const prompt = buildGoogleAdsAnalystPrompt(startDate, endDate);
  const response = await agent.run(prompt);

  return response.output;
}
```

**Update Synthesis:**
```typescript
const googleAdsAnalysis = analysisResults.find((r) => r.source === "google-ads")?.result ?? null;

const result = await this.synthesizeResults(
  startDate, endDate,
  ga4Analysis, shopifyAnalysis, metaAnalysis,
  googleAdsAnalysis,  // ADD
  startTime
);
```

#### 3.4 Schema Updates ⏳
**File:** `src/cc-svc/src/schemas/brand-insights.schema.ts`

**Request Schema:**
```typescript
export const brandInsightsRequestSchema = z.object({
  dateRange: dateRangeSchema,
  options: z.object({
    includeGA4: z.boolean().optional(),
    includeShopify: z.boolean().optional(),
    includeMeta: z.boolean().optional(),
    includeGoogleAds: z.boolean().optional(),  // ADD
  }).optional(),
});
```

**Response Schema:**
```typescript
export const googleAdsAnalysisSchema = z.object({
  totalSpend: z.number(),
  totalImpressions: z.number(),
  totalClicks: z.number(),
  totalConversions: z.number(),
  totalRevenue: z.number(),
  avgCpc: z.number(),
  avgCtr: z.number(),
  roas: z.number(),
  topCampaigns: z.array(z.object({
    campaignName: z.string(),
    spend: z.number(),
    conversions: z.number(),
    roas: z.number(),
  })),
  observations: z.array(z.string()),
});

export const brandInsightsResponseSchema = z.object({
  // ... existing fields
  googleAdsAnalysis: googleAdsAnalysisSchema.nullable(),  // ADD
  // ... rest
});
```

#### 3.5 Brand Orchestrator Prompt Updates ⏳
**File:** `src/cc-svc/src/prompts/brand-insights.prompt.ts`

**Update System Prompt:**
```typescript
export const BRAND_ORCHESTRATOR_PROMPT = `...
## Your Task
You will receive analysis from:
- GA4 (website analytics)
- Shopify (e-commerce data)
- Meta Ads (Facebook/Instagram advertising)
- Google Ads (paid search/display advertising)  // ADD

## Health Score Calculation
- Traffic growth/stability (GA4)
- Conversion rates (GA4)
- Revenue performance (Shopify)
- Customer acquisition
- Overall efficiency (ROAS from Google Ads + Meta Ads)  // UPDATE
- Cross-platform attribution (GA4 vs paid platforms)  // NEW
...`;
```

**Update Synthesis Prompt Builder:**
```typescript
export function buildBrandSynthesisPrompt(
  startDate: string, endDate: string,
  ga4Analysis: string | null,
  shopifyAnalysis: string | null,
  metaAnalysis: string | null,
  googleAdsAnalysis: string | null,  // ADD
  startTime: number,
  brandId = "default"
): string {
  // ... existing code

  if (googleAdsAnalysis) {
    sources.push("google-ads");
    dataSection += `## Google Ads Analysis\n${googleAdsAnalysis}\n\n`;
  }

  // ... rest
}
```

#### 3.6 Configuration Updates ⏳
**File:** `src/cc-svc/src/config/env.ts`

**Add Environment Variable:**
```typescript
export const envSchema = z.object({
  // ... existing
  GOOGLE_ADS_MCP_URL: z.string().url().optional(),  // ADD
  // ... rest
});
```

**Files:** `src/cc-svc/.env.template` and `src/cc-svc/.env`

**Add:**
```bash
GOOGLE_ADS_MCP_URL=http://localhost:3006/mcp
```

---

### Phase 4: Testing & Scripts ⏳

#### 4.1 Paid Media Test Script ⏳
**File:** `scripts/src/test-paid-media-report.ts`

**Purpose:** Test end-to-end report generation with all 4 sources

**Request:**
```typescript
const request = {
  dateRange: {
    startDate: "2026-01-01",
    endDate: "2026-03-31"
  },
  options: {
    includeGA4: true,
    includeShopify: true,
    includeMeta: true,
    includeGoogleAds: true
  }
};
```

**Features:**
- SSE streaming with real-time progress
- Markdown tool usage tracking
- Error handling and reporting
- Exit codes (0=success, 1=error)

#### 4.2 Package Scripts ⏳
**File:** `scripts/package.json`

**Add:**
```json
{
  "scripts": {
    "test:paid-media": "bun run src/test-paid-media-report.ts"
  }
}
```

---

### Phase 5: Documentation & Infrastructure ⏳

#### 5.1 Marketing Analytics Rules ⏳
**File:** `.claude/rules/marketing-analytics.md`

**Add Google Ads Section:**

**Data Normalization Table:**
| Standard | GA4 | Meta | Shopify | Google Ads |
|----------|-----|------|---------|------------|
| spend | - | spend | - | cost_micros/1M |
| impressions | impressions | impressions | - | impressions |
| clicks | clicks | clicks | - | clicks |
| conversions | conversions | actions | orders | conversions |
| revenue | purchaseRevenue | action_value | total_price | conversions_value |
| ctr | - | ctr | - | ctr × 100 |
| cpc | - | cpc | - | average_cpc/1M |
| cpm | - | cpm | - | average_cpm/1M |

**Google Ads Specifics:**
- Cost fields in micros (÷ 1,000,000)
- CTR as decimal (× 100 for %)
- ROAS = conversions_value / cost
- Conversion rate = conversions_rate × 100

**Rate Limits:**
- Basic access: 15,000 operations/day
- Implement caching to minimize API calls

#### 5.2 Workspace & Build Configuration ⏳
**File:** `package.json` (root)

**Add to Workspaces:**
```json
{
  "workspaces": [
    "src/google-ads-mcp"  // ADD
  ]
}
```

**File:** `Makefile`

**Add Targets:**
```makefile
run-google-ads-mcp: build-google-ads-mcp ## Run Google Ads MCP (port 3006)
	bun run --cwd src/google-ads-mcp start

build-google-ads-mcp: ## Build Google Ads MCP
	bun run --cwd src/mcp-core build
	bun run --cwd src/google-ads-mcp build

build-mcp: build-mcp-core build-ga4-mcp build-meta-ads-mcp build-shopify-mcp build-dapr-mcp build-github-issues-mcp build-markdown-mcp build-google-ads-mcp  ## Build all MCP servers
```

#### 5.3 Docker Compose ⏳
**File:** `docker-compose.yml`

**Add Service:**
```yaml
google-ads-mcp:
  build:
    context: .
    dockerfile: src/google-ads-mcp/Dockerfile
  container_name: google-ads-mcp
  ports:
    - "3006:3006"
  env_file:
    - src/google-ads-mcp/.env
  networks:
    - mndy
  profiles:
    - ai
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3006/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### 5.4 Google Ads MCP README ⏳
**File:** `src/google-ads-mcp/README.md`

**Sections:**
1. Overview & features
2. Setup & authentication guide
3. Configuration reference
4. Tools documentation
5. Metrics reference
6. Development guide
7. Architecture notes
8. References

---

## ✅ Success Criteria

### Google Ads MCP
- [ ] Server runs on port 3006
- [ ] `google_ads_get_campaigns` returns campaign list
- [ ] `google_ads_get_performance` returns metrics at campaign level
- [ ] Timeout (60s) works correctly
- [ ] Retry with exponential backoff handles transient errors
- [ ] Tagged errors map correctly from Google Ads API

### Dapr Integration
- [ ] `submit_google_ads_data` persists to Dapr cache
- [ ] TTL calculation works based on date range
- [ ] Schema validation catches invalid data

### Brand Insights Integration
- [ ] Google Ads analyst agent executes successfully
- [ ] Brand insights endpoint accepts `includeGoogleAds` option
- [ ] Orchestrator synthesizes all 4 data sources
- [ ] Health score includes paid advertising efficiency

### Report Generation
- [ ] Markdown report generated with all sections
- [ ] Platform comparison table includes Google Ads
- [ ] Campaign analysis shows top performers
- [ ] Recommendations include paid media optimization
- [ ] Report structure matches sample PDF layout

### Testing
- [ ] `npm run test:paid-media` completes successfully
- [ ] SSE streaming works with all 4 sources
- [ ] Error handling gracefully degrades if one source fails

---

## 📁 Files Checklist

### New Files
- [ ] `src/google-ads-mcp/src/index.ts`
- [ ] `src/google-ads-mcp/src/types.ts`
- [ ] `src/google-ads-mcp/src/services/google-ads.service.ts`
- [ ] `src/google-ads-mcp/src/tools/index.ts`
- [ ] `src/google-ads-mcp/src/tools/get-campaigns.ts`
- [ ] `src/google-ads-mcp/src/tools/get-performance.ts`
- [ ] `src/google-ads-mcp/package.json`
- [ ] `src/google-ads-mcp/tsconfig.json`
- [ ] `src/google-ads-mcp/Dockerfile`
- [ ] `src/google-ads-mcp/.env.template`
- [ ] `src/google-ads-mcp/README.md`
- [ ] `src/dapr-mcp/src/tools/submit-google-ads-data.ts`
- [ ] `scripts/src/test-paid-media-report.ts`

### Modified Files
- [ ] `src/cc-svc/src/agents/index.ts`
- [ ] `src/cc-svc/src/prompts/brand-insights.prompt.ts`
- [ ] `src/cc-svc/src/services/brand-insights.service.ts`
- [ ] `src/cc-svc/src/schemas/brand-insights.schema.ts`
- [ ] `src/cc-svc/src/config/env.ts`
- [ ] `src/cc-svc/.env.template`
- [ ] `src/cc-svc/.env`
- [ ] `src/dapr-mcp/src/tools/index.ts`
- [ ] `scripts/package.json`
- [ ] `package.json` (root)
- [ ] `Makefile`
- [ ] `docker-compose.yml`
- [ ] `.claude/rules/marketing-analytics.md`

---

## 🔗 Key References

### MCP Server Patterns
- `src/meta-ads-mcp/` - Similar advertising MCP (primary reference)
- `src/ga4-mcp/` - Analytics MCP pattern
- `src/github-issues-mcp/` - Bootstrap pattern (Effect.gen)
- `.claude/rules/mcp-server.md` - MCP server standards

### Agent Integration
- `src/cc-svc/src/agents/index.ts` - Agent creation patterns
- `src/cc-svc/src/prompts/brand-insights.prompt.ts` - Prompt templates
- `src/cc-svc/src/services/brand-insights.service.ts` - Service orchestration

### Data Persistence
- `src/dapr-mcp/src/tools/submit-meta-data.ts` - Data submission pattern
- `src/dapr-mcp/src/tools/submit-ga4-data.ts` - Schema reference

---

## 📝 Implementation Notes

### Authentication Complexity
Google Ads OAuth 2.0 setup is more complex than Meta:
1. Requires separate Developer Token (application process)
2. Test access vs Basic access (quota differences)
3. Refresh token generation via OAuth Playground
4. Customer ID format (10 digits, no dashes)

### Quota Management
- Basic access: 15,000 operations/day
- Each GAQL query = 1 operation
- Implement caching strategy:
  - Campaign metadata: 1 hour TTL
  - Performance data: 15 min - 24 hours (based on date range)

### ROAS Consistency
Ensure ROAS calculation is consistent across platforms:
- Google Ads: `conversions_value / cost`
- Meta Ads: `action_value / spend`
- Formula: `revenue / spend` (standardized)

### Cross-Platform Attribution
GA4 conversions may not match paid platform conversions due to:
- Different attribution windows
- Cookie tracking differences
- Conversion tracking setup variations

Document this in report as "Attribution Note"

### Markdown Report Output
The orchestrator already has markdown MCP access. Reports will be saved to:
- Directory: `docs/reports/generated/`
- Filename: `brand-insights-{startDate}-{endDate}.md`
- Manual comparison with PDF sample required

---

## 🚀 Next Steps

1. **Scaffold Google Ads MCP** using @mcp-server skill
2. **Implement types.ts** with errors and config
3. **Build GoogleAdsClient Service** with GAQL queries
4. **Create tools** (get-campaigns, get-performance)
5. **Test authentication** with real Google Ads account
6. **Integrate with Dapr** (submit tool)
7. **Add to cc-svc** (agent, prompts, service)
8. **Create test script** and validate end-to-end
9. **Document** and update infrastructure files

---

## ⚠️ Risks & Mitigation

### Risk 1: OAuth Setup Complexity
**Impact:** High - Blocks all development
**Mitigation:**
- Document step-by-step OAuth flow in README
- Provide troubleshooting guide
- Consider test mode with mock data initially

### Risk 2: API Quota Limits
**Impact:** Medium - Could limit production usage
**Mitigation:**
- Implement aggressive caching
- Monitor quota usage via logging
- Apply for Standard access if needed

### Risk 3: GAQL Query Complexity
**Impact:** Medium - Complex queries may be slow/expensive
**Mitigation:**
- Start with simple queries (campaign-level only)
- Optimize field selection (only request needed fields)
- Test with large accounts to validate performance

### Risk 4: Cross-Platform Data Discrepancies
**Impact:** Low - May confuse users
**Mitigation:**
- Document attribution differences in report
- Provide data reconciliation guidance
- Focus on trends rather than exact matches

---

## 📊 Progress Tracking

**Overall Progress:** 0% (0/17 tasks completed)

### Phase 1: Google Ads MCP (0/8)
- [ ] Directory structure
- [ ] types.ts
- [ ] GoogleAdsClient Service
- [ ] get-campaigns tool
- [ ] get-performance tool
- [ ] index.ts bootstrap
- [ ] Config files
- [ ] README.md

### Phase 2: Dapr Integration (0/2)
- [ ] submit_google_ads_data tool
- [ ] Tool registration

### Phase 3: Brand Insights Integration (0/6)
- [ ] Google Ads analyst agent
- [ ] Google Ads prompts
- [ ] Service updates
- [ ] Schema updates
- [ ] Orchestrator updates
- [ ] Configuration

### Phase 4: Testing (0/2)
- [ ] Test script
- [ ] Package scripts

### Phase 5: Documentation (0/4)
- [ ] Marketing analytics rules
- [ ] Workspace config
- [ ] Docker compose
- [ ] Google Ads MCP README

---

**Last Updated:** 2026-03-30
**Document Version:** 1.0
**Status:** 🚧 Ready to begin implementation
