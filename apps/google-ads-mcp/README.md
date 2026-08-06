# google-ads-mcp

MCP server for the Google Ads API — paid search and display performance.

**Needs no infrastructure.** A plain HTTP process: no Dapr, no database, no
`docker-compose`. Just its own `.env` and a free port.

- **Port:** 3010
- **Endpoint:** `http://localhost:3010/mcp`
- **Health:** `http://localhost:3010/health`

## Run it

```bash
cp apps/google-ads-mcp/.env.template apps/google-ads-mcp/.env
# fill in credentials, then:
make run-google-ads-mcp
```

Or start it with the other analytics servers: `make run-analytics-mcps`.

## Architecture

The server is a container. The domain and the API adapter live in
[`packages/js/google-ads-core`](../../packages/js/google-ads-core); this app holds only
config, tool schemas, registration and the composition root. See CLAUDE.md, "Where code
lives".

## Tools

| Tool | Purpose |
| --- | --- |
| `google_ads_get_performance` | Spend, impressions, clicks, conversions, revenue + derived KPIs, at account / campaign / ad group / keyword level |
| `google_ads_get_campaigns` | Campaign list with status, channel type, bidding strategy |

Both accept an optional `customerId` that overrides `GOOGLE_ADS_CUSTOMER_ID` for that call,
so one running server serves every brand its credentials can reach.

## Credentials

Google Ads needs four separate credentials plus an account id — materially more setup than
GA4's single service-account key. All go in `.env`.

### 1. OAuth client (`GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`)

Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → **Desktop
app**. Enable the **Google Ads API** for the project while you are there.

### 2. Developer token (`GOOGLE_ADS_DEVELOPER_TOKEN`)

Google Ads → Tools & Settings → Setup → **API Center**. Only a manager (MCC) account can
obtain one.

> A newly issued token has **test** access: it reaches test accounts only, and returns
> empty or permission errors against production accounts. Apply for basic access to query
> real data. This is the single most common reason a correctly configured server returns
> nothing.

### 3. Refresh token (`GOOGLE_ADS_REFRESH_TOKEN`)

A one-time OAuth consent for the `https://www.googleapis.com/auth/adwords` scope using the
client from step 1. Google's [OAuth Playground](https://developers.google.com/oauthplayground/)
is the quickest route: set your own client id/secret in the settings gear, authorize the
adwords scope, exchange the code, and copy the refresh token.

### 4. Accounts (`GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`)

`GOOGLE_ADS_CUSTOMER_ID` is the account whose data you want — 10 digits, dashes stripped
automatically, so `123-456-7890` is fine.

`GOOGLE_ADS_LOGIN_CUSTOMER_ID` is the **manager account you are acting through**. Set it
whenever the target account sits under an MCC, which is the usual agency arrangement.
Leaving it unset there produces empty results rather than an error.

## Units and nulls

**Spend is in the account's currency.** Google Ads reports cost in *micros* — millionths —
and this server converts it once, in the adapter. Never divide by 1,000,000 downstream.

**KPIs may be `null`**, meaning not computable (missing input, or a zero denominator). That
is deliberately distinct from zero; see `packages/js/analytics-core/src/domain/kpis.ts`.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `authentication failed (developer_token)` | Token missing, wrong, or still test-level |
| `authentication failed (refresh_token)` | Refresh token expired/revoked, or client id/secret mismatch |
| Empty results, no error | Wrong customer ID, or missing `GOOGLE_ADS_LOGIN_CUSTOMER_ID` under an MCC |
| `quota exceeded` | Google Ads quotas are **daily** — retrying will not help |
