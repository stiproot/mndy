# GA4 MCP Server

MCP (Model Context Protocol) server for Google Analytics 4 Data API.

## Features

- Run custom GA4 reports with dimensions, metrics, and filters
- Support for multiple date ranges
- Dimension filtering (exact match, contains, regex, etc.)
- Pagination support for large datasets

## Setup

### 1. Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable the "Google Analytics Data API"
4. Go to **IAM & Admin → Service Accounts**
5. Create a service account
6. Generate a JSON key and download it
7. Place the JSON key in `secrets/ga4-service-account.json`

### 2. Grant GA4 Access

1. Go to your GA4 property
2. Navigate to **Admin → Property Access Management**
3. Add the service account email (from the JSON key)
4. Grant **Viewer** role

### 3. Configure Environment

Copy the template and fill in your values:

```bash
cp .env.template .env
```

Edit `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GA4_PROPERTY_ID=123456789
PORT=3003
LOG_LEVEL=info
```

## Running

### Development

```bash
bun install
bun run build
bun run start
```

### Docker

```bash
docker compose --profile ai up ga4-mcp
```

## Tools

### ga4_run_report

Run a GA4 report with custom dimensions and metrics.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propertyId` | string | No | GA4 Property ID (uses default if not provided) |
| `dateRanges` | array | Yes | Date ranges (max 4). Each has `startDate` and `endDate` |
| `dimensions` | array | No | Dimensions to include (e.g., `date`, `sessionSource`) |
| `metrics` | array | Yes | Metrics to include (e.g., `sessions`, `activeUsers`) |
| `dimensionFilter` | object | No | Filter to apply to dimensions |
| `limit` | number | No | Max rows to return (default 10000, max 100000) |
| `offset` | number | No | Row offset for pagination |

**Example:**

```json
{
  "dateRanges": [
    { "startDate": "7daysAgo", "endDate": "today" }
  ],
  "dimensions": [
    { "name": "date" },
    { "name": "sessionSource" }
  ],
  "metrics": [
    { "name": "sessions" },
    { "name": "activeUsers" },
    { "name": "conversions" }
  ]
}
```

### Common Dimensions

- `date`, `dateHour`
- `sessionSource`, `sessionMedium`, `sessionCampaignName`
- `sessionDefaultChannelGroup`
- `country`, `city`
- `deviceCategory`, `browser`, `operatingSystem`
- `landingPage`, `pagePath`, `pageTitle`
- `eventName`

### Common Metrics

- `sessions`, `activeUsers`, `newUsers`, `totalUsers`
- `screenPageViews`, `screenPageViewsPerSession`
- `averageSessionDuration`, `bounceRate`, `engagementRate`
- `conversions`, `totalRevenue`, `purchaseRevenue`
- `ecommercePurchases`, `addToCarts`, `checkouts`

## Date Formats

- **Absolute:** `YYYY-MM-DD` (e.g., `2024-01-15`)
- **Relative:** `today`, `yesterday`, `NdaysAgo` (e.g., `7daysAgo`, `30daysAgo`)

## Architecture

This MCP server follows the Effect-TS pattern used in the project:

- **Effect.Service** for dependency injection
- **Tagged errors** for type-safe error handling
- **Resilience patterns** (timeout, retry with backoff)
- **mcp-core** for HTTP transport

## References

- [GA4 Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 Dimensions & Metrics Explorer](https://ga-dev-tools.google/ga4/dimensions-metrics-explorer/)
