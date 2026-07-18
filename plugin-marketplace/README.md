# mndy MCP plugin marketplace

A minimal Claude Code plugin marketplace that lets an agent use the **mndy MCP servers**
— either directly from your shell or as the tool layer of the full mndy solution. It ships
only the MCP usage surface: the wiring and the skills. No application infrastructure.

## What's in it

One plugin, **`mndy-mcp`**, which bundles:

- **`.mcp.json`** — registers five mndy MCP servers with Claude Code over HTTP:
  `mndy-github-issues`, `mndy-ga4`, `mndy-meta-ads`, `mndy-shopify`, `mndy-dapr`.
- **Skills** — one orientation skill (`mndy-mcps`) plus one per server, documenting each
  server's tools, parameters, and usage so the agent knows what to call and how.

The MCP servers themselves live in the mndy repo under `src/*-mcp/` and are run from there
(`make run-<name>-mcp`). This plugin is the client-side wiring and know-how only.

## Install

From this directory's parent (the mndy repo root):

```bash
claude plugin marketplace add ./plugin-marketplace
claude plugin install mndy-mcp@mndy
```

## Use it

1. Start the server(s) you need from the mndy repo root, e.g. `make run-github-issues-mcp`.
   Each server reads credentials from `src/<name>-mcp/.env` (copy from `.env.template`).
   - **Analytics (GA4, Meta Ads, Shopify) need no infrastructure.** Start all three with a
     single target: `make run-analytics-mcps`. They're plain HTTP processes — no Dapr, no
     docker-compose. Only `mndy-dapr` requires a sidecar + `make docker-compose-infra`.
2. In a Claude Code session with the plugin installed, ask for the task — the agent picks
   up the matching skill and calls the server's tools.

By default the plugin connects to the servers on `localhost` (ports 3001/3003/3004/3005/3006).
To target Docker or a remote host, set the override env vars before launching Claude Code:
`MNDY_GITHUB_ISSUES_MCP_URL`, `MNDY_GA4_MCP_URL`, `MNDY_META_MCP_URL`,
`MNDY_SHOPIFY_MCP_URL`, `MNDY_DAPR_MCP_URL`.

See the `mndy-mcps` skill for the full connection, startup, and troubleshooting guide.
