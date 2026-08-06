# Shopify MCP Server

MCP server for the Shopify Admin API, providing tools to fetch orders and analytics data from Shopify stores.

## Features

- **shopify_get_orders**: Fetch orders with filters for status, date range, and pagination
- **shopify_get_analytics**: Calculate analytics summary including revenue, order counts, and customer metrics

## Setup

### 1. Create a Custom App in Shopify

1. Go to your Shopify Admin panel
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps** → **Create an app**
4. Name your app (e.g., "MCP Analytics")
5. Configure Admin API scopes:
   - `read_orders` - Required for order data
   - `read_products` - Optional, for product details
   - `read_analytics` - Optional, for additional analytics
6. Click **Install app**
7. Copy the **Admin API access token** (starts with `shpat_`)

### 2. Configure Environment Variables

Copy the template and fill in your credentials:

```bash
cp .env.template .env
```

Edit `.env`:

```env
# Required
SHOPIFY_ACCESS_TOKEN=shpat_your_access_token_here
SHOPIFY_STORE_URL=your-store.myshopify.com

# Optional
SHOPIFY_API_VERSION=2024-10
PORT=3005
LOG_LEVEL=info
```

### 3. Run the Server

```bash
# Development
bun run dev

# Production
bun run build && bun run start
```

## Tools

### shopify_get_orders

Fetch orders from the Shopify store with optional filters.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max orders to return (1-250, default 50) |
| `status` | string | Filter: `open`, `closed`, `cancelled`, `any` |
| `financial_status` | string | Filter: `pending`, `authorized`, `paid`, `refunded`, etc. |
| `fulfillment_status` | string | Filter: `shipped`, `partial`, `unshipped`, `unfulfilled`, `any` |
| `created_at_min` | string | Orders created after (ISO 8601) |
| `created_at_max` | string | Orders created before (ISO 8601) |
| `since_id` | string | Pagination cursor |

**Example:**

```json
{
  "limit": 50,
  "status": "any",
  "created_at_min": "2024-01-01T00:00:00Z",
  "created_at_max": "2024-01-31T23:59:59Z"
}
```

### shopify_get_analytics

Calculate analytics summary for a date range.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Start date (YYYY-MM-DD) |
| `end_date` | string | End date (YYYY-MM-DD) |

**Example:**

```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**Response includes:**

- Total orders
- Total revenue
- Average order value (AOV)
- Total items sold
- New customers count
- Returning customers count

## Docker

Build and run with Docker:

```bash
# Build
docker build -t shopify-mcp -f Dockerfile ../..

# Run
docker run -p 3005:3005 \
  -e SHOPIFY_ACCESS_TOKEN=your_token \
  -e SHOPIFY_STORE_URL=your-store.myshopify.com \
  shopify-mcp
```

## API Rate Limits

Shopify uses a leaky bucket algorithm for rate limiting:

- Standard API: 40 requests per app per store
- Plus stores: 80 requests per app per store

The server includes automatic retry with exponential backoff for rate limit errors.

## Architecture

```
src/
├── index.ts              # Server bootstrap
├── types.ts              # Tagged errors, Config, Schemas
├── services/
│   └── shopify.ts        # ShopifyClient Effect.Service
└── tools/
    ├── get-orders.ts     # shopify_get_orders tool
    └── get-analytics.ts  # shopify_get_analytics tool
```

Built with:

- **Effect-TS** for dependency injection and error handling
- **mcp-core** for MCP server infrastructure
- **Shopify Admin REST API** for data fetching
