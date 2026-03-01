# ==============================================================================
# mndy Makefile
# Single entry point for all repository commands
# ==============================================================================

# Container runtime (override with: make DOCKER=docker docker-compose)
DOCKER ?= podman

.PHONY: install install-node install-python \
        dev serve-ui run-ui-api run-azdo-worker run-azdoproxy-worker run-insights-worker run-workflows-worker \
        run-github-issues-mcp build-mcp build-cc build-cc-svc run-cc-svc \
        build build-ui build-ui-api \
        lint lint-md lint-md-fix lint-python lint-node \
        lock lock-python lock-node \
        docker-compose docker-compose-infra docker-compose-arm docker-compose-arm-infra docker-compose-ai docker-compose-ai-arm \
        test-integration test-integration-watch test-mcp test-cc-svc \
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
	bun run --cwd src/ui serve

run-ui-api: ## Run UI API gateway with Dapr (port 3001)
	dapr run --app-id mndy-ui-api \
		--placement-host-address localhost:50000 \
		--config src/dapr/configuration/config.yaml \
		--resources-path src/dapr/components.local/ \
		--dapr-http-port 3500 \
		--app-port 3001 \
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

run-github-issues-mcp: ## Run GitHub Issues MCP server (port 3001)
	bun run --cwd src/github-issues-mcp start

build-mcp: ## Build all MCP packages
	bun run --cwd src/mcp-core build
	bun run --cwd src/github-issues-mcp build

# ==============================================================================
# Claude Code / Agent
# ==============================================================================

build-cc: ## Build Claude Code core package
	bun run --cwd src/cc-core build

build-cc-svc: build-cc ## Build Claude Code service
	bun run --cwd src/cc-svc build

run-cc-svc: ## Run Claude Code service (port 3002)
	bun run --cwd src/cc-svc start

# ==============================================================================
# Build
# ==============================================================================

build: build-ui build-ui-api ## Build all services

build-ui: ## Build frontend for production
	bun run --cwd src/ui build

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
	bun run --cwd src/ui lint
	bun run --cwd src/ui-api lint || true

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
	$(DOCKER) compose -p mndy up --build

docker-compose-arm: ## Start all services with Docker Compose (ARM)
	$(DOCKER) compose -p mndy -f docker-compose.yml -f docker-compose.arm.yml --env-file .core.env --profile apps up --build

docker-compose-arm-infra: ## Start infrastructure only (ARM)
	$(DOCKER) compose -p mndy -f docker-compose.yml -f docker-compose.arm.yml --env-file .core.env up --build

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

test-cc-svc: ## Run cc-svc integration tests
	bun run vitest run tests/integration/cc-svc/

# ==============================================================================
# Clean
# ==============================================================================

clean: clean-node clean-python ## Clean all build artifacts

clean-node: ## Clean Node.js artifacts
	rm -rf node_modules
	rm -rf src/ui/node_modules src/ui/dist
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
