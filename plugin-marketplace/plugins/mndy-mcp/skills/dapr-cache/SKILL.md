---
name: dapr-cache
description: Use the mndy Dapr MCP server (mndy-dapr) to read and write the analytics state cache (GA4/Shopify/Meta data), read and persist brand insights reports, and invoke Dapr actor methods. Use when the user wants to cache or retrieve analytics data, store/read a brand report, or call a Dapr actor through the mndy stack.
---

# Dapr Cache MCP (`mndy-dapr`)

Reads and writes the Dapr state store (cached analytics, brand reports) and invokes Dapr
actors. Server runs on **port 3006** (`http://localhost:3006/mcp`).

## Prerequisites

- **Needs a Dapr sidecar and infrastructure**, unlike the other mndy MCP servers.
  1. Start infra: `make docker-compose-infra` (Dapr, MongoDB, RabbitMQ, Zipkin)
  2. Start the server + sidecar: `make run-dapr-mcp`
- Sidecar connection (in `src/dapr-mcp/.env`, defaults shown): `DAPR_HOST=localhost`,
  `DAPR_HTTP_PORT=3500`, `DAPR_GRPC_PORT=50001`
- Verify: `curl -s http://localhost:3006/health`

## State-key conventions

Tools key data by convention — follow these formats:
- Cached source data: `{source}-{brandId}-{startDate}-{endDate}`
  (e.g. `ga4-default-2025-03-01-2025-03-07`)
- Brand report: `brand-{brandId}` (e.g. `brand-default`)

## Read tools

### `get_cached_data` — read cached source data (TTL-validated)
| Param | Type | Required | Notes |
|---|---|---|---|
| source | enum | **yes** | `ga4`\|`shopify`\|`meta` |
| stateKey | string | **yes** | `{source}-{brandId}-{startDate}-{endDate}` |

### `get_brand_report` — read a persisted brand report (no TTL)
| Param | Type | Required | Notes |
|---|---|---|---|
| stateKey | string | **yes** | `brand-{brandId}` |

## Write tools

### `submit_ga4_data` / `submit_shopify_data` / `submit_meta_data`
Cache a source's analytics data. TTL is derived automatically from the date range. Each takes:
- `stateKey` (string, **required**) — `{source}-{brandId}-{startDate}-{endDate}`
- `data` (object, **required**) — the analytics payload, which always includes
  `dateRange: { startDate, endDate }` (YYYY-MM-DD) plus source-specific fields:
  - **GA4:** `sessions`, `activeUsers`, `newUsers`, `conversions`, `conversionRate`,
    `bounceRate`, `avgSessionDuration`, `topChannels[]` (`channel`, `sessions`,
    `conversions`), `topPages[]` (`page`, `views`), optional `observations[]`.
  - **Shopify:** `totalRevenue`, `totalOrders`, `averageOrderValue`, `totalItemsSold`,
    `newCustomers`, `returningCustomers`, `topProducts[]` (`product`, `quantity`,
    `revenue`), optional `observations[]`.
  - **Meta:** `totalSpend`, `totalImpressions`, `totalClicks`, `totalConversions`,
    `averageCPA`, `averageROAS`, `averageCTR`, `topCampaigns[]` (`campaignName`, `spend`,
    `conversions`, `roas`), optional `observations[]`.

### `submit_brand_report` — persist a synthesized brand report (no TTL, history-tracked)
- `stateKey` (string, **required**) — `brand-{brandId}`
- `report` (object, **required**) with:
  - `brand.analyzedAt` (ISO timestamp)
  - `summary.overallHealthScore` (0–100), `summary.keyMetrics` (`revenue`, `sessions`,
    `conversions`, `roas` — each number or `null`), `summary.briefDescription`
  - `ga4Analysis`, `shopifyAnalysis`, `metaAnalysis` (each object or `null`)
  - `insights.wins[]`, `insights.concerns[]`, `insights.recommendations[]`
    (`category`, `suggestion`, `priority: low|medium|high`)
  - `metadata.sources[]`, `metadata.dateRange` (`startDate`, `endDate`),
    `metadata.processingTimeMs`

## Actor tools

### `dapr_actor_get_state` — invoke an actor method to read
| Param | Type | Required | Notes |
|---|---|---|---|
| actorType | string | **yes** | e.g. `BrandInsightsActor` (must be registered) |
| actorId | string | **yes** | e.g. `brand-acme-2025-03-08` |
| method | string | **yes** | e.g. `GetReport`, `GetState` |
| payload | any | no | optional JSON args for the method |

### `dapr_actor_save_state` — invoke an actor method to save
Same as above, but `payload` (the data to save) is **required**, and `method` is a
save method (e.g. `SaveReport`, `SetState`).

## Examples

Read cached GA4 data:
```json
{ "source": "ga4", "stateKey": "ga4-default-2025-03-01-2025-03-07" }
```

Read a brand report:
```json
{ "stateKey": "brand-default" }
```

Invoke an actor to fetch a report:
```json
{ "actorType": "BrandInsightsActor", "actorId": "brand-default", "method": "GetReport" }
```

## Tips

- If tools hang or error on connection, the Dapr sidecar or infra is likely down — confirm
  `make docker-compose-infra` is up and `make run-dapr-mcp` logged a successful sidecar start.
- Keep `stateKey` formats consistent between the `submit_*` (write) and `get_*` (read) calls,
  or reads will miss.
