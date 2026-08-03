# mndy

Project analytics platform for Azure DevOps integration.

## Architecture

Microservices architecture using Dapr:

- `src/ui/` - Vue 3 + TypeScript + Quasar frontend
- `src/ui-api/` - Express.js API gateway (Node/TS)
- `src/azdo-worker/` - Azure DevOps data collection (Python/FastAPI)
- `src/insights-worker/` - Analytics processing (Python/FastAPI)
- `src/workflows-worker/` - Workflow orchestration (Python/FastAPI)
- `src/mndy-framework/` - Shared Python package (used by all workers)

MCP (Model Context Protocol) servers:

- `src/mcp-core/` - Shared TypeScript library for building MCP servers
- `src/github-issues-mcp/` - GitHub Issues MCP server (port 3001)
- `src/ga4-mcp/` - Google Analytics 4 MCP server (port 3003)
- `src/meta-ads-mcp/` - Meta Ads MCP server (port 3004)
- `src/shopify-mcp/` - Shopify MCP server (port 3005)
- `src/dapr-mcp/` - Dapr state/cache MCP server (port 3006, requires a Dapr sidecar)
- `src/markdown-mcp/` - Markdown MCP server (port 3008)
- `src/google-ads-mcp/` - Google Ads MCP server (in progress; no make target yet)

The analytics servers (GA4, Meta Ads, Shopify) and github-issues need **no
infrastructure** — they are plain HTTP processes needing only their own `.env`.
Only `dapr-mcp` requires a Dapr sidecar plus `make docker-compose-infra`.

## Commands

Use `make help` to see all available commands. The Makefile is the single entry point.

### Install

- `make install` - Install all dependencies (Node + Python)
- `make install-node` - Install Node.js dependencies only
- `make install-python` - Install Python dependencies only

### Development

- `make serve-ui` - Frontend dev server (port 8080)
- `make run-ui-api` - API gateway with Dapr (port 3001)
- `make run-azdo-worker` - Azure DevOps worker
- `make run-azdoproxy-worker` - Azure DevOps proxy worker
- `make run-insights-worker` - Insights worker
- `make run-workflows-worker` - Workflows worker

### Build

- `make build` - Build all services
- `make build-ui` - Build frontend
- `make build-ui-api` - Build API gateway
- `make build-mcp` - Build all MCP packages

### MCP Servers

- `make run-github-issues-mcp` - GitHub Issues MCP server (port 3001). [Details](src/github-issues-mcp/README.md)
- `make run-analytics-mcps` - GA4 + Meta + Shopify together, no infra needed
- `make run-ga4-mcp` / `run-meta-ads-mcp` / `run-shopify-mcp` - individually
- `make run-markdown-mcp` - Markdown MCP server (port 3008)
- `make run-dapr-mcp` - Dapr MCP server (needs a sidecar + infra, port 3006)

**Multi-brand:** the GA4 and Meta tools take a per-call `propertyId` /
`adAccountId` that overrides the server's `.env` default, so one running server
serves many brands without a restart. Brands live in a gitignored
`mndy-brands.json`; the template is at
`plugin-marketplace/plugins/mndy-mcp/skills/brands/mndy-brands.example.json`.
Shopify is single-store per running server. See the `brands` skill.

### Lint

- `make lint` - Run all linters
- `make lint-md` - Lint markdown files
- `make lint-md-fix` - Fix markdown lint issues
- `make lint-node` - Lint Node.js/TypeScript code
- `make lint-python` - Lint Python code

### Docker

- `make docker-compose` - Start all services (infrastructure + apps)
- `make docker-compose-infra` - Start infrastructure only (Dapr, MongoDB, RabbitMQ, Zipkin)
- `make docker-compose-arm` - Start all services (ARM/Apple Silicon)
- `make docker-compose-arm-infra` - Start infrastructure only (ARM/Apple Silicon)

### Maintenance

- `make lock` - Regenerate all lock files
- `make clean` - Clean all build artifacts

## Workspaces

This repo uses workspaces for dependency management:

- **Python**: uv workspace (pyproject.toml at root)
- **Node.js**: bun workspace (package.json at root)

## Linting

Each service has its own linting configuration:

- **Python workers**: ruff (check pyproject.toml)
- **Node/TypeScript**: prettier + eslint (check package.json)
- **Markdown**: markdownlint (strict defaults)

## Workflow

- Workers depend on mndy-framework (shared via workspace)
- Environment variables: copy `.env.template` to `.env` for each service
- Test individual services before full docker-compose

## Effect-TS Migration

**Status:** Active migration in progress

**Services being migrated (in order):**

1. `src/github-issues-mcp/` - **Completed** (Effect Services, Schema, Config)
2. `src/mcp-core/` - Pending
3. `src/ui-api/` - Pending (highest complexity)

**Standards:** See `docs/guides/effect-ts-standards.md` for comprehensive patterns

**Key Principles:**

- Use `Effect.gen` for business logic, `.pipe()` for transformations
- Define tagged errors with `Data.TaggedError`
- Model dependencies as Services (no module-level singletons)
- Use `Schema` for runtime validation
- Use `Config` module for environment variables (not `process.env`)
- Handle errors with `catchTag`/`catchTags`, not try-catch
