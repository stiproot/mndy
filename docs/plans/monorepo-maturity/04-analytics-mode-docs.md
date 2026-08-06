# 04 — Analytics-mode doc hardening

Status: Planning — make "minimal analytics MCP mode" a named, first-class mode of using this repo.
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
