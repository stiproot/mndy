# 02 — Monorepo restructure

Status: Planning — flatten `src/` into h's `apps/` + `packages/` layout and add build orchestration.
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
