---
name: google-ads
description: Query Google Ads campaigns and paid-search/display performance (spend, impressions, clicks, conversions, ROAS, CPA, CTR) through the mndy Google Ads MCP server. Use when the user asks about Google Ads, paid search, PPC, AdWords, search campaigns, keywords, quality score, or impression share — or wants paid media compared across Google and Meta.
---

# Google Ads

Tools for reading Google Ads performance. Server runs on **port 3010**
(`http://localhost:3010/mcp`). Start it with `make run-google-ads-mcp`, or alongside the
other analytics servers with `make run-analytics-mcps`.

**No infrastructure required** — a plain HTTP process needing only its own `.env`.

- Verify: `curl -s http://localhost:3010/health`

## Tools

### `google_ads_get_performance`

Performance metrics with derived KPIs.

| Parameter | Type | Notes |
| --- | --- | --- |
| `customerId` | string, optional | 10 digits; dashes stripped. **Pass this to target a brand.** Defaults to the server's `GOOGLE_ADS_CUSTOMER_ID`. |
| `level` | `account` \| `campaign` \| `ad_group` \| `keyword` | Default `campaign`. |
| `datePreset` | enum | `TODAY`, `YESTERDAY`, `LAST_7_DAYS`, `LAST_30_DAYS`, `LAST_90_DAYS`, `THIS_MONTH`, `LAST_MONTH`, `THIS_YEAR`, `LAST_YEAR`. Default `LAST_7_DAYS`. |
| `timeRange` | `{since, until}` | `YYYY-MM-DD`. Takes precedence over `datePreset`. |
| `campaignIds` | string[], optional | Numeric IDs only; non-numeric entries are dropped. |
| `includeQualityMetrics` | boolean | Quality score (keyword level) / impression share (campaign, ad group). |
| `limit` | number | 1–1000, default 100. |

Returns `totals` (spend, impressions, clicks, conversions, revenue) and `kpis` (roas, cpa,
ctr, cvr, cpc, cpm), plus the raw rows.

**Spend is in the account's currency.** The API reports cost in *micros* (millionths); the
server converts it. Do not divide by 1,000,000 again.

**A KPI may be `null`.** That means "not computable" — a missing input or a zero
denominator — not zero. Report it as unavailable rather than as 0.00.

### `google_ads_get_campaigns`

Lists campaigns with status, advertising channel type and bidding strategy.

| Parameter | Type | Notes |
| --- | --- | --- |
| `customerId` | string, optional | As above. |
| `status` | array of `ENABLED` \| `PAUSED` \| `REMOVED` | Default `ENABLED, PAUSED`. |
| `limit` | number | 1–500, default 100. |

## Targeting a brand

Google Ads follows the same per-call override rule as GA4 and Meta: pass the brand's
`googleAdsCustomerId` as `customerId` on every call. One running server serves every
account its credentials can reach — see the `brands` skill.

## Credentials

Google Ads needs more than the other platforms. All of it goes in
`apps/google-ads-mcp/.env` (copy `.env.template`):

| Variable | Where it comes from |
| --- | --- |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth client |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads → Tools → API Center |
| `GOOGLE_ADS_REFRESH_TOKEN` | Generated once by consenting to the `adwords` scope |
| `GOOGLE_ADS_CUSTOMER_ID` | The account to query by default |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | The manager (MCC) account, if the account sits under one |

## Troubleshooting

**"authentication failed (developer_token)"** — the developer token is missing, wrong, or
not approved. A *test* token only reaches test accounts; production data needs an approved
token.

**"authentication failed (refresh_token)"** — the refresh token expired or was revoked, or
the client id/secret does not match the one that issued it. Regenerate it.

**Empty results with no error** — usually the wrong `customerId`, or a customer under a
manager account without `GOOGLE_ADS_LOGIN_CUSTOMER_ID` set.

**"quota exceeded"** — Google Ads quotas are **daily**. Retrying will not help; stop and
tell the user.
