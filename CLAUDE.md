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

## Commands

### Development
- `make serve-ui` - Frontend dev server (port 8080)
- `make run-ui-api` - API gateway (port 3001)
- `make run-azdo-worker` - Azure DevOps worker
- `make docker-compose` - Start all services with Docker

### Build
- `make build-ui` - Build frontend
- `make build-ui-api` - Build API gateway
- `make build-framework-pkg` - Build mndy-framework package
- `make install-framework-pkg` - Install framework in workers

## Linting

Each service has its own linting configuration:
- **Python workers**: uv (check pyproject.toml)
- **Node/TypeScript**: prettier + eslint (check package.json)
- **C# services**: SonarQube

Run service-specific linters before committing. Do not manually format code.

## Workflow

- Workers depend on mndy-framework - rebuild package after changes
- Environment variables: copy `.env.template` to `.env` for each service
- Test individual services before full docker-compose
