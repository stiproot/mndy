# ==============================================================================
# mndy Makefile
# Single entry point for all repository commands
# ==============================================================================

# Container runtime (override with: make DOCKER=docker docker-compose)
DOCKER ?= podman

.PHONY: install install-node install-python \
        dev serve-ui serve-vis serve-azdo run-ui-api run-azdo-worker run-azdoproxy-worker run-insights-worker run-workflows-worker \
        run-github-issues-mcp run-ga4-mcp run-meta-ads-mcp run-shopify-mcp run-markdown-mcp run-dapr-mcp run-dapr-actor-svc build-mcp build-dapr build-dapr-actor-svc build-cc build-cc-svc run-cc-svc \
        refresh-meta-token \
        build build-ui build-vis build-azdo build-ui-api \
        lint lint-md lint-md-fix lint-python lint-node lint-vis \
        lock lock-python lock-node \
        docker-compose docker-compose-infra docker-compose-arm docker-compose-arm-infra docker-compose-ai docker-compose-ai-arm \
        test-integration test-integration-watch test-mcp test-ga4-mcp test-meta-ads-mcp test-shopify-mcp test-dapr-mcp test-cc-svc test-cc-svc-dapr-mcp test-cc-svc-brand-insights test-cc-svc-data-collection test-cc-svc-brand-analysis test-cc-svc-brand-e2e \
        clean clean-node clean-python \
        help

# ==============================================================================
# Install
# ==============================================================================

install: install-node install-python ## Install all dependencies

install-node: ## Install Node.js dependencies (bun workspace)
	bun install

install-python: ## Install Python dependencies (uv workspace)
	uv sync

# ==============================================================================
# Development
# ==============================================================================

serve-ui: ## Run frontend dev server (port 8080)
	bun run --cwd src/apps/ui serve

serve-vis: ## Run vis dev server (port 8082)
	bun run --cwd src/apps/vis serve

serve-azdo: ## Run azdo module dev server (port 8083)
	bun run --cwd src/apps/azdo serve

run-ui-api: build-ui-api ## Run UI API gateway with Dapr (port 3001)
	dapr run --app-id mndy-ui-api \
		--placement-host-address localhost:50000 \
		--enable-app-health-check=false \
		--scheduler-host-address="" \
		--dapr-http-port 3500 \
		--app-port 3001 \
		--components-path src/dapr/components.localhost \
		-- bun run --cwd src/ui-api start

run-azdo-worker: ## Run Azure DevOps worker with Dapr (port 6006)
	cd src/azdo-worker/src && \
	dapr run --app-id mndy-azdo-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- uv run --package azdo-worker uvicorn main:app --host 0.0.0.0 --port 6006

run-azdoproxy-worker: ## Run Azure DevOps proxy worker with Dapr (port 6006)
	cd src/azdoproxy-worker/src && \
	dapr run --app-id mndy-azdoproxy-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- uv run --package azdoproxy-worker uvicorn main:app --host 0.0.0.0 --port 6006

run-insights-worker: ## Run insights worker with Dapr (port 6006)
	cd src/insights-worker/src && \
	dapr run --app-id mndy-insights-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- uv run --package insights-worker uvicorn main:app --host 0.0.0.0 --port 6006

run-workflows-worker: ## Run workflows worker with Dapr (port 6006)
	cd src/workflows-worker/src && \
	dapr run --app-id mndy-workflows-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- uv run --package workflows-worker uvicorn main:app --host 0.0.0.0 --port 6006

# ==============================================================================
# MCP Servers
# ==============================================================================

run-github-issues-mcp: build-mcp ## Run GitHub Issues MCP server (port 3001)
	bun run --cwd src/github-issues-mcp start

run-ga4-mcp: build-mcp ## Run GA4 MCP server (port 3001)
	bun run --cwd src/ga4-mcp start

run-meta-ads-mcp: build-mcp ## Run Meta Ads MCP server (port 3004)
	bun run --cwd src/meta-ads-mcp start

run-shopify-mcp: build-mcp ## Run Shopify MCP server (port 3001)
	bun run --cwd src/shopify-mcp start

run-markdown-mcp: build-mcp ## Run Markdown MCP server (port 3008)
	bun run --cwd src/markdown-mcp start

run-dapr-mcp: build-dapr ## Run Dapr MCP server with Dapr sidecar (port 3006)
	dapr run --app-id mndy-dapr-mcp \
		--placement-host-address localhost:50000 \
		--enable-app-health-check=false \
		--scheduler-host-address="" \
		--dapr-http-port 3500 \
		--app-port 3006 \
		--components-path src/dapr/components.localhost \
		-- bun run --cwd src/dapr-mcp start

build-mcp: ## Build all MCP packages
	bun run --cwd src/mcp-core build
	bun run --cwd src/github-issues-mcp build
	bun run --cwd src/ga4-mcp build
	bun run --cwd src/meta-ads-mcp build
	bun run --cwd src/shopify-mcp build
	bun run --cwd src/markdown-mcp build

build-dapr: ## Build Dapr core and MCP packages
	bun run --cwd src/dapr-core build
	bun run --cwd src/dapr-mcp build

build-dapr-actor-svc: ## Build Dapr actor service
	bun run --cwd src/dapr-core build
	bun run --cwd src/dapr-actor-svc build

run-dapr-actor-svc: build-dapr-actor-svc ## Run Dapr actor service with sidecar (port 3007)
	dapr run --app-id mndy-dapr-actor-svc \
		--placement-host-address localhost:50000 \
		--enable-app-health-check=false \
		--scheduler-host-address="" \
		--dapr-http-port 3501 \
		--app-port 3007 \
		--components-path src/dapr/components.localhost \
		-- bun run --cwd src/dapr-actor-svc start

