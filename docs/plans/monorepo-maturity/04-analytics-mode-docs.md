# 04 — Analytics-mode doc hardening

Status: Complete — analytics MCP mode is the README's front door, backed by a parity guard and a green markdown gate.
Established: 2026-08-06

Part of [monorepo-maturity](./README.md).

## Goal

There are two ways to use mndy, and only one of them is documented as a *way*:

1. **The full platform** — Dapr, MongoDB, RabbitMQ, the workers, the UI. What the README
   and CLAUDE.md describe.
2. **Minimal analytics MCP mode** — start two or three plain HTTP processes, point Claude
   at them through the `mndy-mcp` plugin, and use the analytics tools. No Dapr, no
   compose, no database, no Python. This is what most users actually want, and today it is
   documented as a paragraph *inside* the full-platform docs.

Mode 2 becomes the front door: named, stated first, and structurally obvious.

## The current wording problem

The facts are already written down — `make run-analytics-mcps`, "**need NO
infrastructure**", the per-server table — but they are scattered across CLAUDE.md, the
plugin-marketplace README and the `mndy-mcps` skill, each phrasing it slightly
differently, and always as a qualification on the full setup rather than as its own path.
The reader has to *assemble* the mode from asides. An agent reading CLAUDE.md top-down
meets the microservice architecture and the Dapr requirements first, and by the time it
reaches "no infrastructure needed" it has already decided this repo is heavy.

## Changes

- **README.md** — lead with the two modes. Mode 2 gets a complete
  clone-to-first-tool-call path: install prerequisites, fill in `.env`, `make
  run-analytics-mcps`, install the plugin, ask a question. No step that mentions Dapr.
- **CLAUDE.md** — a Modes section near the top, before the architecture. State which
  servers need infrastructure as a table, once, and have everything else link to it.
- **plugin-marketplace/README.md** and the **`mndy-mcps` skill** — align on the single
  wording, drop the restatements, link to the one table.
- Every analytics server's own README gets the same one-line header: what it needs, what
  it does not.

## Hardening, not just wording

Prose drifts. Two guards keep the claim true:

- `scripts/check-mcp-parity.mjs` (from part 03) — the set of servers documented as
  infra-free must match the set that has no Dapr dependency in its `package.json` and no
  sidecar in its Makefile target. If someone adds a Dapr call to `ga4-mcp`, lint fails.
- The mode table lives in exactly one file; the others link. A `check-steering.mjs`-style
  guard (h has one) can assert the table is not duplicated.

## Carried in from part 01 — the markdown gate

`make lint-md` had never passed: no `.markdownlint.yml` existed, so it ran on strict
80-column defaults and reported 714 errors. Part 01 added the house-style config (line
length 250, matching the sibling plugin repos) and ran `--fix`, taking it to **94
remaining**, all genuine content issues:

| Count | Rule |
| --- | --- |
| 45 | MD040 — fenced code block with no language |
| 28 | MD036 — emphasis used instead of a heading |
| 12 | MD029 — ordered-list prefix |
| 4 | MD024 — duplicate heading |
| 2 | MD041 — file does not start with an H1 |
| 2 | MD013 — line over 250 chars |
| 1 | MD033 — inline HTML |

Deliberately **not** fixed in part 01: most of these live in READMEs that parts 02 and 04
rewrite or relocate anyway, so fixing them first would be wasted motion. Clear the
remaining 94 here, and only then is `lint-md` honest enough to be a required gate.

## Note

`github-issues-mcp` and `markdown-mcp` are also infra-free but are not *analytics*. Keep
the axis honest: the table's column is "needs infrastructure", and the analytics grouping
is a separate, overlapping label. Do not let "analytics" and "infra-free" silently become
synonyms.

## What was done

**README leads with the two modes.** A "Two ways to use mndy" section is now the first
thing after the badges, followed by a complete clone-to-first-tool-call path for Mode 1
that mentions Dapr exactly once — to say you do not need it. The old opening (Overview →
Features → Architecture → Dapr prerequisites) now sits below it, and "Quick Start" is
retitled "Quick Start (full platform)" with a pointer back to Mode 1.

**One table, everywhere else links.** `README.md#which-servers-need-infrastructure` is the
single source of truth. CLAUDE.md's server table lost its Infrastructure column and links
there instead; the `mndy-mcps` skill and the plugin README dropped their restatements.

**CLAUDE.md gained a Modes section** above the architecture, with the instruction that
matters operationally: when a user asks about GA4/Meta/Google Ads/Shopify data they are in
Mode 1 — do not tell them to stand up infrastructure, and do not run `make install` (which
syncs a Python workspace they do not need) when `bun install` suffices.

**Every server README carries a one-line verdict** — infrastructure or not, its port, its
health URL, a link to the canonical table, and a pointer to the package holding its logic.

## Hardening

`scripts/check-mcp-parity.mjs`, wired into `bun run lint`. Every `apps/*-mcp` must have a
package.json, a `.env.template` declaring a port, a README, a `make run-*` target, and an
entry in the README table; every port the plugin's `.mcp.json` points at must be served by
some app; and — the load-bearing check — **a server documented as infrastructure-free must
not depend on Dapr**. If someone adds `dapr-core` to `ga4-mcp`, lint fails rather than the
claim quietly becoming false.

It found a real gap on its first run: `apps/dapr-mcp` had no README at all. Written, and it
now opens by saying it is the one server that needs infrastructure.

## The markdown gate is green

Part 01 left 94 genuine content issues. All are now fixed and `bun run lint:md` is part of
`bun run lint`, so it stays fixed:

- **45 × MD040** — fenced blocks with no language, given one inferred from content.
- **28 × MD036** — bold lines used as headings, converted to real headings at the level
  their surrounding section implies.
- **12 × MD029**, **4 × MD024**, **2 × MD041**, **2 × MD013**, **1 × MD033** — list
  prefixes, duplicate headings, missing H1s, overlong lines, inline HTML.

MD024 was resolved by configuration rather than by editing: repeating a subheading like
"Protocol Messages" under *different* parents is correct in reference docs, so
`siblings_only: true` is the honest rule. Duplicates under the same parent still fail.

## Findings

**Automated markdown fixes need verifying, twice.** Two bugs in the fix passes:
`markdownlint` writes findings to **stderr**, so the first script silently parsed an empty
string and reported success having changed nothing. Then the MD036 level-detection scanned
backwards for the nearest heading *without skipping code blocks*, so a `#` bash comment
inside a fenced example was read as an h1 and one heading came out as `##` among `#####`
siblings. Both were caught only because MD001 (heading-increment) then failed — without
that rule the document outline would have been quietly wrong.

**`docs/plans/effect-ui-api.md` still had its harness scratch path as line 1**
(`~/.claude/plans/purring-dancing-rose.md`) — precisely what the plan-management convention
forbids. Retrofitted with a title and status line while fixing its MD041 error.

## Learnings

- A gate that has never passed is not a gate. `lint-md` sat red at 714 errors and therefore
  went unread for its entire existence; the same was true of three phantom lint scripts and
  the Effect hook. Getting to zero once is what makes the next regression visible.
- Prose cannot hold an invariant. "The analytics servers need no infrastructure" is the
  single most important claim in this repo's docs, and it is now checked by
  `check-mcp-parity.mjs` against the actual dependency graph.
