# mndy

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Dapr](https://img.shields.io/badge/Dapr-1.16+-purple.svg)](https://dapr.io/)

## Two ways to use mndy

This repo supports two genuinely different modes. **Pick one before reading further** —
most people want the first, and it requires none of the infrastructure the second describes.

### Mode 1 — Analytics MCP servers (no infrastructure)

Start two or three plain HTTP processes, point Claude Code at them, and ask questions about
your GA4, Meta Ads, Google Ads and Shopify data. **No Dapr, no MongoDB, no RabbitMQ, no
docker-compose, no Python.** Each server needs only its own `.env` and a free port.

This is the mode most users want. It is documented end-to-end in
**[Analytics MCP mode](#analytics-mcp-mode)** below — go there and skip the rest.

### Mode 2 — The full platform

The Azure DevOps analytics platform: Vue frontends, an Express gateway, four Python
workers, Dapr, MongoDB, RabbitMQ and Zipkin. This is what the [Architecture](#architecture)
and [Quick Start](#quick-start-full-platform) sections describe.

**Only one MCP server, `dapr-mcp`, belongs to Mode 2.** Every other server runs standalone.
See [Which servers need infrastructure](#which-servers-need-infrastructure) — that table is
the single source of truth, and everything else links to it.

---

## Analytics MCP mode

Clone to first tool call. Nothing here starts a database or a sidecar.

### 1. Install dependencies

```bash
git clone https://github.com/stiproot/mndy.git
cd mndy
bun install          # Node only — `make install` also syncs Python, which Mode 1 does not need
```

### 2. Configure the servers you want

Each server reads its own `.env`. Copy the template and fill in credentials for whichever
platforms you use — you do not need all of them:

```bash
cp apps/ga4-mcp/.env.template        apps/ga4-mcp/.env
cp apps/meta-ads-mcp/.env.template   apps/meta-ads-mcp/.env
cp apps/shopify-mcp/.env.template    apps/shopify-mcp/.env
cp apps/google-ads-mcp/.env.template apps/google-ads-mcp/.env
```

Per-platform credential setup lives in each server's README — Google Ads has the most
involved setup, so start with [its README](apps/google-ads-mcp/README.md) if you need it.

### 3. Start them

```bash
make run-analytics-mcps    # GA4 3003, Meta 3004, Shopify 3005, Google Ads 3010
```

Ctrl-C stops all of them. To run just one: `make run-ga4-mcp` (and so on).

Check any of them: `curl -s http://localhost:3003/health`.

### 4. Connect Claude Code

```bash
claude plugin marketplace add ./plugin-marketplace
claude plugin install mndy-mcp@mndy
```

The plugin registers the servers over HTTP and ships a skill per server, so the agent knows
which tool to reach for. **No credentials are configured on the Claude side** — each server
process holds its own.

### 5. Ask

> "What was our Meta ROAS last week compared to the week before?"

### Working with several brands

One running server serves every account its credentials can reach: the GA4, Meta and Google
Ads tools take a per-call `propertyId` / `adAccountId` / `customerId`. Define your brands in
a gitignored `mndy-brands.json` (template:
`plugin-marketplace/plugins/mndy-mcp/skills/brands/mndy-brands.example.json`) and the
`brands` skill applies the right IDs per call — no restarts.

Shopify is the exception: its auth is bound to one store, so a running server serves exactly
one store.

---

## Which servers need infrastructure

**This table is the single source of truth.** Every other doc links here rather than
restating it.

| Server | Port | Needs infrastructure? | Analytics? |
| --- | --- | --- | --- |
| `ga4-mcp` | 3003 | **No** | Yes |
| `meta-ads-mcp` | 3004 | **No** | Yes |
| `shopify-mcp` | 3005 | **No** | Yes |
| `google-ads-mcp` | 3010 | **No** | Yes |
| `github-issues-mcp` | 3009 | **No** | No |
| `markdown-mcp` | 3008 | **No** | No |
| `dapr-mcp` | 3006 | **Yes** — Dapr sidecar + `make docker-compose-infra` | No |

"Needs infrastructure" and "analytics" are separate axes and must not be conflated:
`github-issues-mcp` and `markdown-mcp` are infrastructure-free but are not analytics
servers, so `make run-analytics-mcps` does not start them.

---

## Overview

**mndy** (Project Metrics) is a comprehensive, data-driven project analytics platform designed for
software development teams. It bridges the gap between Azure DevOps and project reporting platforms,
enabling teams to make informed decisions through powerful metrics visualization and analysis.

The platform provides a centralized hub for collecting, analyzing, and visualizing project data, helping teams identify bottlenecks, track progress, and optimize resource allocation—all while promoting better team behaviors through data transparency.

## Features

- **Azure DevOps Integration** - Seamless connection to Azure DevOps for work item tracking and project data
- **Real-time Metrics Visualization** - Interactive dashboards built with D3.js and Quasar Framework
- **Behavioral Change Analytics** - Track and improve team behaviors through data-driven insights
- **Flexible Query System** - Custom queries to extract and analyze project data from multiple sources
- **Command-Based Data Processing** - Process, filter, aggregate, and transform data with composable commands
- **Microservices Architecture** - Scalable, distributed system using Dapr for orchestration
- **Multi-Team Support** - Manage metrics across multiple teams and projects
- **Historical Data Analysis** - Track trends over time for better forecasting and estimation

## Architecture

mndy is built on a modern cloud-native microservices architecture using Dapr (Distributed Application Runtime) for service communication, pub/sub messaging, and state management.

### Services

- `apps/ui/` - Vue 3 + TypeScript + Quasar frontend with D3.js visualizations. [Details](apps/ui/README.md)
- `apps/ui-api/` - Express.js API gateway for authentication and data operations. [Details](apps/ui-api/README.md)
- `apps/azdo-worker/` - Python FastAPI service for Azure DevOps data collection
- `apps/azdoproxy-worker/` - Python FastAPI proxy for Azure DevOps API
- `apps/insights-worker/` - Python FastAPI analytics and data processing service
- `apps/workflows-worker/` - Python FastAPI workflow orchestration service

### MCP Servers

Each server is a thin container; its domain and platform adapter live in a package under
`packages/js/`. See CLAUDE.md, "Where code lives". For which of these need infrastructure,
see [the table above](#which-servers-need-infrastructure).

- `packages/js/mcp-core/` - the MCP server framework every server is built on
- `apps/ga4-mcp/` - Google Analytics 4. [Details](apps/ga4-mcp/README.md)
- `apps/meta-ads-mcp/` - Meta (Facebook/Instagram) Ads. [Details](apps/meta-ads-mcp/README.md)
- `apps/shopify-mcp/` - Shopify Admin API. [Details](apps/shopify-mcp/README.md)
- `apps/google-ads-mcp/` - Google Ads paid search/display. [Details](apps/google-ads-mcp/README.md)
- `apps/github-issues-mcp/` - GitHub Issues. [Details](apps/github-issues-mcp/README.md)
- `apps/markdown-mcp/` - Markdown generation
- `apps/dapr-mcp/` - Dapr state cache **(requires a Dapr sidecar + infra)**

### AI Services

- **cc-core** (TypeScript) - Claude Code SDK wrapper for building agentic services
- **cc-svc** (TypeScript + Express) - Multi-agent contributor insights service

### Infrastructure

- **Dapr** - Service mesh for inter-service communication
- **MongoDB** - Primary database for state and metrics storage
- **RabbitMQ** - Message broker for pub/sub messaging
- **Docker** - Containerization for all services
- **Zipkin** - Distributed tracing

For detailed architecture diagrams, see [docs/architecture.html](docs/architecture.html).

## Quick Start (full platform)

> This is **Mode 2**. If you only want the analytics MCP servers, use
> [Analytics MCP mode](#analytics-mcp-mode) instead — none of the prerequisites below apply.

### Prerequisites

- Docker & Docker Compose
- Dapr CLI 1.15+
- Azure DevOps Personal Access Token (PAT)
- Okta credentials (for authentication)
- Make (optional, for using Makefile commands)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/stiproot/mndy.git
   cd mndy
   ```

2. **Configure Azure DevOps credentials**

   Create `.env` files for each service based on the `.env.template` files:

   ```bash
   # Example for ui-api
   cp apps/ui-api/.env.template apps/ui-api/.env
   # Edit the file and add your credentials
   ```

   Required environment variables:
   - `AZDO_ORGANIZATION` - Your Azure DevOps organization name
   - `AZDO_PROJECT` - Your project name
   - `AZDO_API_KEY` or `AZDO_PAT` - Your Personal Access Token

3. **Configure Okta (optional)**

   If using Okta authentication, update the Okta environment variables in `apps/ui-api/.env`:

   ```bash
   OKTA_ISSUER=https://your-okta-domain.okta.com/oauth2/default
   OKTA_CLIENT_ID=your-client-id
   OKTA_CLIENT_SECRET=your-client-secret
   ```

### Running

**Full stack with Docker Compose:**

```bash
# Standard architecture (x86)
make docker-compose

# ARM architecture (Apple Silicon)
make docker-compose-arm

# AI services only (cc-svc + github-issues-mcp)
make docker-compose-ai
make docker-compose-ai-arm  # ARM architecture
```

This starts all services including:

- Dapr placement service
- MongoDB (with replica set)
- RabbitMQ
- Zipkin (tracing)
- All microservices with Dapr sidecars

**Development mode (individual services):**

```bash
# UI development server
make serve-ui

# UI API
make run-ui-api

# Individual workers
make run-azdo-worker
make run-azdoproxy-worker
make run-insights-worker
make run-workflows-worker

# MCP servers
make run-github-issues-mcp

# AI services
make run-cc-svc
```

**Access the application:**

- UI: `http://localhost:8080` (or configured port)
- MongoDB Express: `http://localhost:8081`
- Zipkin: `http://localhost:9411`

## Configuration

### Azure DevOps Setup

1. Generate a Personal Access Token (PAT) in Azure DevOps with the following scopes:
   - Work Items (Read)
   - Project and Team (Read)

2. Configure environment variables in each service's `.env` file:

   ```bash
   AZDO_ORGANIZATION=your-organization
   AZDO_PROJECT=your-project
   AZDO_API_KEY=your-pat-token
   ```

### Okta OAuth Setup

For authentication using Okta:

1. Create an Okta application (Web Application, PKCE-enabled)
2. Configure redirect URIs
3. Update environment variables with Okta credentials

### Service Configuration

Each service has its own `.env.template` file:

- `apps/ui-api/.env.template` - UI API configuration
- `apps/azdo-worker/.env.template` - Azure DevOps worker
- `apps/azdoproxy-worker/.env.template` - AzDo proxy worker
- `apps/insights-worker/.env.template` - Insights worker
- `apps/workflows-worker/.env.template` - Workflows worker
- `apps/github-issues-mcp/.env.template` - GitHub Issues MCP server
- `apps/cc-svc/.env.template` - Claude Code service

Copy each template to `.env` and configure with your credentials.

### Marketing Analytics MCP Servers

The marketing analytics MCP servers connect to Google Analytics 4, Meta Ads, and Shopify. Each requires API credentials from the respective platform.

#### Google Analytics 4 (GA4) Setup

**What you need:**

- A Google Cloud Platform (GCP) account
- Access to a GA4 property (Viewer role or higher)

##### Step 1: Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "mndy-analytics") and click "Create"

##### Step 2: Enable the GA4 Data API

1. In GCP Console, go to "APIs & Services" → "Library"
2. Search for "Google Analytics Data API"
3. Click on it and press "Enable"

##### Step 3: Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter a name (e.g., "ga4-reader") and click "Create and Continue"
4. Skip the optional role assignment and click "Done"
5. Click on your new service account
6. Go to the "Keys" tab → "Add Key" → "Create new key"
7. Select "JSON" and click "Create"
8. Save the downloaded JSON file to `secrets/ga4-service-account.json`

##### Step 4: Grant GA4 Access

1. Copy the service account email (looks like `ga4-reader@project-id.iam.gserviceaccount.com`)
2. Go to [Google Analytics](https://analytics.google.com/)
3. Navigate to Admin → Property Access Management
4. Click "+" → "Add users"
5. Paste the service account email
6. Select "Viewer" role and click "Add"

##### Step 5: Get Your Property ID

1. In GA4, go to Admin → Property Settings
2. Copy the "Property ID" (a numeric value like `123456789`)

**Environment Variables:**

```bash
# In apps/ga4-mcp/.env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/secrets/ga4-service-account.json
GA4_PROPERTY_ID=123456789
PORT=3003
```

#### Meta (Facebook/Instagram) Ads Setup

**What you need:**

- A Meta Business Manager account
- Admin access to an Ad Account

##### Step 1: Create a Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Other" → "Business" → "Next"
4. Enter an app name and select your Business Manager
5. Click "Create App"

##### Step 2: Add Marketing API

1. In your app dashboard, click "Add Product"
2. Find "Marketing API" and click "Set Up"

##### Step 3: Generate Access Token

Choose the appropriate method based on your use case:

#### Option A: Development/Testing (Graph API Explorer)

**Best for:** Quick testing, development environments

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Select these permissions:
   - `ads_management`
   - `ads_read`
   - `read_insights`
5. Click "Generate Access Token" and copy the token

⚠️ **Important Limitations:**

- Expires in 1-2 hours
- Cannot select "no expiry" option in the UI
- For longer-lived tokens, see the token exchange API or use system users

#### Option B: Production (System User - UI Method)

**Best for:** Production environments, long-running services

1. Go to [Business Settings](https://business.facebook.com/settings/)
2. Navigate to "Users" → "System Users"
3. Click "Add" and create a new system user
4. Set role to "Admin"
5. Click "Add Assets" and assign your Ad Account with full permissions
6. Click "Generate New Token"
7. Select your app and these permissions:
   - `ads_management`
   - `ads_read`
   - `read_insights`
8. Click "Generate Token" and copy it securely

✅ **Benefits:**

- Permanent tokens (no expiry) or 60-day expiry (configurable)
- Recommended for production use
- More secure than user tokens

#### Option C: Production (System User - API Method)

**Best for:** Automated provisioning, infrastructure-as-code

System user tokens can be generated programmatically using Meta's Business Management APIs. This requires:

1. An existing admin access token
2. A system user ID
3. Your app ID and app secret

**Install the app for the system user:**

```bash
curl \
  -F "business_app=YOUR_APP_ID" \
  -F "access_token=ADMIN_ACCESS_TOKEN" \
  "https://graph.facebook.com/v21.0/SYSTEM_USER_ID/applications"
```

**Generate a permanent access token:**

```bash
curl \
  -F "business_app=YOUR_APP_ID" \
  -F "scope=ads_management,ads_read,read_insights" \
  -F "appsecret_proof=HMAC_SHA256_HASH" \
  -F "access_token=ADMIN_ACCESS_TOKEN" \
  "https://graph.facebook.com/v21.0/SYSTEM_USER_ID/access_tokens"
```

**Generate a 60-day expiring token:**

```bash
# Add this parameter:
-F "set_token_expires_in_60_days=true"
```

📖 **Documentation:**

- [Business Management APIs - Install Apps and Generate Tokens](https://developers.facebook.com/docs/business-management-apis/system-users/install-apps-and-generate-tokens/)
- [System User Access Token Handling](https://developers.facebook.com/docs/marketing-api/guides/smb/system-user-access-token-handling/)

##### Step 4: Get Your Ad Account ID

1. Go to [Ads Manager](https://adsmanager.facebook.com/)
2. Click the dropdown showing your account name
3. Copy the Ad Account ID (displayed as a number like `123456789`)

**Important:** The Ad Account ID in Ads Manager is displayed as just a number, but the Meta API requires the `act_` prefix. Add the prefix yourself when configuring:

**Environment Variables:**

```bash
# In apps/meta-ads-mcp/.env

# Access token (use system user token for production)
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx...

# Add the "act_" prefix to your numeric Ad Account ID
META_AD_ACCOUNT_ID=act_123456789

PORT=3004
```

**Token Recommendations:**

- **Development:** Use Graph API Explorer tokens (short-lived, 1-2 hours)
- **CI/CD & Testing:** Use long-lived user tokens or system user tokens (60 days)
- **Production:** Use system user tokens (permanent or 60-day, depending on your security policy)

**Troubleshooting:**

- **"Invalid OAuth access token"**: Your token has expired
  - Graph API Explorer tokens expire in 1-2 hours
  - User access tokens expire in 60 days
  - System user tokens can be permanent or 60-day (check your settings)
  - Generate a new token using one of the methods above
- **Permission errors**: Ensure the system user has the Ad Account assigned with appropriate permissions
- **"Unsupported get request"**: Verify the Ad Account ID has the `act_` prefix

#### Shopify Setup

**What you need:**

- A Shopify store (can be a development store for testing)
- Store owner or staff account with app development permissions

##### Step 1: Create an App in the Dev Dashboard

1. Go to your Shopify Admin (admin.shopify.com/store/your-store)
2. Navigate to "Settings" → "Apps and sales channels"
3. Click "Develop apps" → "Build app in Dev Dashboard"
4. This opens the Shopify Dev Dashboard (dev.shopify.com)
5. Click "Create app"
6. Enter an app name (e.g., "mndy-analytics") and click "Create"

##### Step 2: Configure API Scopes

1. In your app on dev.shopify.com, find the API configuration section
2. Enable these Admin API scopes:
   - `read_orders` - View orders
   - `read_products` - View products
   - `read_customers` - View customer data
   - `read_analytics` - View store analytics
3. Save your changes

##### Step 3: Release and Install the App

1. Click "Release" to make the app available for installation
2. Click "Install" to install the app on your store
3. Copy the **Client ID** and **Client Secret** from the app credentials

##### Step 4: Get Your Store URL

Your store URL is in the format: `your-store-name.myshopify.com`

**Environment Variables:**

```bash
# In apps/shopify-mcp/.env
SHOPIFY_CLIENT_ID=your-client-id
SHOPIFY_CLIENT_SECRET=your-client-secret
SHOPIFY_STORE_URL=your-store.myshopify.com
PORT=3005
```

**How Authentication Works:**

The MCP server uses the OAuth 2.0 client credentials grant to exchange your Client ID and Client Secret for an access token. Tokens are automatically refreshed every 24 hours.

**Note:** For development/testing, you can create a free [Shopify Partner](https://www.shopify.com/partners) account and spin up development stores.

#### Running Marketing MCP Tests

**1. Configure test environment:**

```bash
cp tests/.env.template tests/.env
# Edit tests/.env with your credentials
```

**2. Start the MCP servers:**

```bash
# Start all marketing MCP servers with Docker
docker compose --profile ai up ga4-mcp meta-ads-mcp shopify-mcp -d

# Or run individually for development
cd apps/ga4-mcp && bun run dev
cd apps/meta-ads-mcp && bun run dev
cd apps/shopify-mcp && bun run dev
```

**3. Run the tests:**

```bash
# All marketing tests
bun run test:integration:marketing

# Individual MCP tests
bun run test:integration:ga4
bun run test:integration:meta
bun run test:integration:shopify
```

**Test Configuration Reference:**

| Variable | Description | Example |
|----------|-------------|---------|
| `GA4_MCP_URL` | GA4 MCP server URL | `http://localhost:3003` |
| `GA4_TEST_PROPERTY_ID` | GA4 property to test against | `123456789` |
| `META_MCP_URL` | Meta Ads MCP server URL | `http://localhost:3004` |
| `META_TEST_AD_ACCOUNT_ID` | Meta ad account to test against | `act_123456789` |
| `SHOPIFY_MCP_URL` | Shopify MCP server URL | `http://localhost:3005` |
| `SHOPIFY_TEST_STORE_URL` | Shopify store to test against | `store.myshopify.com` |

## Project Structure

```text
mndy/
├── src/
│   ├── ui/                      # Vue 3 frontend (Quasar + D3.js)
│   ├── ui-api/                  # Express.js API gateway
│   ├── mndy-framework/          # Shared Python framework
│   ├── azdo-worker/             # Azure DevOps data gathering
│   ├── azdoproxy-worker/        # Azure DevOps proxy
│   ├── insights-worker/         # Analytics processing
│   ├── workflows-worker/        # Workflow orchestration
│   ├── mcp-core/                # Shared MCP server library
│   ├── github-issues-mcp/       # GitHub Issues MCP server
│   ├── ga4-mcp/                 # Google Analytics 4 MCP server
│   ├── meta-ads-mcp/            # Meta Ads MCP server
│   ├── shopify-mcp/             # Shopify MCP server
│   ├── cc-core/                 # Claude Code SDK wrapper
│   ├── cc-svc/                  # Multi-agent insights service
│   └── dapr/                    # Dapr configuration
│       ├── components/          # Pub/sub & state components
│       └── configuration/       # Dapr runtime config
├── tests/                       # Integration & unit tests
│   └── integration/             # Integration test suites
│       ├── github-issues-mcp/   # GitHub MCP tests
│       ├── ga4-mcp/             # GA4 MCP tests
│       ├── meta-ads-mcp/        # Meta Ads MCP tests
│       └── shopify-mcp/         # Shopify MCP tests
├── docs/                        # Documentation
│   ├── architecture.html        # Architecture diagram
│   └── raw.md                   # Project vision & concepts
├── test/                        # Test harness (legacy)
├── tools/                       # Utility scripts
├── Makefile                     # Build and run commands
├── docker-compose.yml           # Main compose file
└── README.md                    # This file
```

## Development

### Running Individual Services

**Frontend Development:**

```bash
cd src/ui
npm install
npm run dev
```

**UI API Development:**

```bash
cd apps/ui-api
npm install
npm run dev
```

**Python Workers:**

1. Create virtual environment:

   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run with Dapr:

   ```bash
   # Example for azdo-worker
   dapr run --app-id azdo-worker \
     --app-port 5001 \
     --dapr-http-port 3500 \
     --resources-path ../dapr/components \
     --config ../dapr/configuration/config.yaml \
     -- python src/main.py
   ```

### Building Services

```bash
# Build UI
make build-ui

# Build UI API
make build-ui-api

# Build AI services
make build-cc
make build-cc-svc

# Build Docker images
docker-compose build
```

### Running Tests

**Integration tests** require services to be running:

```bash
# Terminal 1: Start github-issues-mcp
make run-github-issues-mcp

# Terminal 2: Start cc-svc
make run-cc-svc

# Terminal 3: Run integration tests
make test-integration

# Or watch mode
make test-integration-watch
```

### Adding New Features

1. Implement feature in appropriate service
2. Update relevant tests
3. Update documentation
4. Submit pull request

## Core Concepts

### Queries

Queries extract data from structured sources like Azure DevOps APIs or databases. They can be customized to suit specific project needs and run against multiple data sources.

### Commands

Commands process and structure data extracted by queries. They perform operations like filtering, sorting, aggregating, and transforming data to derive insights.

### Data Visualization

Built with D3.js, the visualization tools provide charts, graphs, and interactive dashboards that help teams identify trends, patterns, and relationships in project data.

### Behavioral Change

mndy promotes positive team behaviors by:

- **Transparency** - Making metrics visible to all team members
- **Accountability** - Tracking time management and work item progress
- **Data-Driven Decisions** - Replacing guesswork with factual insights
- **Continuous Improvement** - Identifying areas for process optimization

## Documentation

- [Architecture Overview](docs/architecture.html) - System architecture and component interactions
- [Project Vision & Concepts](docs/raw.md) - Detailed vision, benefits, and core concepts
- [Makefile Commands](Makefile) - All available build and run commands

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- Code follows existing style conventions
- All tests pass
- Documentation is updated
- Commit messages are descriptive

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contact

- **Issues**: [GitHub Issues](https://github.com/stiproot/mndy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/stiproot/mndy/discussions)
- **Author**: Simon Stipcich - [code.stip.si@gmail.com](mailto:code.stip.si@gmail.com)

---

**Built with:**
Vue 3 • TypeScript • Python • FastAPI • Dapr • MongoDB • RabbitMQ • Docker • D3.js • Quasar Framework
