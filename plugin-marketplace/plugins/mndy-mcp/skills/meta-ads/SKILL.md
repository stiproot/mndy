---
name: meta-ads
description: Use the mndy Meta Ads MCP server (mndy-meta-ads) to fetch Facebook/Instagram advertising campaigns and performance insights (spend, impressions, clicks, CTR, CPC, ROAS) from the Meta Marketing API. Use when the user wants Meta/Facebook/Instagram ad data through the mndy stack.
---

# Meta Ads MCP (`mndy-meta-ads`)

Reads campaigns and insights from the Meta (Facebook/Instagram) Marketing API. Server runs
on **port 3004** (`http://localhost:3004/mcp`).

## Prerequisites

- Start the server from the mndy repo root: `make run-meta-ads-mcp` (or `make run-analytics-mcps`
  to start GA4, Meta Ads, and Shopify together). **No infrastructure needed** — this is a
  standalone HTTP process; no Dapr, no docker-compose.
- Config in `src/meta-ads-mcp/.env` (copy from `.env.template`):
  - `META_ACCESS_TOKEN` — **required** (System User token recommended). Scopes: `ads_read`,
    `read_insights`.
  - `META_AD_ACCOUNT_ID` — **required**, with the `act_` prefix (e.g. `act_123456789`)
  - `META_APP_ID`, `META_APP_SECRET` — optional, for token management
- Verify: `curl -s http://localhost:3004/health`

## Tools

### `meta_get_campaigns` — list campaigns
| Param | Type | Required | Notes |
|---|---|---|---|
| adAccountId | string | no | overrides default `META_AD_ACCOUNT_ID` |
| limit | number | no | 1–500 (default 100) |

### `meta_get_insights` — performance metrics
| Param | Type | Required | Notes |
|---|---|---|---|
| adAccountId | string | no | overrides default account |
| level | enum | no | `account`\|`campaign`\|`adset`\|`ad` (default `campaign`) |
| datePreset | enum | no | default `last_7d`; see list below |
| timeRange | object | no | `{ since, until }` in `YYYY-MM-DD`; use **instead of** `datePreset` |
| campaignIds | string[] | no | filter to specific campaign IDs |
| fields | string[] | no | override the default field set |
| limit | number | no | 1–500 (default 50) |

**`datePreset` values:** `today`, `yesterday`, `this_month`, `last_month`, `this_quarter`,
`maximum`, `last_3d`, `last_7d`, `last_14d`, `last_28d`, `last_30d`, `last_90d`,
`last_week_mon_sun`, `last_week_sun_sat`, `last_quarter`, `last_year`,
`this_week_mon_today`, `this_week_sun_today`, `this_year`.

**Default `fields`:** `campaign_id`, `campaign_name`, `adset_id`, `adset_name`, `spend`,
`impressions`, `clicks`, `reach`, `ctr`, `cpc`, `cpm`, `frequency`, `actions`,
`action_values`, `purchase_roas`.

## Examples

Campaign-level insights for the last 30 days:
```json
{ "level": "campaign", "datePreset": "last_30d" }
```

Ad-level insights for a custom range, specific campaigns:
```json
{
  "level": "ad",
  "timeRange": { "since": "2025-03-01", "until": "2025-03-31" },
  "campaignIds": ["23848...","23849..."]
}
```

## Tips

- Provide `timeRange` OR `datePreset`, not both — `timeRange` takes precedence when set.
- Rate limits: the server retries transient 429/5xx with backoff. If you still get a rate
  error, reduce `limit` or narrow the date range.
