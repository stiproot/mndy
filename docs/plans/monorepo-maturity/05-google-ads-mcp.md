# 05 — Google Ads MCP

Status: Complete — google-ads-core + a container app on port 3010, wired into the plugin and the brand registry.
Established: 2026-08-06

Part of [monorepo-maturity](./README.md).

## Starting state

`src/google-ads-mcp/` contains exactly one file: `src/types.ts`. No `package.json`, no
`tsconfig.json`, no service, no tools, no Makefile target, no `.env.template`, no README,
no entry in the plugin's `.mcp.json`, no skill. It is not in the workspace list, so it is
invisible to `bun install` and to every build.

There is a design doc at [`docs/plans/google-ads-mcp-paid-media-report.md`](../google-ads-mcp-paid-media-report.md)
— read it before starting; this part is the delivery half of that idea.

## Why it goes last

Google Ads is the fourth paid-media surface next to Meta Ads, and it is the one platform
where the "reusable machinery in packages" rule earns its keep immediately: Google Ads and
Meta Ads share almost their whole domain vocabulary (campaigns, ad groups, spend,
impressions, clicks, conversions, ROAS). Built before part 03, it would grow its own
private copy of that logic; built after, it composes `analytics-core` and only adds an
adapter.

## Deliverables

- `packages/js/google-ads-core/` — port + Effect service over the Google Ads API, tagged
  errors (`GoogleAdsApiError`, `GoogleAdsQuotaError`, `TimeoutError`), reusing
  `analytics-core`'s metric model and KPI math.
- `apps/google-ads-mcp/` — the container: config, tool schemas, registration, composition
  root. Tools named per the convention: `google_ads_get_campaigns`,
  `google_ads_get_insights`, and whatever the paid-media-report doc calls for.
- Per-call account override — `customerId` overriding `GOOGLE_ADS_CUSTOMER_ID` — per the
  multi-brand rule in `.claude/rules/marketing-analytics.md`. Non-negotiable: one running
  server must serve every brand.
- Port assignment: next free after 3008, verified by `check-ports.mjs`.
- `.env.template`, README, `make run-google-ads-mcp`, and inclusion in
  `make run-analytics-mcps`.
- `mndy-mcp` plugin: `.mcp.json` entry (`mndy-google-ads`), `MNDY_GOOGLE_ADS_MCP_URL`
  override, a `google-ads` skill, and rows in the `mndy-mcps` skill's server table.
- `mndy-brands.example.json` gains a Google Ads `customerId` field alongside the GA4
  `propertyId` and Meta `adAccountId`.
- Integration tests under `tests/integration/google-ads-mcp/`.

## Open questions

- **Auth model.** Google Ads needs a developer token plus OAuth2 (client id/secret/refresh
  token) *and* usually a login-customer-id for manager accounts — materially more moving
  parts than GA4's service-account JSON. Decide whether credentials live in `.env` or in
  `secrets/` like the GA4 key, and document the acquisition path; it is the step most
  likely to block a user.
- **Client library.** `google-ads-api` (community, ergonomic) vs `google-ads-nodejs-client`
  (official, generated, heavier). Pick during implementation and record the reason here.
- Whether the paid-media report is a tool on this server or a composition across Meta +
  Google Ads living in `analytics-core`. Leaning toward the latter — it is exactly the kind
  of cross-platform logic that must not live in a single server.
