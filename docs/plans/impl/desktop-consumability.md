# Desktop consumability

Status: Complete — stdio transport, in-server steering, an analytics skill and a one-command Desktop installer.
Established: 2026-08-06

## Why

The analytics MCP servers are the most-used thing this repo produces, and the audience is
shifting from developers driving Claude Code to end users on Claude Desktop. Today a
Desktop user would have to: clone a monorepo, install bun, fill in four `.env` files, keep
`make run-analytics-mcps` running in a terminal, wire up four custom connectors by hand,
and separately install steering they cannot get from a plugin Desktop does not consume.

That is not consumable. Three things fix it, in descending order of leverage.

## The three layers

**1. Steering ships inside the server.** The MCP protocol lets a server send `instructions`
at initialize, and expose `prompts` the client surfaces as ready-made starting points. Both
reach **every** MCP client with zero installation — no plugin, no skill, no marketplace.
This is the only steering that is guaranteed to arrive, so the load-bearing guidance goes
here: what the tools cover, that spend is in the account's currency, that a null KPI means
"not computable" rather than zero, and that Shopify is one store per server.

**2. stdio transport.** `mcp-core` is HTTP-only. Under stdio, Claude Desktop launches each
server itself from `claude_desktop_config.json` — no terminal, no ports, no lifecycle to
manage, nothing to restart after a reboot. HTTP stays for the Claude Code dev loop.

**3. A skill for the richer workflows.** Multi-brand switching, cross-platform report
recipes, interpreting the KPIs. This is the layer that can afford length, so it carries what
does not fit in `instructions`.

## The stdout hazard

Under stdio, **stdout is the JSON-RPC channel**. `mcp-core`'s `log()` currently writes
debug/info/notice through `console.log`, straight into that channel — which would corrupt
every message and break the connection the moment a server logged anything.

All logging moves to stderr. Not conditionally on transport: one behaviour, so this cannot
be reintroduced by someone adding a log line to an HTTP-only path that later gains stdio.
stderr is the conventional destination for server diagnostics anyway, and the existing
`.mcp-run/*.log` capture already redirects `2>&1`.

## Scope

- [x] `mcp-core`: logging to stderr; `serveMcp` selecting stdio vs HTTP; `instructions`
      passthrough.
- [x] The four analytics servers: instructions text, prompt starters, transport selection.
- [x] A consolidated `analytics` skill.
- [x] `make install-desktop` — build, collect credentials, write `claude_desktop_config.json`.
- [x] Docs: a Desktop path in README that never mentions Dapr.

## Decisions

**Agreed 2026-08-06:** stdio alongside HTTP; steering in-server *and* as a skill;
distribution stays clone-based with an install script rather than a published npx package.
The npx route would be materially easier for a non-technical user and is the obvious next
step if this is given to people outside the team — recorded in carried-followups.

## Out of scope

`github-issues-mcp`, `markdown-mcp` and `dapr-mcp`. The Desktop audience is analytics; the
other three are developer or infrastructure tools. `mcp-core` gains stdio for all of them,
so adding one later is a two-line change to its composition root.

## Verification

Driven exactly as Claude Desktop drives a server — spawn the process, speak JSON-RPC over
its pipes:

| Check | Result |
| --- | --- |
| stdout carries only valid JSON-RPC (no log corruption) | pass, all 4 servers |
| `instructions` delivered at initialize | pass — 1355–1598 chars per server |
| Prompt starters listed | pass — 2 per server |
| Logs land on stderr | pass |
| HTTP transport still works, live GA4 call | pass (no regression) |
| Installer merges without clobbering an unrelated server | pass |
| The exact `command`/`args`/`env` the installer wrote actually speaks MCP | pass |

## Findings

**The stdout hazard was real and would have shipped.** `log()` wrote debug/info/notice via
`console.log`. Under stdio that is the protocol channel, so the first log line would have
corrupted the stream. Caught before writing any server code, by reading the logger while
planning rather than after.

**`readline/promises` fails silently at EOF.** With piped stdin the installer consumed two
answers and then exited **0 having done nothing** — no config written, no error, no
indication. The worst possible installer behaviour: the user is told it worked. Questions
now race against the interface's `close` event and fail loudly, and a `--yes` mode installs
from existing `.env` files without prompting, which is both genuinely useful and the path
the verification exercises.

**Transport inference needs the port check.** "No TTY" alone looks like a sufficient signal
that a client spawned us — but the detached HTTP runner also redirects stdin from
`/dev/null`, so a server started by `make start-analytics-mcps` would have flipped itself to
stdio and silently never bound its port. `PORT` being set keeps it on HTTP. Pinned by a test.

## Lifted to

| Context | Home |
| --- | --- |
| Transport selection, and the never-`console.log` rule | [CLAUDE.md § Transports](../../CLAUDE.md) |
| Steering lives in the servers; keep `instructions` short | CLAUDE.md § Steering ships inside the servers |
| Reporting semantics (nulls, currency) | `packages/js/analytics-core/src/domain/guidance.ts`, shipped as `instructions` |
| Cross-platform workflows, brand switching, recipes | the `analytics` skill |
| Desktop setup | [README § Analytics MCP mode](../../README.md#analytics-mcp-mode) |
