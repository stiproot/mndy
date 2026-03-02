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
- `src/github-issues-mcp/` - GitHub Issues MCP server

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
