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
- **Operational skills** — `brands` (target a specific brand/account per session without
  restarting servers) and `meta-token` (verify and refresh the Meta access token).

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

## Working with multiple brands

Each analytics server starts pointed at whatever account is in its own `.env`. To target a
different brand — or switch mid-session — you don't restart anything: the GA4 and Meta tools
accept a per-call `propertyId` / `adAccountId`, and the `brands` skill applies them for you.

Copy the template out of the `brands` skill directory
(`plugins/mndy-mcp/skills/brands/mndy-brands.example.json`) to one of:

- `mndy-brands.json` at the mndy repo root (gitignored), or
- `~/.mndy/brands.json`, or
- any path you point `MNDY_BRANDS_FILE` at

Fill in each brand's `ga4PropertyId` and `metaAdAccountId`, then just name the brand in your
request ("pull last month's spend for AF Brands"). The running server's credentials must have
access to the accounts you list — one GA4 service account and one Meta token can each serve
every property/ad account they've been granted.

**Shopify is the exception:** its tools have no store parameter, so a running `mndy-shopify`
serves exactly one store. To analyse another store, repoint `apps/shopify-mcp/.env` and
restart, or run one shopify-mcp per store on separate ports.

By default the plugin connects to the servers on `localhost` (ports 3003/3004/3005/3006/3009).
To target Docker or a remote host, set the override env vars before launching Claude Code:
`MNDY_GITHUB_ISSUES_MCP_URL`, `MNDY_GA4_MCP_URL`, `MNDY_META_MCP_URL`,
`MNDY_SHOPIFY_MCP_URL`, `MNDY_DAPR_MCP_URL`.

See the `mndy-mcps` skill for the full connection, startup, and troubleshooting guide.
