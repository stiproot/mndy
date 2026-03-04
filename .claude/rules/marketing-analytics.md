# Marketing Analytics Rules

Rules for developing and maintaining the marketing analytics multi-agent system.

## MCP Server Patterns

### Tool Naming
- Use platform prefix: `ga4_`, `meta_`, `shopify_`
- Use snake_case for tool names
- Examples: `ga4_run_report`, `meta_get_insights`, `shopify_get_orders`

### Error Handling
- Define tagged errors for each platform:
  - `GA4ApiError`, `GA4QuotaError`
  - `MetaApiError`, `MetaRateLimitError`
  - `ShopifyApiError`, `ShopifyRateLimitError`
- Always include `TimeoutError` for network operations
- Use `catchTags` for exhaustive error handling

### Resilience
- All API calls must have timeouts (60s default)
- Implement exponential backoff with jitter for retries
- Only retry transient errors (429, 5xx)
- Respect platform rate limits:
  - GA4: Quota-based, check `quotaExceeded` errors
  - Meta: Rate limiting with retry headers
  - Shopify: Leaky bucket (40 req/s standard, 80 for Plus)

## Data Normalization

### Metric Naming
Standard metric names across all platforms:

| Standard | GA4 | Meta | Shopify |
|----------|-----|------|---------|
| impressions | impressions | impressions | - |
| clicks | clicks | clicks | - |
| conversions | conversions | actions | orders |
| revenue | purchaseRevenue | action_value | total_price |
| spend | - | spend | - |
| sessions | sessions | - | - |

### Currency
- Always normalize to store's base currency
- Store original currency for reference
- Use ISO 4217 codes (USD, EUR, ZAR)

### Timezone
- Default: `Africa/Johannesburg` (configurable)
- Store all dates in UTC with timezone offset
- Use ISO 8601 format for date strings

## Analytics Calculations

### Core KPIs
```typescript
// Cost per acquisition
const cpa = spend / conversions;

// Return on ad spend
const roas = revenue / spend;

// Click-through rate
const ctr = (clicks / impressions) * 100;

// Conversion rate
const cvr = (conversions / clicks) * 100;

// Average order value
const aov = revenue / orders;
```

### Anomaly Detection Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| ROAS drop | -20% vs 7-day avg | -40% |
| CPA spike | +30% vs 7-day avg | +50% |
| CTR drop | -25% vs 7-day avg | -40% |
| Creative fatigue | CTR ↓ + CPC ↑ + Freq > 3.5 | Freq > 5 |

## Agent Patterns

### Effect-TS Services
- Use `Effect.Service` for all platform clients
- Inject configuration via `Config` module
- Never use `process.env` directly
- Use spans for observability: `Effect.withSpan()`

### MCP Tool Registration
```typescript
// Correct pattern
export function registerTool(server: McpServer): void {
  server.registerTool(
    "tool_name",
    { title, description, inputSchema },
    (args) => Effect.runPromise(
      toolEffect(args).pipe(Effect.provide(Service.Default))
    )
  );
}
```

### Error Response Format
```typescript
// Error responses from tools
{
  content: [{
    type: "text",
    text: `${Platform} API error: ${error.message}${code ? ` (code: ${code})` : ""}`
  }],
  isError: true
}
```

## Report Generation

### Daily Report Structure
1. **Account Health** - Overall ROAS, spend, revenue
2. **Top Wins** - Best performing campaigns (3-5)
3. **Top Problems** - Underperforming or anomalies (3-5)
4. **Action Plan** - Recommended changes
5. **Budget Moves** - Reallocation suggestions

### Delivery Channels
- JSON API: Synchronous, for real-time dashboards
- Slack: Scheduled via webhook, markdown formatted
- Email: Scheduled via SMTP, HTML formatted

## Security

### Credential Management
- Store tokens in environment variables
- Use `secrets/` directory for JSON key files
- Never commit `.env` files
- Rotate tokens before expiration:
  - Meta System User tokens: Never expire
  - Shopify Admin tokens: Never expire
  - GA4 Service Account: Key rotation recommended annually

### API Scopes (Minimum Required)
- GA4: `analytics.readonly`
- Meta: `ads_read`, `read_insights`
- Shopify: `read_orders`, `read_analytics`
