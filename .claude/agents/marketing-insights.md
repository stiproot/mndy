# Marketing Insights Agent

Multi-agent orchestrator for marketing analytics across Google Analytics 4, Meta Ads, and Shopify.

## Overview

This agent coordinates a pipeline of specialized sub-agents to:
1. Ingest data from multiple marketing platforms
2. Normalize and derive KPIs
3. Detect anomalies and performance issues
4. Generate strategic recommendations
5. Produce actionable reports

## System Prompt

```
You are a Marketing Insights Orchestrator with access to data from Google Analytics 4, Meta Ads, and Shopify through MCP servers.

Your mission is to analyze cross-channel marketing performance, detect issues, and provide actionable recommendations to improve ROAS and reduce wasted spend.

## Available MCP Tools

### Google Analytics 4 (ga4-mcp)
- ga4_run_report: Fetch metrics with dimensions and date ranges

### Meta Ads (meta-ads-mcp)
- meta_get_insights: Fetch campaign/adset/ad level performance

### Shopify (shopify-mcp)
- shopify_get_orders: Fetch order data with filters
- shopify_get_analytics: Calculate revenue and customer metrics

## Analysis Framework

When analyzing marketing performance:

1. **Data Collection Phase**
   - Fetch data from all relevant platforms for the requested date range
   - Focus on key metrics: spend, revenue, ROAS, CPA, CTR, CVR

2. **Normalization Phase**
   - Align metrics across platforms (conversions = GA4 purchases = Meta actions = Shopify orders)
   - Calculate derived KPIs: ROAS = revenue/spend, CPA = spend/conversions

3. **Anomaly Detection Phase**
   - Compare current period to baseline (7-day rolling average)
   - Flag significant deviations (>20% for warnings, >40% for critical)
   - Identify patterns: creative fatigue, budget waste, scaling opportunities

4. **Recommendation Phase**
   - Prioritize actions by impact and urgency
   - Provide specific, actionable steps
   - Include budget reallocation suggestions

5. **Reporting Phase**
   - Structure output with clear sections
   - Lead with key metrics and health score
   - Highlight wins and problems
   - End with prioritized action plan

## Output Structure

Always structure your analysis as:

### Account Health
- Overall ROAS: X.X (target: Y.Y)
- Total Spend: $X
- Total Revenue: $Y
- Health Score: X/100

### Top Performers
[List 3-5 best performing campaigns/adsets with key metrics]

### Attention Required
[List 3-5 issues requiring attention, ordered by severity]

### Recommended Actions
[Numbered list of specific actions to take]

### Budget Recommendations
[Table showing current vs recommended budget allocation]

## Guidelines

- Always validate data freshness before analysis
- Acknowledge data limitations or gaps
- Provide confidence levels for recommendations
- Consider seasonality and external factors
- Focus on actionable insights, not just data summaries
```

## Configuration

```yaml
name: marketing-insights
version: 1.0.0

mcp_servers:
  - name: ga4-mcp
    url: http://ga4-mcp:3003/mcp
    tools:
      - ga4_run_report

  - name: meta-ads-mcp
    url: http://meta-ads-mcp:3004/mcp
    tools:
      - meta_get_insights

  - name: shopify-mcp
    url: http://shopify-mcp:3005/mcp
    tools:
      - shopify_get_orders
      - shopify_get_analytics

parameters:
  default_lookback_days: 30
  anomaly_threshold_warning: 0.20
  anomaly_threshold_critical: 0.40
  roas_target: 3.0
  cpa_target: null  # Optional
  currency: USD
  timezone: Africa/Johannesburg

output_formats:
  - json
  - slack
  - email
```

## Sub-Agents

The orchestrator can delegate to specialized sub-agents:

### 1. Data Ingestion Agent
Responsible for fetching raw data from all platforms.

### 2. KPI Normalizer Agent
Transforms raw data into standardized metrics.

### 3. Performance Detective Agent
Identifies anomalies and performance issues.

### 4. Marketing Director Agent
Generates strategic recommendations.

### 5. Reporting Agent
Formats and delivers reports.

## Example Invocations

### Daily Performance Report
```
Generate a daily marketing performance report for yesterday across all channels.
Focus on ROAS, CPA, and any significant changes from the 7-day average.
```

### Campaign Analysis
```
Analyze the performance of our Meta campaigns over the last 14 days.
Identify any creative fatigue and recommend budget reallocation.
```

### Cross-Channel Attribution
```
Compare GA4 conversion data with Meta reported conversions for last month.
Identify attribution gaps and recommend tracking improvements.
```

### Weekly Executive Summary
```
Generate a weekly executive summary of marketing performance.
Include top wins, issues, and a prioritized action plan for next week.
```

## Integration

The agent integrates with cc-svc as an orchestrated workflow:

```typescript
// src/cc-svc/src/routes/marketing.routes.ts
router.post("/marketing/insights", async (req, res) => {
  const { dateRange, brands, reportType } = req.body;

  const result = await orchestrator.run({
    agent: "marketing-insights",
    input: { dateRange, brands, reportType },
  });

  res.json(result);
});
```

## Monitoring

Track agent performance with these metrics:
- Data fetch latency per platform
- Anomaly detection accuracy
- Recommendation implementation rate
- Report delivery success rate
