# dapr-mcp

MCP server over the Dapr state store — caching for collected analytics data and generated
brand reports.

> **This is the one MCP server that requires infrastructure.** It needs a Dapr sidecar plus
> the backing services (`make docker-compose-infra`). If you are using the analytics
> servers, you do not need this one — see
> [README § Which servers need infrastructure](../../README.md#which-servers-need-infrastructure).

- **Port:** 3006
- **Endpoint:** `http://localhost:3006/mcp`
- **Health:** `http://localhost:3006/health`

## Run it

```bash
make docker-compose-infra   # Dapr placement, MongoDB, RabbitMQ, Zipkin
make run-dapr-mcp           # launches the server WITH a Dapr sidecar
```

`make run-dapr-mcp` wraps the process in `dapr run`; starting it any other way leaves it
without a sidecar and every tool call will fail.

## Why it exists

The analytics servers read from their platforms on every call. For multi-step analysis —
collect GA4, then Meta, then Shopify, then synthesise a report — re-fetching at each step is
slow and burns API quota. These tools park intermediate results in the Dapr state store so a
later step, or a later agent, can pick them up.

If your workflow is a single question against a single platform, you do not need this.

## Tools

| Tool | Purpose |
| --- | --- |
| `submit_ga4_data` | Cache a GA4 result under a key |
| `submit_meta_data` | Cache a Meta Ads result |
| `submit_shopify_data` | Cache a Shopify result |
| `submit_brand_report` | Store a generated brand report |
| `get_cached_data` | Read back any cached entry |
| `get_brand_report` | Read back a stored report |

Generic actor state tools exist in the source but are **deliberately not registered** —
agents were passing incorrect actor types. Use the structured `submit_*` tools instead.

## Configuration

`.env` (copy `.env.template`):

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | 3006 | HTTP port |
| `LOG_LEVEL` | info | |
| `DAPR_HOST` | localhost | Sidecar host |
| `DAPR_HTTP_PORT` | 3500 | Sidecar HTTP port |

## Architecture note

Unlike the analytics servers, this app still holds its own service and types rather than
delegating to a package — see `docs/plans/carried-followups.md`. It has the shared runtime
and the `presentation/` layer, but its logic extraction is outstanding.
