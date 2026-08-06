---
name: mndy-mcps
description: Orientation for using the mndy MCP servers (GA4, Meta Ads, Google Ads, Shopify, GitHub Issues, Dapr cache) from Claude Code. Use when the user wants to connect to, start, verify, or troubleshoot the mndy MCP servers, or when you need to know which mndy MCP tool to reach for. Points to the per-server skills for tool details.
---

# Using the mndy MCP servers

The `mndy-mcp` plugin wires six MCP servers from the mndy repo into Claude Code and
documents how to use them.

This is **analytics MCP mode**: the servers you actually want are plain HTTP processes
needing no infrastructure at all. You can also use them as the tool layer of the full mndy
platform, but that is the rarer case — do not stand up infrastructure unless the user is
using `mndy-dapr`.

## Connection model

Every mndy MCP server is an **HTTP (StreamableHTTP) server** exposing an MCP endpoint at
`/mcp`. The plugin's `.mcp.json` connects Claude to each one over HTTP — Claude is the
*client*, so **no secrets are configured on the Claude side**. Each server process holds
its own credentials (GitHub token, GA4 key, etc.) and must be running before its tools
work.

The server must be running and reachable **before** the tools appear. If a server is
down, its tools simply won't respond — start it (below), then reconnect.

## The servers

| MCP server (Claude name) | Default URL | Skill | Tools |
|---|---|---|---|
| `mndy-ga4` | `http://localhost:3003/mcp` | `ga4-analytics` | run GA4 reports |
| `mndy-meta-ads` | `http://localhost:3004/mcp` | `meta-ads` | campaigns, ad insights |
| `mndy-shopify` | `http://localhost:3005/mcp` | `shopify` | orders, store analytics |
| `mndy-google-ads` | `http://localhost:3010/mcp` | `google-ads` | paid search/display performance, campaigns |
| `mndy-github-issues` | `http://localhost:3009/mcp` | `github-issues` | list/update issues, add/remove labels |
| `mndy-dapr` | `http://localhost:3006/mcp` | `dapr-cache` | cache read/write, brand reports |

For the exact tools, parameters, and examples of each server, read that server's skill
(e.g. the `github-issues` skill).

## Overriding the URLs

The default URLs assume the servers run on `localhost` on their standard ports. To point
at Docker, a remote host, or a different port, set the matching environment variable
before launching Claude Code (each falls back to the localhost default):

- `MNDY_GA4_MCP_URL`
- `MNDY_META_MCP_URL`
- `MNDY_SHOPIFY_MCP_URL`
- `MNDY_GOOGLE_ADS_MCP_URL`
- `MNDY_GITHUB_ISSUES_MCP_URL`
- `MNDY_DAPR_MCP_URL`

## Which servers need infrastructure

**Only `mndy-dapr` does.** Every other server is a plain HTTP process needing nothing but
its own `.env` and a free port — no Dapr, no MongoDB, no RabbitMQ, no `docker-compose`.

The authoritative table lives in the mndy repo's README, under
"Which servers need infrastructure". Read it there rather than trusting a restatement.

So: to use the analytics tools, start just those servers — nothing else. If the user asks
for GA4/Meta/Google Ads/Shopify data and something suggests standing up infrastructure,
that is wrong.

## Starting a server

From the mndy repo root, each server has a `make` target that builds and runs it:

```bash
# Analytics — no infra required. Start all three at once:
make run-analytics-mcps      # GA4 (3003) + Meta Ads (3004) + Shopify (3005), Ctrl-C stops all

# ...or individually:
make run-ga4-mcp             # port 3003
make run-meta-ads-mcp        # port 3004
make run-shopify-mcp         # port 3005

make run-github-issues-mcp   # port 3009 — standalone, no infra
make run-dapr-mcp            # port 3006 — REQUIRES a Dapr sidecar + infra
```

Each server reads config from a `.env` file in its own directory
(`src/<name>-mcp/.env`). Copy `.env.template` to `.env` and fill in credentials before
starting. See the per-server skill for the exact variables that server needs.

`run-analytics-mcps` builds and launches GA4, Meta Ads, Shopify and Google Ads together in
one foreground command; Ctrl-C stops all of them. It does **not** start `github-issues` or
`markdown`, which are infrastructure-free but not analytics servers.
`make run-dapr-mcp` additionally launches a **Dapr sidecar** (needs
`make docker-compose-infra` up first).

## Verifying a server is up

Each server exposes a `/health` endpoint:

```bash
curl -s http://localhost:3009/health   # github-issues; swap the port per server
```

A healthy server returns HTTP 200. If Claude's tools for a server aren't responding,
check `/health` first, then confirm the URL matches the port the server logged on
startup (`... listening on port <N>`).

## Selecting a brand per session

By default each analytics server targets the account in its own `.env`. To work with a
specific brand this session — or switch between brands — use the `brands` skill: it reads a
brand registry (`mndy-brands.json`) and applies each brand's GA4 `propertyId`, Meta
`adAccountId` and Google Ads `customerId` per call. Shopify stays single-store per running
server. Reach for the `brands` skill whenever the user names a brand or asks to switch.

## Choosing a tool

- Google Analytics 4 report data → `ga4-analytics` skill
- Meta (Facebook/Instagram) ad campaigns and performance → `meta-ads` skill
- Google Ads / paid search / PPC performance and campaigns → `google-ads` skill
- Shopify orders and store analytics → `shopify` skill
- GitHub issues (list, triage, label, update) → `github-issues` skill
- Read/write the Dapr state cache or brand reports → `dapr-cache` skill

Comparing paid media across platforms means calling **both** `meta-ads` and `google-ads` —
neither alone is "paid media".
