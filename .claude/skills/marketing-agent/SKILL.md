# Marketing Analytics Agent Skill

Generate marketing analytics agent components following the multi-agent pipeline pattern.

## When to Use

Use this skill when:
- Creating a new agent for the marketing analytics pipeline
- Adding MCP server integrations for marketing platforms
- Building data ingestion or transformation logic
- Implementing anomaly detection rules

## Agent Pipeline Overview

```
Data Ingestion → KPI Normalizer → Performance Detective → Marketing Director → Reporting
```

## Agent Template

When creating a new marketing analytics agent, use this structure:

### 1. Agent Definition File

Create in `src/cc-svc/src/agents/marketing/`:

```typescript
// {agent-name}.agent.ts
import { Effect } from "effect";
import { Schema } from "effect";
import { McpClientService } from "../../services/mcp-client.service.js";

/**
 * Input schema for the agent
 */
export const {AgentName}InputSchema = Schema.Struct({
  // Define input fields
});

export type {AgentName}Input = Schema.Schema.Type<typeof {AgentName}InputSchema>;

/**
 * Output schema for the agent
 */
export const {AgentName}OutputSchema = Schema.Struct({
  // Define output fields
});

export type {AgentName}Output = Schema.Schema.Type<typeof {AgentName}OutputSchema>;

/**
 * Agent system prompt
 */
export const {AGENT_NAME}_SYSTEM_PROMPT = `
You are the {Agent Name} agent in a marketing analytics pipeline.

Your role:
- [Describe primary responsibilities]
- [List expected inputs]
- [List expected outputs]

Available tools:
- ga4_run_report: Fetch GA4 metrics
- meta_get_insights: Fetch Meta ad performance
- shopify_get_orders: Fetch Shopify orders
- shopify_get_analytics: Calculate Shopify analytics

Guidelines:
- [Specific guidelines for this agent]
`;

/**
 * Execute the agent
 */
export const execute{AgentName} = (input: {AgentName}Input) =>
  Effect.gen(function* () {
    const mcpClient = yield* McpClientService;

    // Agent implementation
    // 1. Gather data using MCP tools
    // 2. Process and transform
    // 3. Return structured output

    return {} as {AgentName}Output;
  });
```

### 2. Agent Types

Each agent must define clear input/output schemas:

```typescript
// Data Ingestion Agent
interface DataIngestionInput {
  brands: string[];
  dateRange: { start: string; end: string };
  platforms: ("ga4" | "meta" | "shopify")[];
}

interface DataIngestionOutput {
  ga4Data: GA4DailyMetrics[];
  metaData: MetaDailyMetrics[];
  shopifyData: ShopifyDailyMetrics[];
  fetchedAt: string;
}

// KPI Normalizer Agent
interface NormalizerInput {
  rawData: DataIngestionOutput;
  config: { currency: string; timezone: string };
}

interface NormalizerOutput {
  unifiedMetrics: UnifiedDailyMetric[];
  derivedKpis: DerivedKpis;
}

// Performance Detective Agent
interface DetectiveInput {
  metrics: UnifiedDailyMetric[];
  thresholds: AnomalyThresholds;
  lookbackDays: number;
}

interface DetectiveOutput {
  anomalies: Anomaly[];
  healthScore: number;
  topIssues: Issue[];
}

// Marketing Director Agent
interface DirectorInput {
  metrics: UnifiedDailyMetric[];
  anomalies: Anomaly[];
  targets: { roasTarget: number; cpaTarget?: number };
}

interface DirectorOutput {
  recommendations: Recommendation[];
  budgetMoves: BudgetAllocation[];
  urgentActions: UrgentAction[];
}

// Reporting Agent
interface ReportingInput {
  metrics: UnifiedDailyMetric[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  format: "json" | "slack" | "email";
}

interface ReportingOutput {
  report: string | object;
  deliveryStatus: "pending" | "sent" | "failed";
}
```

## MCP Tool Usage

### GA4 Reports
```typescript
const ga4Report = yield* mcpClient.callTool("ga4_run_report", {
  property_id: "123456789",
  start_date: "2024-01-01",
  end_date: "2024-01-31",
  metrics: ["sessions", "conversions", "purchaseRevenue"],
  dimensions: ["date", "sourceMedium"],
});
```

### Meta Insights
```typescript
const metaInsights = yield* mcpClient.callTool("meta_get_insights", {
  level: "campaign",
  date_preset: "last_30d",
  fields: ["spend", "impressions", "clicks", "actions", "action_values"],
});
```

### Shopify Analytics
```typescript
const shopifyAnalytics = yield* mcpClient.callTool("shopify_get_analytics", {
  start_date: "2024-01-01",
  end_date: "2024-01-31",
});
```

## Anomaly Detection Rules

Implement detection logic for common issues:

```typescript
const detectCreativeFatigue = (metrics: MetricsSeries) => {
  const recentAvg = average(metrics.slice(-7));
  const priorAvg = average(metrics.slice(-14, -7));

  const ctrDrop = (recentAvg.ctr - priorAvg.ctr) / priorAvg.ctr;
  const cpcIncrease = (recentAvg.cpc - priorAvg.cpc) / priorAvg.cpc;
  const highFrequency = recentAvg.frequency > 3.5;

  if (ctrDrop < -0.15 && cpcIncrease > 0.1 && highFrequency) {
    return {
      type: "creative_fatigue",
      severity: recentAvg.frequency > 5 ? "critical" : "warning",
      metrics: { ctrDrop, cpcIncrease, frequency: recentAvg.frequency },
    };
  }
  return null;
};
```

## Output Format

Use the standard report structure defined in the rules file. Format appropriately for each delivery channel:

- **JSON**: Structured data for API consumers
- **Slack**: Markdown with emojis for visual hierarchy
- **Email**: HTML with tables and formatting
