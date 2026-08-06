# 03 — MCP servers onto Effect + packages

Status: Complete — five packages carry the logic; four servers are containers on a shared runtime.
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

```text
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

## What was done

**Five new packages under `packages/js/`:**

| Package | Contents |
| --- | --- |
| `analytics-core` | The pure cross-platform domain: canonical metric vocabulary, KPI math, anomaly thresholds, brand registry, money/timezone helpers, shared `TimeoutError`/`ConfigError`. 31 tests. |
| `ga4-core` | GA4 domain + Data API adapter |
| `meta-ads-core` | Meta domain + Marketing API adapter, 5 tests |
| `shopify-core` | Shopify domain + Admin API adapter |
| `github-core` | GitHub issues domain + REST adapter |

**Four servers reduced to containers** — `ga4-mcp`, `meta-ads-mcp`, `shopify-mcp`,
`github-issues-mcp` now hold only `config.ts`, `runtime.ts`, `presentation/tools/*` and a
composition root. No vendor SDK appears in any app's dependencies.

`mcp-core` gained `createServerRuntime`. Every package with hex layers runs depcruise, and
`check-hex-lint.mjs` enforces that.

## Findings

**1. Every tool call was building a new platform client.** The registration idiom was

```typescript
(args) => Effect.runPromise(toolEffect(args).pipe(Effect.provide(Service.Default)))
```

`Effect.provide` builds the layer while *executing* the effect, and `runPromise` makes a
fresh runtime per call — so every request constructed a new `BetaAnalyticsDataClient`, a new
Octokit, a new Shopify session, discarding pools and redoing auth. `ManagedRuntime`, built
once at the composition root, fixes it and adds a real shutdown path (`dispose()` runs layer
finalizers; `runPromise` never did). This is now `createServerRuntime` in `mcp-core` and is
a documented anti-pattern in the rules.

**2. The "never use zod" rule was unachievable, and the workaround was worse.** The MCP SDK
accepts only zod for `inputSchema` — `AnySchema = z3.ZodTypeAny | z4.$ZodType`, no JSON
Schema path. So each analytics server declared its tool input **twice**: a zod shape the SDK
used, and an Effect Schema in `types.ts` that nothing used and that had already drifted. The
rule now says what is actually true: zod is an inbound-adapter concern confined to
`presentation/`, Effect Schema is for decoding vendor responses and config files.

**3. Meta's insight totals printed `$` regardless of account currency.** The hand-rolled
totals loop in `get-insights.ts` prefixed the spend figure with a literal `$` — wrong for every ZAR
account, which is most of them. Replaced by `analytics-core`'s `normalizeMetrics` +
`sumMetrics` + `ctr`, and the symbol is gone: currency belongs to the ad account, not the
formatter.

**4. The Effect validator hook blocked correct code.** `.claude/hooks/effect-validator.sh`
matched `yield\*.*try`, which fires on `Effect.tryPromise({ try: …, catch: … })` — the
*correct* idiom — not just on a JS `try {` statement. It would have blocked most of this
refactor. Tightened to match `try` only as a statement keyword, and verified both ways
(correct code passes, a real try/catch inside `Effect.gen` still blocks).

**5. `apps/ui-api` shipped npm's default failing test script** (`echo "Error: no test
specified" && exit 1`), which failed `turbo test` for the whole workspace. Removed, same as
the phantom lint scripts in part 02.

## Deliberately not done

**`apps/markdown-mcp`.** Extraction was started and **reverted**. Its service uses JS
try/catch inside `Effect.gen` and `yield* Effect.fail` without returning — it needs a real
Effect rewrite, not a relocation, and a half-migrated file is worse than an unmigrated one.
It also registers **no tools at all** today (`tools/index.ts` is a TODO stub), so it has no
users to protect and no runtime bug to fix.

**`apps/dapr-mcp` logic extraction.** It got the shared runtime and the `presentation/`
layer — the parts that were actually buggy — but its `data-cache.service.ts` and 397-line
`types.ts` still live in the app. Its eight tools are Dapr-cache plumbing rather than a
reusable domain, so the payoff is smaller than for the analytics platforms; it should follow
the same shape when someone next touches it.

Both are recorded in [carried-followups](../carried-followups.md).

## Verification

| Check | Result |
| --- | --- |
| `bun run lint` (guards + 20 turbo tasks) | passes |
| `bun run test` (11 tasks, 36 tests) | passes |
| `bun run build` | 15/20 — only the pre-existing `apps/ui-api` failure |
| depcruise boundary guard | proven to fire (a deliberate domain→infrastructure import was rejected, then removed) |

## Learnings

- Moving a file is safe; moving a file *and* rewriting its idioms in one step is not. The
  Shopify and GitHub clients moved wholesale with only import rewrites and built first try;
  markdown's attempted move-plus-rewrite produced a mangled file and had to be reverted.
- A lint guard nobody has tested against correct code is a liability. Two of the three
  guards encountered here (the Effect hook, the phantom lint scripts) were wrong in ways
  that had gone unnoticed because nothing exercised them.
