---
name: ga4-analytics
description: Use the mndy GA4 MCP server (mndy-ga4) to run Google Analytics 4 reports — sessions, users, conversions, revenue, channels, pages — with dimensions, metrics, date ranges, and filters. Use when the user wants website/traffic analytics from Google Analytics 4 through the mndy stack.
---

# GA4 Analytics MCP (`mndy-ga4`)

Runs Google Analytics 4 reports. Server runs on **port 3003** (`http://localhost:3003/mcp`).

## Prerequisites

- Start the server from the mndy repo root: `make run-ga4-mcp` (or `make run-analytics-mcps`
  to start GA4, Meta Ads, and Shopify together). **No infrastructure needed** — this is a
  standalone HTTP process; no Dapr, no docker-compose.
- Config in `src/ga4-mcp/.env` (copy from `.env.template`):
  - `GA4_PROPERTY_ID` — **required**, numeric property ID from GA4 Admin
  - `GOOGLE_APPLICATION_CREDENTIALS` — path to a service-account JSON key with the
    `analytics.readonly` scope, granted access to the property
- Verify: `curl -s http://localhost:3003/health`

## Tool: `ga4_run_report`

Build a report from date ranges, metrics, and (optionally) dimensions and a filter.

| Param | Type | Required | Notes |
|---|---|---|---|
| propertyId | string | no | overrides the server's default `GA4_PROPERTY_ID` |
| dateRanges | object[] | **yes** | 1–4 ranges, each `{ startDate, endDate }` |
| metrics | object[] | **yes** | ≥1, each `{ name }` |
| dimensions | object[] | no | each `{ name }` |
| dimensionFilter | object | no | see below |
| limit | number | no | rows, 1–100000 (default 10000) |
| offset | number | no | ≥0, for pagination |

**Dates** accept `YYYY-MM-DD` or relative tokens: `today`, `yesterday`, `7daysAgo`,
`30daysAgo`.

**Common dimensions:** `date`, `dateHour`, `sessionSource`, `sessionMedium`,
`sessionCampaignName`, `sessionDefaultChannelGroup`, `country`, `city`, `deviceCategory`,
`browser`, `operatingSystem`, `landingPage`, `pagePath`, `pageTitle`, `eventName`.

**Common metrics:** `sessions`, `activeUsers`, `newUsers`, `totalUsers`, `screenPageViews`,
`screenPageViewsPerSession`, `averageSessionDuration`, `bounceRate`, `engagementRate`,
`engagedSessions`, `conversions`, `totalRevenue`, `purchaseRevenue`, `ecommercePurchases`,
`addToCarts`, `checkouts`, `itemsViewed`.

**`dimensionFilter`** shape — `{ fieldName, stringFilter?, inListFilter? }`:
- `stringFilter`: `{ matchType, value, caseSensitive? }` where `matchType` is one of
  `EXACT`, `BEGINS_WITH`, `ENDS_WITH`, `CONTAINS`, `FULL_REGEXP`, `PARTIAL_REGEXP`.
- `inListFilter`: `{ values: string[], caseSensitive? }`.

## Examples

Last 7 days of sessions and conversions by channel:
```json
{
  "dateRanges": [{ "startDate": "7daysAgo", "endDate": "today" }],
  "dimensions": [{ "name": "sessionDefaultChannelGroup" }],
  "metrics": [{ "name": "sessions" }, { "name": "conversions" }]
}
```

Top pages for organic search only, March 2025:
```json
{
  "dateRanges": [{ "startDate": "2025-03-01", "endDate": "2025-03-31" }],
  "dimensions": [{ "name": "pagePath" }],
  "metrics": [{ "name": "screenPageViews" }],
  "dimensionFilter": {
    "fieldName": "sessionDefaultChannelGroup",
    "stringFilter": { "matchType": "EXACT", "value": "Organic Search" }
  },
  "limit": 10
}
```

## Tips

- Always send at least one date range and one metric — both are required.
- If the report fails auth, confirm the service account has been granted access to the
  GA4 property and the JSON key path is correct.
