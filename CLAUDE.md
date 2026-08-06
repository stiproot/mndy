# mndy

Project analytics platform for Azure DevOps integration.

## Conventions come from plugins

The repo's working conventions are carried by installed Claude Code plugins
(`.claude/settings.json`), not restated here. Follow the plugin's skill; this file holds
only mndy's concrete policy on top of it.

| Plugin | Owns |
| --- | --- |
| `effect-claude-primitives` | Effect-TS patterns — services, schema, error channel, concurrency |
| `hex-arch` | Ports-and-adapters layering (`domain` / `infrastructure` / `presentation`) |
| `plan-management` | The plan doc lifecycle |
| `code-comprehension` | Generated code diagrams (`gen-code-diagram`) |
| `c4-mermaid-plugin` | C4 architecture diagrams |
| `mndy-mcp` | This repo's own MCP usage surface (local marketplace) |

`effect-claude-primitives` resolves through a **user-level** marketplace pointing at a
local checkout, so it is deliberately absent from `.claude/settings.json`. A fresh clone
needs it added once:

```bash
claude plugin marketplace add https://github.com/stiproot/effect-claude-primitives
```

## Plans

Non-trivial work is scoped and tracked in a plan doc — a living log, not a frozen spec.
**Follow the `plan-management` skill** for the lifecycle; mndy's concrete policy:

- Active plans: `docs/plans/<name>.md`. Archived: `docs/plans/impl/<name>.md`.
- A plan with several independent phases becomes a directory —
  `docs/plans/<name>/README.md` (index + shared context) plus numbered parts, each with
  its own status line. It archives as a unit, gated on every part being `Complete`.
- There is no index file: the `docs/plans/` listing plus each plan's status line **is** the
  index.
- Every plan declares `Status:` (`Planning | Active | Blocked | Deferred | Complete`) and
  `Established:`. A `Deferred` plan must carry `Revisit when:`; an archived one, `Lifted to:`.
- Never leave a plan in `~/.claude/plans/` — move it into `docs/plans/` as soon as it is real.
- Before archiving, **lift every piece of lasting context to its one long-lived home**
  (this file, a rule under `.claude/rules/`, a skill, a lint guard, or a code comment).
  Plans are transient; knowledge left inside one is lost when it is filed away.
- **Source code never cites `docs/plans/*`** — state the rationale in the comment itself
  or cite the durable home.

## Where code lives

**Reusable machinery lives in `packages/`. Apps are containers.**

An MCP server or a service is a *wrapper*: a composition root plus a presentation layer
(tool schemas, registration, HTTP wiring, config). The logic it wraps — domain models, KPI
math, platform clients — belongs in a package, reusable by another server, a worker, or a
test without dragging a server along.

| Layer | Home |
| --- | --- |
| Pure domain + ports (no I/O) | `packages/js/<name>-core/src/domain/` |
| Outbound adapters (vendor SDKs, HTTP) | `packages/js/<name>-core/src/infrastructure/` |
| Inbound adapters (MCP tools, routes) | `apps/<name>/src/presentation/` |
| Composition root (wiring) | `apps/<name>/src/index.ts` |

Business logic inside `apps/` is in the wrong place. The boundaries are machine-checked by
`.dependency-cruiser.cjs`; see the `hex-arch` skill for the layering rules.

## Diagrams

Diagrams live in `docs/diagrams/` and are of two kinds:

- **Generated** — class, component and sequence diagrams extracted from the source by
  `gen-code-diagram` (the `code-comprehension` plugin, also a root devDependency so CI can
  run it). These are checked, not hand-edited: `gen-code-diagram --check --dir docs/diagrams`
  fails the build when a diagram has drifted from the code it describes.
- **Authored** — C4 context/container/component views written by hand via the
  `c4-mermaid-plugin` skills, for architecture that no extractor can infer.

Prefer a generated diagram wherever one is possible; hand-drawn code diagrams rot.

## Repository layout

```text
apps/          things you run
packages/js/   TypeScript libraries — the reusable machinery
packages/py/   Python libraries
config/        declarative infrastructure (Dapr components, wiremock mappings)
tools/         loose scripts and sandboxes
scripts/       repo tooling — the check-*.mjs lint guards live here
tests/         cross-service integration tests
docs/          guides, plans, diagrams
```

Workspaces are glob-based: bun takes `apps/*`, `packages/js/*` and `scripts`; uv takes the
four Python workers plus `packages/py/mndy-framework`. Adding a package means creating the
directory — there is no list to update. `apps/azdoproxy-api` is C# and deliberately sits
in neither workspace.

### Applications

Microservices architecture using Dapr:

| App | Stack | Notes |
| --- | --- | --- |
| `apps/ui` | Vue 3 + TypeScript + Quasar | main frontend |
| `apps/vis`, `apps/azdo` | Vue 3 | satellite frontends |
| `apps/ui-api` | Express.js | API gateway (port 3001) |
| `apps/azdo-worker` | Python/FastAPI | Azure DevOps data collection |
| `apps/azdoproxy-worker` | Python/FastAPI | Azure DevOps proxy |
| `apps/insights-worker` | Python/FastAPI | analytics processing |
| `apps/workflows-worker` | Python/FastAPI | workflow orchestration |
| `apps/azdoproxy-api` | C#/.NET | Azure DevOps proxy API |
| `apps/cc-svc` | Node/TS | code-comprehension service (port 3002) |
| `apps/dapr-actor-svc` | Node/TS | Dapr actor host (port 3007) |

### MCP servers

| Server | Port | Infrastructure |
| --- | --- | --- |
| `apps/ga4-mcp` | 3003 | none |
| `apps/meta-ads-mcp` | 3004 | none |
| `apps/shopify-mcp` | 3005 | none |
| `apps/dapr-mcp` | 3006 | **Dapr sidecar + `make docker-compose-infra`** |
| `apps/markdown-mcp` | 3008 | none |
| `apps/github-issues-mcp` | 3009 | none |
| `apps/google-ads-mcp` | — | none (in progress) |

**Only `dapr-mcp` needs infrastructure.** Every other server is a plain HTTP process
needing nothing but its own `.env` and a free port. See the Modes section for what that
enables.

### Shared packages

| Package | Role |
| --- | --- |
| `packages/js/mcp-core` | the MCP server framework every `*-mcp` app is built on |
| `packages/js/dapr-core` | Dapr client wrapper |
| `packages/js/cc-core` | code-comprehension core |
| `packages/py/mndy-framework` | shared Python package used by all workers |

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

- `make run-github-issues-mcp` - GitHub Issues MCP server (port 3009). [Details](apps/github-issues-mcp/README.md)
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

1. `apps/github-issues-mcp/` - **Completed** (Effect Services, Schema, Config)
2. `packages/js/mcp-core/` - Pending
3. `apps/ui-api/` - Pending (highest complexity)

**Standards:** See `docs/guides/effect-ts-standards.md` for comprehensive patterns

**Key Principles:**

- Use `Effect.gen` for business logic, `.pipe()` for transformations
- Define tagged errors with `Data.TaggedError`
- Model dependencies as Services (no module-level singletons)
- Use `Schema` for runtime validation
- Use `Config` module for environment variables (not `process.env`)
- Handle errors with `catchTag`/`catchTags`, not try-catch