# ==============================================================================
# Scripts
# ==============================================================================

refresh-meta-token: ## Refresh Meta access token and update .env file
	bun run --cwd scripts refresh-meta-token

# ==============================================================================
# Claude Code / Agent
# ==============================================================================

build-cc: ## Build Claude Code core package
	bun run --cwd src/cc-core build

build-cc-svc: build-cc ## Build Claude Code service
	bun run --cwd src/cc-svc build

run-cc-svc: build-cc-svc ## Run Claude Code service (port 3002)
	bun run --cwd src/cc-svc start

# ==============================================================================
# Build
# ==============================================================================

build: build-ui build-vis build-azdo build-ui-api ## Build all services

build-ui: ## Build frontend for production
	bun run --cwd src/apps/ui build

build-vis: ## Build vis module
	bun run --cwd src/apps/vis build

build-azdo: ## Build azdo module
	bun run --cwd src/apps/azdo build

build-ui-api: ## Build UI API
	bun run --cwd src/ui-api build

# ==============================================================================
# Lint
# ==============================================================================

lint: lint-md lint-node ## Run all linters

lint-md: ## Lint markdown files
	bun run lint:md

lint-md-fix: ## Fix markdown lint issues
	bun run lint:md:fix

lint-node: ## Lint Node.js/TypeScript code
	bun run --cwd src/apps/ui lint
	bun run --cwd src/apps/vis lint
	bun run --cwd src/ui-api lint || true

lint-vis: ## Lint vis code
	bun run --cwd src/apps/vis lint

lint-python: ## Lint Python code
	uv run --package azdo-worker ruff check src/azdo-worker/src || true
	uv run --package insights-worker ruff check src/insights-worker/src || true
	uv run --package azdoproxy-worker ruff check src/azdoproxy-worker/src || true
	uv run --package workflows-worker ruff check src/workflows-worker/src || true

# ==============================================================================
# Lock Files
# ==============================================================================

lock: lock-python lock-node ## Regenerate all lock files

lock-python: ## Regenerate Python lock file
	uv lock

lock-node: ## Regenerate Node.js lock file
	bun install --frozen-lockfile=false

# ==============================================================================
# Docker
# ==============================================================================

docker-compose: ## Start all services with Docker Compose
	$(DOCKER) compose -p mndy --profile apps up --build

docker-compose-infra: ## Start infrastructure only (Dapr, MongoDB, RabbitMQ, Zipkin)
	$(DOCKER) compose -p mndy up

docker-compose-arm: ## Start all services with Docker Compose (ARM)
	$(DOCKER) compose -p mndy -f docker-compose.yml -f docker-compose.arm.yml --env-file .core.env --profile apps up --build

docker-compose-arm-infra: ## Start infrastructure only (ARM)
	$(DOCKER) compose -p mndy -f docker-compose.yml -f docker-compose.arm.yml --env-file .core.env up

docker-compose-ai: ## Start AI services (cc-svc, github-issues-mcp)
	$(DOCKER) compose -p mndy --profile ai up --build

docker-compose-ai-arm: ## Start AI services (ARM)
	$(DOCKER) compose -p mndy -f docker-compose.yml -f docker-compose.arm.yml --profile ai up --build

# ==============================================================================
# Test
# ==============================================================================

test-integration: ## Run all integration tests (requires services running)
	bun run vitest run tests/integration/

test-integration-watch: ## Run integration tests in watch mode
	bun run vitest tests/integration/

test-mcp: ## Run github-issues-mcp integration tests
	bun run vitest run tests/integration/github-issues-mcp/

test-ga4-mcp: ## Run ga4-mcp integration tests
	bun run vitest run tests/integration/ga4-mcp/

test-meta-ads-mcp: ## Run meta-ads-mcp integration tests
	bun run vitest run tests/integration/meta-ads-mcp/

test-shopify-mcp: ## Run shopify-mcp integration tests
	bun run vitest run tests/integration/shopify-mcp/

test-dapr-mcp: ## Run dapr-mcp integration tests
	bun run vitest run tests/integration/dapr-mcp/

test-cc-svc: ## Run cc-svc integration tests
	bun run vitest run tests/integration/cc-svc/

test-cc-svc-dapr-mcp: ## Run cc-svc dapr-mcp integration tests
	bun run vitest run tests/integration/cc-svc/dapr-mcp.test.ts

test-cc-svc-brand-insights: ## Run cc-svc brand-insights integration tests (legacy endpoint)
	bun run vitest run tests/integration/cc-svc/brand-insights.test.ts

test-cc-svc-data-collection: ## Run cc-svc data-collection integration tests
	bun run vitest run tests/integration/cc-svc/data-collection.test.ts

test-cc-svc-brand-analysis: ## Run cc-svc brand-analysis integration tests
	bun run vitest run tests/integration/cc-svc/brand-analysis.test.ts

test-cc-svc-brand-e2e: ## Run cc-svc brand insights E2E tests (collect -> analyze)
	bun run vitest run tests/integration/cc-svc/brand-insights-e2e.test.ts

# ==============================================================================
# Clean
# ==============================================================================

clean: clean-node clean-python ## Clean all build artifacts

clean-node: ## Clean Node.js artifacts
	rm -rf node_modules
	rm -rf src/apps/ui/node_modules src/apps/ui/dist
	rm -rf src/apps/vis/node_modules src/apps/vis/dist
	rm -rf src/apps/azdo/node_modules src/apps/azdo/dist
	rm -rf src/ui-api/node_modules src/ui-api/dist
	rm -rf src/d3-lab/node_modules

clean-python: ## Clean Python artifacts
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".venv" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# ==============================================================================
# Help
# ==============================================================================

help: ## Show this help message
	@echo "mndy - Project Analytics Platform"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
