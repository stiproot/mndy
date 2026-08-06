---
name: brands
description: Configure which brand (account) the mndy analytics MCPs target for this session, instead of relying on each server's hardcoded default. Use when the user names a brand, asks to switch brands, or wants analytics for a specific brand/property/ad-account. Reads a brand registry and applies each brand's GA4 propertyId and Meta adAccountId per tool call.
---

# Per-session brand configuration

The analytics MCP servers each start with a hardcoded default account (GA4 property, Meta ad
account, Shopify store) in their `.env`. This skill lets a user pick a **brand per session**
without restarting servers — by passing the brand's identifiers on each tool call.

This works because the GA4 and Meta tools already accept per-call overrides:

- `ga4_run_report` accepts `propertyId`
- `meta_get_insights` / `meta_get_campaigns` accept `adAccountId`

> **Requirement:** the running server's credentials must have access to the brand you select
> — one GA4 service account can serve every property it's been granted, and one Meta token
> can serve every ad account it can see. If access is missing, the tool returns an auth error.

## The brand registry

Brands are defined in a JSON file. Look for it in this order and use the first that exists:

1. the path in the `MNDY_BRANDS_FILE` environment variable
2. `./mndy-brands.json` (repo root)
3. `~/.mndy/brands.json`

A template ships next to this skill, at `mndy-brands.example.json` in the skill's own
directory — so it's available whether or not the mndy repo is checked out. Copy it and fill
in real values:

- **Working in the mndy repo:** copy it to `mndy-brands.json` at the repo root (gitignored).
- **Anywhere else:** copy it to `~/.mndy/brands.json`, or put it wherever you like and point
  `MNDY_BRANDS_FILE` at it.

Shape:

```json
{
  "defaultBrand": "afbrands",
  "brands": {
    "afbrands": {
      "label": "AF Brands",
      "ga4PropertyId": "261791693",
      "metaAdAccountId": "act_1921195691366438",
      "shopifyStore": "afbrands.myshopify.com",
      "timezone": "Africa/Johannesburg",
      "currency": "ZAR"
    }
  }
}
```

## How to use it

1. **Resolve the brand.** If the user names a brand, use that key. Otherwise use
   `defaultBrand`. Read the registry file (via Read) and pull the brand's entry. If the file
   is missing, tell the user to create `mndy-brands.json` from the example, and fall back to
   the servers' env defaults for this session.
2. **Hold it for the session.** Remember the resolved brand and reuse its IDs for every
   subsequent analytics call until the user switches brand.
3. **Apply per call:**
   - GA4: pass `propertyId` = the brand's `ga4PropertyId` on every `ga4_run_report` call.
   - Meta: pass `adAccountId` = the brand's `metaAdAccountId` on every
     `meta_get_insights` / `meta_get_campaigns` call.
   - Shopify: **single store per running server.** The `shopify_*` tools have no store
     parameter — they hit whatever store the running `mndy-shopify` server's `.env` points
     at. If the selected brand's `shopifyStore` does not match that server's store, say so
     and treat Shopify data as unavailable for that brand this session (don't silently
     return another brand's numbers). See the `shopify` skill.
4. **Confirm.** When you switch or set a brand, state which brand is active and which IDs
   you'll use (e.g. "Using AF Brands — GA4 261791693, Meta act_1921195691366438; Shopify
   only if the server is pointed at afbrands.myshopify.com").

## Switching mid-session

If the user says "switch to <brand>", re-resolve from the registry and apply the new IDs
going forward. Currency/timezone in the entry are hints for interpreting and formatting
results (e.g. report AOV in the brand's `currency`).

## Multi-brand Shopify (current limitation)

Because Shopify auth is per-store (OAuth client credentials bound to one store), true
per-session Shopify switching isn't available yet. To analyse a different store, point
`apps/shopify-mcp/.env` at that store and restart `mndy-shopify` — or run one shopify-mcp
per store on separate ports. GA4 and Meta switch freely per call.
