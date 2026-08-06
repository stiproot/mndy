# 01 — Plugin consumption

Status: Complete — five plugins wired, conventions moved into CLAUDE.md, markdown gate made usable.
Established: 2026-08-06

Part of [monorepo-maturity](./README.md). Shared context lives there.

## Goal

mndy carries its conventions the way h does: in installed plugins, not in prose duplicated
across steering files. Five plugins come in, and CLAUDE.md changes from *describing* the
conventions to *pointing at* the plugin that owns each one.

## The plugins

| Plugin | Marketplace | What it gives mndy |
| --- | --- | --- |
| `effect-claude-primitives` | `effect-primitives` | The Effect-TS pattern skills that parts 03 and 05 are written against |
| `code-comprehension` | `code-comprehension-marketplace` | `gen-code-diagram` + the `comprehend-code` skill; generated diagrams under `docs/diagrams/` |
| `c4-mermaid-plugin` | `c4-mermaid` | C4 context/container/component diagrams for the architecture docs |
| `plan-management` | `plan-management-marketplace` | The plan lifecycle this very document follows |
| `hex-arch` | `hex-arch-marketplace` | The ports-and-adapters layering that part 03 enforces |

`mndy-mcp@mndy` (the repo's own local-directory marketplace) stays as-is.

## Decisions

**`effect-primitives` is inherited from user-level settings, not declared in the project.**
h does the same. The marketplace is a `directory` source pointing at a local checkout of
`effect-claude-primitives`, so declaring it project-side would hardcode one machine's path.
The other four are GitHub sources and are declared in `.claude/settings.json`, so a fresh
clone gets them. Consequence: a new contributor must add the effect marketplace themselves
— documented in CONTRIBUTING/README rather than silently assumed.

**`@stiproot/code-comprehension` also becomes a root devDependency.** The plugin gives the
agent skills; the npm package gives CI the `gen-code-diagram` binary. h depends on both for
exactly this reason — the diagram check has to run in `lint`, not only when an agent is
driving.

## Steps

- [x] `.claude/settings.json` — add the four GitHub marketplaces and enable all five plugins
      alongside `mndy-mcp@mndy`, preserving the existing `effect-validator.sh` PreToolUse hook.
- [x] Root `package.json` — add `@stiproot/code-comprehension` devDependency.
- [x] `CLAUDE.md` — add a Plans section (mndy's concrete policy on top of the generic
      `plan-management` lifecycle), a Diagrams section, and a "Where code lives" section
      naming the hex layering + the packages-hold-the-logic principle.
- [x] Establish `docs/plans/impl/` as the archive directory and `docs/diagrams/` as the
      generated-diagram home.
- [x] Add `.markdownlint.yml` + `.markdownlintignore` — see the findings below.

## Findings

- mndy already had `.claude/rules/*.md` covering Effect-TS, MCP servers, Vue, marketing
  analytics and git. These predate the plugins and overlap `effect-claude-primitives`
  substantially. **Decision: keep the rules.** They encode mndy-specific policy (tool naming
  `{platform}_{action}_{resource}`, the per-call account-override rule, the anomaly
  thresholds) that no generic plugin knows. The overlap that is purely generic Effect
  guidance gets thinned in part 03, once the refactor proves which rules are load-bearing.

- The markdown gate was decorative. `make lint-md` had no config file at all, so
  markdownlint ran on strict defaults (80-column lines) and produced **714 errors** — a gate
  nobody could ever have passed, and therefore one nobody ran. Added the house-style
  `.markdownlint.yml` from the sibling plugin repos plus a `.markdownlintignore`, then ran
  `--fix`: down to 94 genuine content issues. Those 94 are deliberately left for part 04,
  which rewrites most of the offending files anyway.

## Learnings

- h's `enabledPlugins` ids are `<plugin-name>@<marketplace-name>`, and the marketplace name
  is the `name` field inside `.claude-plugin/marketplace.json` — *not* the repo name. Three
  of the four differ (`stiproot/c4-mermaid-plugin` → `c4-mermaid`), so the ids cannot be
  guessed from the GitHub URL.
