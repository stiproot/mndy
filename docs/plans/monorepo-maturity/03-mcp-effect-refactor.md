# 03 — MCP servers onto Effect + packages

Status: Planning — move MCP logic out of the servers into `packages/js/*-core`, on Effect throughout.
Established: 2026-08-06

Part of [monorepo-maturity](./README.md). The packages-hold-the-logic principle is stated
there and is the whole point of this part.

## Goal

Today every MCP server is a self-contained silo: `src/<name>-mcp/src/services/<name>.ts`
holds the vendor SDK client, the domain logic and the error handling, reachable only by
that one server. Nothing can reuse it — not another MCP server, not a worker, not a test
harness, not the `cc-svc` analysis path that arguably wants the same GA4 client.

After this part, an MCP server is a **container**: config, tool schemas, tool registration,
and a composition root. Everything it wraps lives in a package.

## Target shape

```
packages/js/analytics-core/       pure domain, zero I/O
  src/domain/                       metric model, KPI math (CPA/ROAS/CTR/CVR/AOV),
                                    anomaly thresholds, currency + timezone normalization,
                                    brand-registry resolution, the ports
packages/js/ga4-core/
  src/domain/ports.ts               IGa4Reader
  src/infrastructure/               Effect service over @google-analytics/data
packages/js/meta-ads-core/        … same shape, facebook-nodejs-business-sdk
packages/js/shopify-core/         … @shopify/shopify-api
packages/js/google-ads-core/      … (part 05 fills this in)
packages/js/github-core/          … @octokit/rest
packages/js/mcp-core/             existing — the server framework itself

apps/ga4-mcp/
  src/presentation/tools/           schemas + registerTool
  src/index.ts                      composition root: Config → services → server
```

`analytics-core` is the payoff. The KPI formulas and anomaly thresholds currently live in
`.claude/rules/marketing-analytics.md` as *prose for the agent to reimplement*. They become
tested code in one package, and the rules file cites it instead of restating it.

## Effect work

Per `.claude/rules/mcp-server.md` and the `effect-claude-primitives` skills. Current state:

| Server | Effect today | Gap |
| --- | --- | --- |
| `github-issues-mcp` | Migrated (Service, Schema, Config) | Split into `github-core` + container |
| `ga4-mcp` | Partial — depends on `effect` | Audit against the rules; extract to `ga4-core` |
| `meta-ads-mcp` | Partial | Same |
| `shopify-mcp` | Partial | Same |
| `dapr-mcp` | Partial | Same |
| `markdown-mcp` | Partial | Same |
| `mcp-core` | **Not migrated — still zod + raw express** | The big one |

`mcp-core` is the blocker: it exposes a `zod`-based `registerTool` while every rule says
Effect `Schema`. Servers currently bridge between the two. Migrating `mcp-core` first
removes the bridge, so it goes first even though it is the riskiest.

Everything else follows the existing rules: `Data.TaggedError` per domain, `Config` module
over `process.env`, clients constructed inside `Effect.Service` (never module-level),
`timeoutFail` + jittered exponential `retry` on every outbound call, `withSpan` for
observability.

## Enforcement

- `.dependency-cruiser.cjs` (landed in part 02) starts biting once `domain/` directories
  exist: domain must not import infrastructure, presentation, or any I/O library.
- `scripts/check-hex-lint.mjs` fails any package with hex layers whose `lint` script does
  not run depcruise.
- Consider a `check-mcp-parity.mjs` in h's spirit: every MCP server declared in the
  `mndy-mcp` plugin's `.mcp.json` has a matching app, Makefile target, `.env.template` and
  skill — the exact drift that let `google-ads-mcp` sit half-built.

## Risks

- **`mcp-core`'s zod→Schema migration is a breaking change across seven servers.** Land it
  with the servers in one commit, not incrementally.
- **Don't let the extraction become a rewrite.** Move logic first, preserving behaviour;
  improve it after the tests still pass. The integration tests under `tests/integration/`
  are the safety net and must keep passing at every step.
