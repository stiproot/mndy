# Live verification of the analytics stack

Status: Blocked — three things cannot be verified without credentials or a machine only the
maintainer has. Everything verifiable without them has been verified.
Established: 2026-08-06

## Why this exists separately

The analytics servers are extensively verified where verification was possible: unit tests,
integration suites against live GA4 and Shopify, the MCP protocol driven over both
transports, and Docker images built and run. These three gaps are different — they are not
unfinished work, they are work that **cannot proceed** until someone with access acts. They
are recorded here so they do not survive only in a chat log.

## 1. The Meta access token is expired

**Blocker.** `META_ACCESS_TOKEN` in `apps/meta-ads-mcp/.env` is a USER token that expired
**2026-03-27**. Every Meta tool call fails. Six of the ten Meta integration tests fail for
this reason alone; the other four (schema validation, error handling) pass.

**Why it cannot be fixed here.** Meta cannot exchange an already-expired token, so
`make refresh-meta-token` does not help. Reseeding needs an interactive Facebook login.

**Revisit when:** someone with access to the `mndy-analytics` app can obtain a fresh
short-lived token from the [Graph API Explorer](https://developers.facebook.com/tools/explorer)
(scopes `ads_read`, `read_insights`), then:

```bash
bun run --cwd scripts refresh-meta-token --token=<FRESH_SHORT_LIVED_TOKEN>
make restart-analytics-mcps
bun run test:integration:meta        # expect 10/10
```

**Do better than a fix:** use a **System User** token, which does not expire. The
`meta-token` skill covers this. Otherwise this recurs every ~60 days.

## 2. Google Ads has never run against the real API

**Blocker.** `apps/google-ads-mcp` has no `.env`, so it has never made a live call. Its
domain logic is unit-tested (17 tests over GAQL construction, micros conversion, limit
clamping) and it builds, starts and serves MCP — but the adapter, the auth chain and the
response mapping are unexercised against Google.

**Why it cannot be fixed here.** It needs five credentials that only an account holder can
obtain: OAuth client id/secret, a developer token, a refresh token, and the customer id
(plus a login-customer-id if the account sits under an MCC).

**Revisit when:** credentials exist. `apps/google-ads-mcp/README.md` documents the
acquisition path for each. Then:

```bash
cp apps/google-ads-mcp/.env.template apps/google-ads-mcp/.env   # fill in
make restart-analytics-mcps
```

and confirm `google_ads_get_campaigns` returns real campaigns. **Expect the developer token
to be the sticking point** — a newly issued one has *test* access and returns empty results
against production accounts, which looks like a bug rather than a permissions problem.

## 3. The Claude Desktop path is unverified on a real Desktop

**Blocker.** The Desktop story is verified server-side and config-side: each server driven
over stdio exactly as Desktop drives one (clean stdout, instructions delivered, prompts
listed), the installer's merge behaviour, and the exact `command`/`args`/`env`/`cwd` it
writes spawning a working server. What has **not** happened is running it through an actual
Claude Desktop install.

**Why it cannot be fixed here.** No Claude Desktop on this machine.

**Revisit when:** someone runs `make install-desktop`, restarts Desktop, and asks a
question. Worth checking specifically:

- the servers appear and their tools are callable;
- the prompt starters show up in the UI;
- the absolute bun path resolves (Desktop launches with a minimal environment, which is why
  the installer writes `/path/to/bun` rather than `bun`).

Should be five minutes. Do it before anyone outside the team is given this.
