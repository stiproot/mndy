---
name: shopify
description: Use the mndy Shopify MCP server (mndy-shopify) to fetch store orders and computed analytics (revenue, order counts, AOV, customer metrics) from the Shopify Admin API. Use when the user wants Shopify store sales or order data through the mndy stack.
---

# Shopify MCP (`mndy-shopify`)

Reads orders and computes store analytics from the Shopify Admin API. Server runs on
**port 3005** (`http://localhost:3005/mcp`).

## Prerequisites

- Start the server from the mndy repo root: `make run-shopify-mcp` (or `make run-analytics-mcps`
  to start GA4, Meta Ads, and Shopify together). **No infrastructure needed** — this is a
  standalone HTTP process; no Dapr, no docker-compose.
- Config in `src/shopify-mcp/.env` (copy from `.env.template`):
  - `SHOPIFY_CLIENT_ID` — **required**
  - `SHOPIFY_CLIENT_SECRET` — **required**
  - `SHOPIFY_STORE_URL` — **required**, `your-store.myshopify.com` format
  - `SHOPIFY_API_VERSION` — optional (default `2024-10`)
  - Scopes needed: `read_orders`, `read_analytics`
- Verify: `curl -s http://localhost:3005/health`

## Tools

### `shopify_get_analytics` — summary over a date range
Computes revenue, order counts, AOV, and customer metrics.

| Param | Type | Required | Notes |
|---|---|---|---|
| start_date | string | **yes** | `YYYY-MM-DD` |
| end_date | string | **yes** | `YYYY-MM-DD` |

### `shopify_get_orders` — list orders
| Param | Type | Required | Notes |
|---|---|---|---|
| limit | number | no | 1–250 (default 50) |
| status | enum | no | `open`\|`closed`\|`cancelled`\|`any` |
| financial_status | enum | no | `pending`\|`authorized`\|`partially_paid`\|`paid`\|`partially_refunded`\|`refunded`\|`voided`\|`any` |
| fulfillment_status | enum | no | `shipped`\|`partial`\|`unshipped`\|`unfulfilled`\|`any` |
| created_at_min / created_at_max | string | no | ISO 8601 |
| updated_at_min / updated_at_max | string | no | ISO 8601 |
| since_id | string | no | pagination — orders after this ID |

## Examples

Store analytics for March 2025:
```json
{ "start_date": "2025-03-01", "end_date": "2025-03-31" }
```

Recent paid, unfulfilled orders:
```json
{ "status": "open", "financial_status": "paid", "fulfillment_status": "unfulfilled", "limit": 100 }
```

Page through orders created after a given time:
```json
{ "created_at_min": "2025-03-01T00:00:00Z", "limit": 250, "since_id": "450789469" }
```

## Brand selection (single store per server)

Unlike GA4 and Meta, the Shopify tools have **no store parameter** — they always hit the
store the running `mndy-shopify` server is configured for (`SHOPIFY_STORE_URL` + OAuth
credentials in its `.env`). So per-session brand switching does **not** apply to Shopify.

If the user has selected a brand (see the `brands` skill) whose `shopifyStore` differs from
the running server's store, say so and treat Shopify data as unavailable for that brand this
session — do not return another store's numbers as if they were the selected brand's. To
analyse a different store, repoint `src/shopify-mcp/.env` and restart the server, or run one
shopify-mcp per store on separate ports.

## Tips

- Credentials are validated at call time (OAuth token exchange from client ID/secret). If a
  tool returns an auth error, check the three required env vars and the store URL format.
- For large windows, page with `limit` + `since_id` rather than requesting everything at once.
