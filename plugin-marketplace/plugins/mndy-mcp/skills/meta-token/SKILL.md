---
name: meta-token
description: Check, refresh, or replace the Meta (Facebook/Instagram) access token used by the mndy meta-ads MCP server. Use when Meta tools fail with "Session has expired" or "Invalid OAuth access token", when the user asks to refresh/renew/verify the Meta token, or to set up a non-expiring token.
---

# Meta access token: verify & refresh

The `mndy-meta-ads` server authenticates with `META_ACCESS_TOKEN` in
`apps/meta-ads-mcp/.env`. USER tokens expire (~60 days); an expired token makes every Meta
tool fail. This skill covers checking, refreshing, and permanently fixing it.

The helper is `scripts/src/refresh-meta-token.ts`, run from the mndy repo root.

## 1. Check the current token

```bash
bun run --cwd scripts refresh-meta-token --verify
```

This uses Meta's `debug_token` endpoint (works even on expired tokens) and reports validity,
type (USER vs SYSTEM_USER), app, scopes, and expiry. Run this first to diagnose — if it says
`Valid: no ... Session has expired`, the token must be refreshed or replaced.

Required scopes for the analytics tools: `ads_read`, `read_insights`.

## 2. Refresh (only works while the token is still valid)

```bash
bun run --cwd scripts refresh-meta-token            # exchanges for a long-lived token, verifies it, updates .env
bun run --cwd scripts refresh-meta-token --dry-run  # show the new token without writing .env
# equivalently: make refresh-meta-token
```

This exchanges the current token for a long-lived one (`fb_exchange_token`), verifies the
result, then writes it to `.env`. **Important:** Meta cannot exchange an *already-expired*
token — if `--verify` shows it expired, this will fail and you must reseed or replace it.

## 3. Reseed with a fresh short-lived token

If the token has expired, get a new short-lived token from the
[Graph API Explorer](https://developers.facebook.com/tools/explorer) (select the app, grant
`ads_read` + `read_insights`), then exchange it for a long-lived one:

```bash
bun run --cwd scripts refresh-meta-token --token=<FRESH_SHORT_LIVED_TOKEN>
```

## 4. Permanent fix: System User token (recommended)

USER tokens keep expiring. A **System User** token from Meta Business Settings does not
expire. Create a System User under the business, assign it the ad account with the analytics
permissions, and generate a token with `ads_read` + `read_insights`. Put it in
`apps/meta-ads-mcp/.env` as `META_ACCESS_TOKEN` and restart the server. Verify with step 1
(`Type: SYSTEM_USER`, `Expires: never`).

## After any change

Restart the `mndy-meta-ads` server (`make run-meta-ads-mcp`) so it picks up the new token,
then re-run a Meta tool (see the `meta-ads` skill) to confirm.

## Notes

- `META_APP_ID` and `META_APP_SECRET` must be present in `.env` — the verify/exchange calls
  need them (they form the `app_id|app_secret` app access token).
- The refresh helper never prints full tokens except under `--dry-run`; it verifies a new
  token before writing it and refuses to save an invalid one.
