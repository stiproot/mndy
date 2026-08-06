---
name: analytics
description: Answer questions about marketing and ecommerce performance using the mndy analytics MCP servers — GA4 (website traffic), Meta Ads (paid social), Google Ads (paid search) and Shopify (orders and revenue). Use whenever the user asks how a brand, campaign, channel, product or store is performing; wants a weekly or monthly report; asks about ROAS, CPA, CTR, spend, conversions, revenue or traffic; wants to compare platforms or periods; or names a brand to analyse. Covers which server answers which question, working across several platforms at once, switching brands, and reporting numbers honestly.
---

# Marketing & ecommerce analytics

Four read-only servers, each owning one part of the picture. Most real questions need more
than one.

| Question is about… | Server | Tools |
| --- | --- | --- |
| Website traffic, sources, landing pages, on-site engagement | **GA4** | `ga4_run_report` |
| Facebook / Instagram ads — spend, reach, results | **Meta Ads** | `meta_get_insights`, `meta_get_campaigns` |
| Google paid search & display — spend, keywords, quality | **Google Ads** | `google_ads_get_performance`, `google_ads_get_campaigns` |
| Orders, revenue, products, customers | **Shopify** | `shopify_get_orders`, `shopify_get_analytics` |

If a server's tools are missing, it is not running or not configured — say which one and
stop, rather than answering from the servers you do have and leaving the gap unstated.

## Routing a question

**"How are we doing?"** is a multi-platform question. Pull Shopify (what we actually sold),
then the ad platforms (what we spent), then GA4 (where traffic came from). Answer with the
business outcome first; platform detail supports it.

**"Paid media" means Google Ads *and* Meta.** Answering with one is a partial answer. Say
which platforms you used, every time.

**Beware the attribution trap.** Each ad platform counts conversions it believes it caused,
using its own window. Meta's reported purchases plus Google's will usually exceed Shopify's
actual orders — that is double-counting, not a discrepancy to reconcile. **Shopify is the
source of truth for revenue and orders.** Use platform numbers to compare platforms against
themselves over time, not to sum into a total.

## Reporting honestly

These rules matter more than completeness. A confidently wrong number is worse than a gap.

- **A null KPI means "not computable"**, not zero. It happens when an input is missing or a
  denominator is zero — GA4 reports no spend, so ROAS is unanswerable from GA4 alone. Say
  "not available" and why.
- **Never assume a currency symbol.** Amounts are in the account's own currency; several of
  these accounts are ZAR. State the currency once, explicitly. Never add amounts across
  currencies.
- **Do not average percentages.** Recompute CTR and conversion rate from summed numerators
  and denominators — averaging per-campaign CTRs weights a 10-impression campaign the same
  as a 100,000-impression one.
- **Small numbers are not trends.** Below roughly 100 clicks or 30 conversions, say the
  sample is too small rather than reporting a percentage change.
- **Always compare to something** — the previous period, or the same period last year. A
  bare number rarely answers a business question.

## Working with several brands

Each server starts pointed at one default account, but the GA4, Meta and Google Ads tools
take a per-call account override, so **one running server serves every brand its credentials
can reach** — no restarts.

Brands live in a registry file. Look in this order and use the first that exists:
`MNDY_BRANDS_FILE`, `./mndy-brands.json`, `~/.mndy/brands.json`. Read it, then for every
call pass:

| Platform | Pass | From the brand's |
| --- | --- | --- |
| GA4 | `propertyId` | `ga4PropertyId` |
| Meta Ads | `adAccountId` | `metaAdAccountId` |
| Google Ads | `customerId` | `googleAdsCustomerId` |

Hold the resolved brand for the session and reuse it until the user switches.

**Shopify is the exception — one store per running server**, because its auth is bound to a
store. There is no store parameter. If the selected brand's `shopifyStore` does not match
the store the server reports at startup, say so and treat Shopify as unavailable for that
brand. **Never answer a question about brand A with brand B's numbers**; if you cannot
resolve a brand, ask.

If no registry exists, tell the user to create one from
`mndy-brands.example.json` (shipped beside the `brands` skill) and use the server defaults
for now, saying which account you used.

## Recipes

**Weekly performance review.** Shopify for orders, revenue, AOV. Meta and Google Ads for
spend and platform-reported results. GA4 for sessions by channel. Compare each with the
prior week. Lead with revenue and spend, then the two or three things that actually moved,
then what you would do. Blended ROAS is Shopify revenue ÷ total ad spend across platforms —
say that is what you did, since it differs from either platform's own figure.

**Where is budget being wasted?** Google Ads at keyword level with quality metrics; Meta at
ad level with frequency. Look for spend without conversions, and for creative fatigue
(frequency rising while CTR falls and CPC rises — all three, not one). Rank by money at
stake. Pausing is a judgement call: show the numbers and recommend, do not assert.

**Why did revenue drop?** Work backwards down the funnel: Shopify (fewer orders, or lower
AOV?) → GA4 (less traffic, or worse conversion?) → if traffic, which channel → if paid, the
ad platform for that channel. Name the step where the drop appears rather than listing
everything that changed.

**Product performance.** Shopify orders with line items. Aggregate by product; report units
and revenue, and note that the ad platforms cannot attribute to product level.

## Getting the servers running

They are plain processes needing no infrastructure — no database, no Docker.

- **Claude Desktop:** `make install-desktop` from the mndy repo writes the config; restart
  Desktop. Servers start automatically thereafter.
- **Claude Code:** `make start-analytics-mcps`, then `/mcp` to connect.

After changing server code: `make restart-analytics-mcps`, then reconnect (`/mcp`). A
restarted server drops its sessions — a stale one returns
`400 Bad Request: Server not initialized`, which means reconnect, not that anything broke.
