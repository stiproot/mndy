# Meta Ads MCP Server

MCP (Model Context Protocol) server for Meta Marketing API (Facebook/Instagram Ads).

## Features

- Fetch advertising insights at account, campaign, ad set, or ad level
- Support for date presets and custom date ranges
- Filter by specific campaigns
- Customizable fields

## Setup

### 1. Create Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app (choose "Business" type)
3. Add the "Marketing API" product

### 2. Generate Access Token

Choose based on your use case:

#### Development (Quick Start)

Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/):
1. Select your app
2. Click "Generate Access Token"
3. Select permissions: `ads_read`, `read_insights`
4. Generate and copy the token

**Note:** These tokens expire in 1-2 hours. The "no expiry" option is no longer available in the UI.

#### Production (System User - Recommended)

**Manual Generation:**
1. Go to [Business Manager](https://business.facebook.com/settings/) → Settings → System Users
2. Create a system user with Admin role
3. Assign the system user to your ad accounts
4. Generate a token (permanent or 60-day expiry)

**Programmatic Generation:**
System user tokens can be created via API for automated provisioning:

```bash
# Step 1: Install the app for the system user
curl -X POST \
  -F "business_app=YOUR_APP_ID" \
  -F "access_token=ADMIN_ACCESS_TOKEN" \
  "https://graph.facebook.com/v21.0/SYSTEM_USER_ID/applications"

# Step 2: Generate permanent access token
curl -X POST \
  -F "business_app=YOUR_APP_ID" \
  -F "scope=ads_management,ads_read,read_insights" \
  -F "appsecret_proof=HMAC_SHA256_HASH" \
  -F "access_token=ADMIN_ACCESS_TOKEN" \
  "https://graph.facebook.com/v21.0/SYSTEM_USER_ID/access_tokens"
```

**For 60-day expiring tokens:** Add `-F "set_token_expires_in_60_days=true"`

**Requirements:**
- Initial admin access token (to make API calls)
- `appsecret_proof` = HMAC-SHA256(access_token, app_secret)

**Resources:**
- [Install Apps and Generate Tokens](https://developers.facebook.com/docs/business-management-apis/system-users/install-apps-and-generate-tokens/)
- [System User Access Token Handling](https://developers.facebook.com/docs/marketing-api/guides/smb/system-user-access-token-handling/)

### 3. Get Ad Account ID

1. Go to [Business Settings](https://business.facebook.com/settings)
2. Navigate to Ad Accounts
3. Copy the Account ID (add `act_` prefix if not present)

### 4. Configure Environment

Copy the template and fill in your values:

```bash
cp .env.template .env
```

Edit `.env`:

```env
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
META_AD_ACCOUNT_ID=act_123456789
PORT=3004
LOG_LEVEL=info
```

## Token Management

### Token Types

| Type | Expiry | Best For | Generation |
|------|--------|----------|------------|
| User (short) | 1-2 hours | Quick testing | Graph API Explorer |
| User (long) | 60 days | Development | Token exchange API |
| System User | Permanent or 60-day | Production | Business Manager or API |

### Token Security

**Best Practices:**
1. Never commit tokens to version control
2. Use environment variables or secret management systems
3. Rotate tokens periodically (even if permanent)
4. Use system users for production, not personal accounts
5. Limit token permissions to minimum required scopes

### Token Refresh

System user tokens can be refreshed programmatically:

```bash
# Refresh a 60-day token before it expires
curl -X POST \
  -F "grant_type=fb_refresh_token" \
  -F "fb_refresh_token=CURRENT_TOKEN" \
  "https://graph.facebook.com/v21.0/oauth/access_token?client_id=APP_ID&client_secret=APP_SECRET"
```

**Note:** Permanent system user tokens don't need refreshing.

## Running

### Development

```bash
bun install
bun run build
bun run start
```

### Docker

```bash
docker compose --profile ai up meta-ads-mcp
```

## Tools

### meta_get_insights

Fetch advertising insights from Meta Marketing API.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `adAccountId` | string | No | Ad Account ID (uses default if not provided) |
| `level` | string | No | Level: `account`, `campaign`, `adset`, `ad` (default: `campaign`) |
| `datePreset` | string | No | Preset date range (default: `last_7d`) |
| `timeRange` | object | No | Custom date range with `since` and `until` |
| `campaignIds` | array | No | Filter by specific campaign IDs |
| `fields` | array | No | Specific fields to retrieve |
| `limit` | number | No | Max results (default 50, max 500) |

**Date Presets:**
- `today`, `yesterday`
- `last_3d`, `last_7d`, `last_14d`, `last_28d`, `last_30d`, `last_90d`
- `this_month`, `last_month`
- `this_quarter`, `last_quarter`
- `this_year`, `last_year`
- `maximum`

**Example:**

```json
{
  "level": "campaign",
  "datePreset": "last_30d",
  "fields": [
    "campaign_name",
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cpc",
    "actions",
    "purchase_roas"
  ]
}
```

### Default Fields

- `campaign_id`, `campaign_name`
- `adset_id`, `adset_name`
- `spend`, `impressions`, `clicks`, `reach`
- `ctr`, `cpc`, `cpm`, `frequency`
- `actions`, `action_values`, `purchase_roas`

### All Available Fields

- **Identifiers:** `account_id`, `campaign_id`, `adset_id`, `ad_id` + names
- **Basic:** `spend`, `impressions`, `clicks`, `reach`
- **Calculated:** `ctr`, `cpc`, `cpm`, `cpp`, `frequency`
- **Conversions:** `actions`, `conversions`, `cost_per_action_type`
- **ROAS:** `purchase_roas`, `website_purchase_roas`
- **Video:** `video_p25_watched_actions`, `video_p50_watched_actions`, etc.
- **Quality:** `quality_ranking`, `engagement_rate_ranking`, `conversion_rate_ranking`

## Architecture

This MCP server follows the Effect-TS pattern used in the project:

- **Effect.Service** for dependency injection
- **Tagged errors** for type-safe error handling
- **Resilience patterns** (timeout, retry with backoff)
- **mcp-core** for HTTP transport

## References

- [Meta Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)
- [Insights API Reference](https://developers.facebook.com/docs/marketing-api/insights)
- [System User Tokens](https://www.facebook.com/business/help/503306463479099)
