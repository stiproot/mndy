# Monorepo maturity

Status: Active — bring mndy up to h's structural standard: shared Claude Code plugins,
an `apps/` + `packages/` monorepo, Effect-based MCP servers whose logic lives in packages,
hardened analytics-only-mode docs, and a Google Ads MCP.
Established: 2026-08-06

## Why

Two forces drove this plan.

**The analytics MCP servers outgrew the repo they live in.** GA4, Meta Ads and Shopify
turned out to be the most-used thing mndy produces, and they are consumed through the
`mndy-mcp` plugin by agents that want *only* those servers — no Dapr, no MongoDB, no
RabbitMQ, no docker-compose. That "minimal analytics MCP mode" is a real, first-class way
to use this repo, but it was documented as an aside rather than as a mode. It needs to be
stated plainly and defended by structure, not by prose alone.

**The repo never grew up structurally.** Everything lives in a flat `src/`, libraries and
runnable services are indistinguishable, there is no build orchestration, and no lint
guard enforces any boundary. [h](https://github.com/stiproot/h) is the gold standard we
are copying: `apps/` + `packages/{js,py}`, turbo, a battery of `scripts/check-*.mjs`
guards, dependency-cruiser hex boundaries, and a set of shared Claude Code plugins that
carry the conventions.

## The core architectural principle

**Reusable machinery lives in `packages/`. Apps are containers.**

An MCP server or a service is a *wrapper* — a composition root plus a presentation layer
(tool schemas and registration, HTTP wiring, config). The logic it wraps — the domain
model, the KPI math, the platform clients — belongs in a package, where it can be reused
by another MCP server, a worker, or a test without dragging a server along with it.

Concretely, per the `hex-arch` plugin's layering:

| Layer | Home |
| --- | --- |
| Pure domain + ports (no I/O) | `packages/js/<name>-core/src/domain/` |
| Outbound adapters (vendor SDKs, HTTP) | `packages/js/<name>-core/src/infrastructure/` |
| Inbound adapters (MCP tools, routes) | `apps/<name>-mcp/src/presentation/` |
| Composition root (wiring) | `apps/<name>-mcp/src/index.ts` |

If you find yourself writing business logic inside `apps/`, it is in the wrong place.

## The parts

| # | Part | Status |
| --- | --- | --- |
| 01 | [Plugin consumption](./01-plugin-consumption.md) | Complete |
| 02 | [Monorepo restructure](./02-monorepo-restructure.md) | Complete |
| 03 | [MCP servers onto Effect + packages](./03-mcp-effect-refactor.md) | Planning |
| 04 | [Analytics-mode doc hardening](./04-analytics-mode-docs.md) | Planning |
| 05 | [Google Ads MCP](./05-google-ads-mcp.md) | Planning |

The parts are ordered by dependency: plugins carry the conventions the later parts follow;
the restructure creates the `packages/` homes part 03 moves logic into; part 05 is written
against the finished shape so the new server is born correct rather than retrofitted.

## Shared context

**Gold standard.** `../h/` — mirror its layout, its `scripts/check-*.mjs` guard pattern,
its `.dependency-cruiser.cjs`, and its `.claude/settings.json` plugin wiring. Where mndy
must diverge, say so in the relevant part and why.

**Branching.** Work lands on `main`, fix-forward, one commit per part.

**Agreed layout mapping** (settled 2026-08-06, full h mirror):

```
apps/        ui, vis, azdo, ui-api, azdo-worker, azdoproxy-worker,
             insights-worker, workflows-worker, azdoproxy-api, cc-svc,
             dapr-actor-svc, and every *-mcp server
packages/js/ mcp-core, dapr-core, cc-core, + the new *-core domain packages
packages/py/ mndy-framework
config/      dapr components, wiremock mappings
tools/       loose python scripts, d3-lab
```

`src/` disappears entirely. Nothing is deleted in this pass — unmaintained code
(`d3-lab`, `azdoproxy-api`, the wiremock mappings, `tools/*.py`) is relocated as-is and
left for a later judgement call.
