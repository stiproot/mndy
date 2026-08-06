# 02 — Monorepo restructure

Status: Complete — `src/` is gone; `apps/` + `packages/` + `config/` + `tools/`, turbo and two lint guards in place.
Established: 2026-08-06

Part of [monorepo-maturity](./README.md). Shared context — including the agreed layout
mapping — lives there.

## Goal

A reader (or an agent) can tell what a directory *is* from where it sits. Today `src/`
holds a Vue app, four Python workers, a C# project, seven MCP servers, three TypeScript
libraries, Dapr YAML and a d3 sandbox, all as peers. After this part: `apps/` is things you
run, `packages/` is things you import, `config/` is declarative infrastructure, `tools/` is
loose scripts.

## Moves

Every move is `git mv` so history follows.

| From | To |
| --- | --- |
| `src/apps/{ui,vis,azdo}` | `apps/{ui,vis,azdo}` |
| `src/ui-api`, `src/cc-svc`, `src/dapr-actor-svc`, `src/azdoproxy-api` | `apps/` |
| `src/{azdo,azdoproxy,insights,workflows}-worker` | `apps/` |
| `src/{github-issues,ga4,meta-ads,shopify,google-ads,markdown,dapr}-mcp` | `apps/` |
| `src/{mcp,dapr,cc}-core` | `packages/js/` |
| `src/mndy-framework` | `packages/py/mndy-framework` |
| `src/dapr`, `src/mappings` | `config/dapr`, `config/mappings` |
| `src/d3-lab`, `tools/*.py` | `tools/` |

## The long tail

The moves are the easy half. Every path reference has to follow, and they are scattered:

- Root `package.json` — replace the 16-entry explicit workspace list with globs
  (`apps/*`, `packages/js/*`, `scripts`), matching h.
- `pyproject.toml` — uv workspace members for the four workers + the framework.
- Per-package `tsconfig.json` — relative paths to the root config and to `mcp-core`.
- `Makefile` — every `--cwd src/…` and every `cd src/…` target, plus the Dapr
  `--components-path` / `--resources-path` flags now pointing at `config/dapr`.
- `Dockerfile`s (8 of them) — COPY paths and build contexts.
- `docker-compose.yml`, `docker-compose.arm.yml` — build contexts and volume mounts.
- `vitest.config.ts` and `tests/integration/**` — import paths.
- Docs and skills that cite `src/<name>-mcp/.env` — the `mndy-mcp` plugin skills, the
  plugin-marketplace README, CLAUDE.md, per-server READMEs.

## New machinery

- `turbo.json` — `build` / `lint` / `test` tasks with `dependsOn: ["^build"]`, copied from
  h and trimmed to what mndy has.
- `.dependency-cruiser.cjs` — h's hex boundary rules. Lands here so part 03 has something
  to enforce against, but only bites packages that actually have `domain/` layers, so it is
  a no-op until 03 creates them.
- `scripts/check-*.mjs` — start with the guards that pay for themselves immediately:
  `check-hex-lint.mjs` (a hex package must run depcruise) and `check-ports.mjs` (no two
  servers claim the same port — mndy currently has `github-issues-mcp` and `ui-api` both on
  3001, which is a live bug this guard would have caught).

## Risks

- **The 3001 collision is real, not cosmetic.** `make run-ui-api` and
  `make run-github-issues-mcp` cannot both run. Resolve it as part of adding
  `check-ports.mjs` rather than encoding the collision into a guard's allowlist.
- **`azdoproxy-api` is C#** and has no place in the bun or uv workspace. It moves to
  `apps/` and stays outside both workspace globs — the globs must not blindly match it.
- **Docker build contexts** are the most likely thing to break silently, since nothing in
  `make lint` exercises them. Verify at least one image builds before calling this done.

## Findings

The move went cleanly. What it *uncovered* was the interesting part — six latent breakages
that the flat layout had been hiding.

**1. A credential was committed.** `src/.core.env` was tracked in git and contains a
`BASE64_AZDO_PAT`. The `.gitignore` rule was `**/.env`, which matches only files named
exactly `.env` — never the dotted variants. Fixed the rule (`**/.*.env`, `**/.env.*`) and
moved the file to the repo root, where the Makefile's `--env-file .core.env` actually
expects it. **The PAT is still in git history and must be rotated** — an ignore rule does
not unring that bell.

**2. Four worker targets pointed at a directory that has never existed.** `make
run-azdo-worker` and its three siblings passed `--resources-path
../../dapr/components.local/`. There is no `components.local` anywhere in this repo's
history — only `components` (container hostnames, e.g. `mongo-mndy:27017`) and
`components.localhost` (localhost). Local `make run-*` targets want the latter, which is
what the other three Dapr targets already used. Fixed, along with the relative depth the
move changed.

**3. Every root-context Dockerfile copied a lockfile that does not exist.** `COPY
package.json bun.lockb ./` — but bun 1.3 writes the text-format `bun.lock`. Fixed in the
five root-context images. `apps/ui`, `apps/vis` and `apps/azdo` build with the app
directory as context, so the root lockfile is not reachable at all; those stay broken and
are carried forward rather than guessed at.

**4. `ui-api` and `github-issues-mcp` both defaulted to port 3001.** They could never run
together. `github-issues-mcp` moved to **3009**, joining the contiguous MCP block, and
`scripts/check-ports.mjs` now makes a recurrence a lint failure. This is a user-visible
change: the plugin's default URL, `MNDY_GITHUB_ISSUES_MCP_URL`, the compose mapping, the
skills and the integration tests all moved with it.

**5. Three packages declared lint scripts that had never run.** `apps/vis` and `apps/azdo`
ran `vue-cli-service lint` with no eslint plugin installed; `apps/markdown-mcp` ran `eslint
src` with no eslint config. All three were removed — a script that cannot execute is worse
than no script, because `turbo lint` reports it as coverage. Real lint coverage arrives in
part 03 via depcruise.

**6. `uv.lock` had to be hand-edited.** `uv lock` refuses to re-resolve while the lockfile
points at workspace members that no longer exist, so it cannot fix its own paths after a
move — chicken and egg. Rewrote the five `editable =` paths with sed, after which `uv lock`
and `uv sync` both succeed.

## Verification

| Check | Result |
| --- | --- |
| `make build-mcp` | passes — mcp-core + 5 MCP servers |
| `make build-dapr`, `make build-cc-svc` | pass |
| `uv lock` / `uv sync` | pass |
| `bun run lint` (guards + turbo lint) | passes |
| `bun run build` (turbo) | **10/15, `ui-api` fails** |

`ui-api`'s failure is **pre-existing and unrelated to the move** — verified by diffing its
sources against `HEAD`, which are byte-identical. The errors are Effect type errors in
`src/handlers/chat.handlers.ts`, exactly the migration tracked by
[`docs/plans/effect-ui-api.md`](../../effect-ui-api.md). Not fixed here; it is that plan's job.

## Learnings

- **`git mv` on a directory moves untracked contents too**, which is why nested
  `node_modules` and `dist` were purged first — moving them would have carried stale
  workspace symlinks into the new layout.
- **Use a sed delimiter that is not `|` when the pattern contains `\|` alternation.** The
  first pass at rewriting Dockerfile paths silently no-opped for exactly this reason, and
  the damage was invisible until the files were re-read. Prefer `#` and a shell loop over
  one clever expression.
- Turbo needs a `packageManager` field in the root `package.json` or it refuses to resolve
  the workspace at all.
