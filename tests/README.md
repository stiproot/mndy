# Integration Tests

This directory contains integration tests for the MCP servers.

## Prerequisites

Before running tests, you need:

1. **MCP servers running** (either via Docker or locally)
2. **API credentials configured** (see main [README](../README.md#marketing-analytics-mcp-servers) for setup guides)
3. **Test environment configured** (`.env` file)

## Quick Setup

```bash
# Copy the template
cp .env.template .env

# Edit with your credentials
# See tables below for required values
```

## Running Tests

```bash
# All integration tests
bun run test:integration

# By MCP server
bun run test:integration:github    # GitHub Issues MCP
bun run test:integration:ga4       # Google Analytics 4 MCP
bun run test:integration:meta      # Meta Ads MCP
bun run test:integration:shopify   # Shopify MCP

# All marketing MCPs together
bun run test:integration:marketing

# Watch mode (re-runs on file changes)
bun run test:integration:watch
```

## Environment Variables

### GitHub Issues MCP

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_ISSUES_MCP_URL` | No | Server URL (default: `http://localhost:3001`) |
| `TEST_OWNER` | Yes | GitHub org/user to test against |
| `TEST_REPO` | Yes | Repository name |
| `TEST_USERNAME` | Yes | GitHub username for contributor tests |
| `GITHUB_TOKEN` | Yes | Personal access token with repo scope |

### GA4 MCP

| Variable | Required | Description |
|----------|----------|-------------|
| `GA4_MCP_URL` | No | Server URL (default: `http://localhost:3003`) |
| `GA4_TEST_PROPERTY_ID` | Yes* | GA4 property ID (numeric) |

*Tests will skip if not configured.

### Meta Ads MCP

| Variable | Required | Description |
|----------|----------|-------------|
| `META_MCP_URL` | No | Server URL (default: `http://localhost:3004`) |
| `META_TEST_AD_ACCOUNT_ID` | Yes* | Ad account ID (format: `act_123456789`) |

*Tests will skip if not configured.

### Shopify MCP

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_MCP_URL` | No | Server URL (default: `http://localhost:3005`) |
| `SHOPIFY_TEST_STORE_URL` | Yes* | Store URL (format: `store.myshopify.com`) |

*Tests will skip if not configured.

## Starting MCP Servers

### Option 1: Docker Compose (Recommended)

```bash
# From repo root - start all AI services
docker compose --profile ai up -d

# Or start specific MCPs
docker compose --profile ai up ga4-mcp meta-ads-mcp shopify-mcp -d
```

### Option 2: Local Development

```bash
# Terminal 1: GA4 MCP
cd src/ga4-mcp && bun run start

# Terminal 2: Meta Ads MCP
cd src/meta-ads-mcp && bun run start

# Terminal 3: Shopify MCP
cd src/shopify-mcp && bun run start
```

## Test Structure

```
tests/
├── .env.template          # Environment template
├── .env                   # Your local config (git-ignored)
├── README.md              # This file
└── integration/
    ├── github-issues-mcp/
    │   ├── setup.ts       # Test utilities
    │   └── *.test.ts      # Test files
    ├── ga4-mcp/
    │   ├── setup.ts
    │   └── ga4-run-report.test.ts
    ├── meta-ads-mcp/
    │   ├── setup.ts
    │   └── meta-get-insights.test.ts
    └── shopify-mcp/
        ├── setup.ts
        └── shopify-get-orders.test.ts
```

## Writing Tests

Tests use [Vitest](https://vitest.dev/) with Effect-TS patterns. Each MCP has a `setup.ts` with shared utilities:

```typescript
import { Effect } from "effect";
import { TestConfig, waitForHealth, callMcpTool } from "./setup.js";

describe("my-mcp", () => {
  let config: TestConfigType;

  beforeAll(async () => {
    config = await Effect.runPromise(TestConfig);
    await Effect.runPromise(waitForHealth(`${config.mcpUrl}/health`));
  });

  it("calls a tool", async () => {
    const { response, data } = await Effect.runPromise(
      callMcpTool(config.mcpUrl, "tool_name", { arg: "value" })
    );
    expect(response.status).toBe(200);
  });
});
```

## Troubleshooting

### Tests timeout waiting for health check

The MCP server isn't running or isn't healthy. Check:

```bash
# Is the server running?
curl http://localhost:3003/health

# Check Docker logs
docker compose logs ga4-mcp
```

### Tests skip with "not configured" message

The test environment variable isn't set. Check your `.env` file has the required credentials.

### Authentication errors

Your API credentials may be invalid or expired:
- **GA4**: Service account may not have GA4 property access
- **Meta**: Access token may have expired (use System User tokens)
- **Shopify**: Access token may have been revoked

See the main [README](../README.md#marketing-analytics-mcp-servers) for credential setup guides.
