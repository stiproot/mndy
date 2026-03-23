# MCP Testing with Claude Code CLI

**Version:** 1.0
**Last Updated:** 2026-03-21
**Purpose:** Guide for testing and developing MCP servers using Claude Code CLI

---

## Table of Contents

1. [Overview](#overview)
2. [Why Test MCPs with Claude Code](#why-test-mcps-with-claude-code)
3. [Setup](#setup)
4. [Configuration](#configuration)
5. [Testing Each MCP](#testing-each-mcp)
6. [Iterative Development Workflow](#iterative-development-workflow)
7. [Development Cycle Example](#development-cycle-example)
8. [Debugging Guide](#debugging-guide)
9. [Best Practices](#best-practices)

---

## Overview

The Model Context Protocol (MCP) enables standardized communication between AI models and external tools/data sources. This guide shows how to test MCP servers interactively using Claude Code CLI before integrating them into production agent workflows.

**MCP Servers in this project:**

| MCP Server | Port | Tools | Purpose |
|------------|------|-------|---------|
| ga4-mcp | 3003 | `ga4_run_report` | Google Analytics 4 data |
| meta-ads-mcp | 3004 | `meta_get_insights`, `meta_get_campaigns` | Facebook/Instagram ads |
| shopify-mcp | 3005 | `shopify_get_orders`, `shopify_get_analytics` | E-commerce data |
| dapr-mcp | 3006 | Data persistence (6 tools) | Dapr actor state management |
| github-issues-mcp | 3001 | Issue management (4 tools) | GitHub issues |

**Total:** 15 tools across 5 MCP servers

---

## Why Test MCPs with Claude Code

### The Problem

When developing MCP tools for agent workflows, the traditional approach is slow:

```
Modify MCP tool → Deploy → Run agent → Wait for result → Debug → Repeat
```

This cycle can take hours when iterating on MCP tools or agent prompts.

### The Solution

Test MCPs directly with Claude Code CLI:

```
Start MCP server → Test tool in CLI → Validate response → Iterate
```

This cycle takes minutes and provides immediate feedback.

### Benefits

| Benefit | Traditional Approach | With Claude Code CLI |
|---------|---------------------|---------------------|
| **Feedback speed** | Minutes per iteration | Seconds per iteration |
| **Debugging** | Black box (agent logs) | See raw API responses |
| **Tool development** | Deploy to test | Test locally, iterate fast |
| **Agent design** | Guess data structure | Write prompts from real data |
| **Error handling** | Discover in production | Test edge cases upfront |

---

## Setup

### Prerequisites

1. **Credentials configured** - Ensure `.env` files exist for MCPs:
   - `src/ga4-mcp/.env`
   - `src/meta-ads-mcp/.env`
   - `src/shopify-mcp/.env`
   - `src/dapr-mcp/.env`
   - `src/github-issues-mcp/.env`

2. **Dependencies installed**:
   ```bash
   make install-node  # Install all Node.js dependencies
   ```

### Step 1: Build MCP Servers

```bash
# Build all MCP packages
make build-mcp  # Builds mcp-core + all MCP servers
make build-dapr  # Builds dapr-core + dapr-mcp
```

### Step 2: Start Infrastructure (for Dapr MCP only)

If testing Dapr MCP, start Dapr infrastructure first:

```bash
make docker-compose-infra  # Starts Dapr sidecar, MongoDB, RabbitMQ, Zipkin
```

### Step 3: Start MCP Servers

**Option A: Individual servers** (recommended for development):

```bash
# Terminal 1: GA4 MCP (port 3003)
make run-ga4-mcp

# Terminal 2: Meta Ads MCP (port 3004)
make run-meta-ads-mcp

# Terminal 3: Shopify MCP (port 3005)
make run-shopify-mcp

# Terminal 4: Dapr MCP (port 3006)
make run-dapr-mcp

# Terminal 5: GitHub Issues MCP (port 3001)
make run-github-issues-mcp
```

**Option B: All servers with Docker Compose**:

```bash
make docker-compose-ai  # Starts all MCP servers + infrastructure
```

### Step 4: Verify Servers Are Running

Check health endpoints:

```bash
curl http://localhost:3003/health  # GA4 → should return {"status": "ok"}
curl http://localhost:3004/health  # Meta
curl http://localhost:3005/health  # Shopify
curl http://localhost:3006/health  # Dapr
curl http://localhost:3001/health  # GitHub
```

### Step 5: Restart Claude Code CLI

The `.claude/mcp.json` configuration file is already created. Restart Claude Code to load it:

```bash
# Exit current session
exit

# Restart in project directory
cd /path/to/mndy
claude
```

Claude Code will automatically discover and connect to all running MCP servers.

---

## Configuration

### MCP Configuration File

**Location:** `.claude/mcp.json`

```json
{
  "mcpServers": {
    "ga4": {
      "transport": "http",
      "url": "http://localhost:3003/mcp"
    },
    "meta-ads": {
      "transport": "http",
      "url": "http://localhost:3004/mcp"
    },
    "shopify": {
      "transport": "http",
      "url": "http://localhost:3005/mcp"
    },
    "dapr": {
      "transport": "http",
      "url": "http://localhost:3006/mcp"
    },
    "github-issues": {
      "transport": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### Transport Options

**HTTP Transport** (recommended):
- ✅ Servers run independently
- ✅ Easy debugging (separate logs)
- ✅ Matches production architecture (cc-svc uses HTTP)
- ✅ No credential duplication needed

**stdio Transport** (not recommended):
- ❌ Requires duplicating `.env` vars into `mcp.json`
- ❌ Harder to debug (no separate logs)
- ❌ Doesn't match production setup

---

## Testing Each MCP

### GA4 MCP

**Available tool:** `ga4_run_report`

**Test 1: Basic report**

```
User: Use ga4_run_report to get sessions and conversions for the last 7 days
```

**Expected response:**
- Dimensions: date
- Metrics: sessions, conversions, totalRevenue
- Date range: Last 7 days

**Test 2: Segmented report**

```
User: Use ga4_run_report to get sessions by traffic source for yesterday
```

**Expected response:**
- Dimensions: sessionSource
- Metrics: sessions
- Date range: Yesterday

**Common issues:**
- Missing `GA4_PROPERTY_ID` in `.env` → Error: "Property ID not configured"
- Invalid service account → Error: "Authentication failed"
- Data delay → GA4 has 24-48 hour processing delay for some metrics

---

### Meta Ads MCP

**Available tools:** `meta_get_insights`, `meta_get_campaigns`

**Test 1: Campaign insights**

```
User: Use meta_get_insights to get spend and ROAS for the last 7 days at campaign level
```

**Expected response:**
- Level: campaign
- Fields: spend, impressions, clicks, purchase_roas
- Date range: Last 7 days

**Test 2: List campaigns**

```
User: Use meta_get_campaigns to list all active campaigns
```

**Expected response:**
- Array of campaigns with id, name, status, objective

**Common issues:**
- Token expired → Error: "OAuthException"
- Invalid ad account → Error: "Account not found"
- Rate limit hit → Error: "Application request limit reached"

---

### Shopify MCP

**Available tools:** `shopify_get_orders`, `shopify_get_analytics`

**Test 1: Recent orders**

```
User: Use shopify_get_orders to get orders from the last 30 days
```

**Expected response:**
- Array of orders with id, created_at, total_price, customer info

**Test 2: Analytics summary**

```
User: Use shopify_get_analytics to calculate revenue and AOV for last month
```

**Expected response:**
- Total orders count
- Total revenue
- Average order value
- Items sold
- New vs returning customers

**Common issues:**
- Invalid access token → Error: "Unauthorized"
- Store URL incorrect → Error: "Shop not found"
- Rate limit → Automatic retry with exponential backoff

---

### Dapr MCP

**Available tools:**
- `submit_ga4_data` - Persist GA4 data
- `submit_shopify_data` - Persist Shopify data
- `submit_meta_data` - Persist Meta data
- `submit_brand_report` - Persist brand report
- `get_cached_data` - Retrieve cached data
- `get_brand_report` - Retrieve brand report

**Test 1: Persist and retrieve GA4 data**

```
User: Use submit_ga4_data with this test data:
{
  "actorId": "test-2026-03-21",
  "data": {
    "sessions": 1000,
    "conversions": 50,
    "revenue": 5000
  }
}

Then use get_cached_data to retrieve it with source="ga4" and actorId="test-2026-03-21"
```

**Expected response:**
- Submit returns success confirmation
- Get returns the exact data plus timestamp

**Test 2: Full agent workflow simulation**

```
User: Simulate the brand insights workflow:
1. Submit test GA4 data
2. Submit test Meta data
3. Submit test Shopify data
4. Verify all data is cached
5. Submit a brand report
6. Retrieve the brand report
```

**Common issues:**
- Dapr sidecar not running → Error: "Connection refused"
- Actor not found → Returns null (not an error)
- Invalid data format → Error: "Validation failed"

---

### GitHub Issues MCP

**Available tools:** `github_list_issues`, `github_update_issue`, `github_add_labels`, `github_remove_label`

**Test:**

```
User: Use github_list_issues to get open issues for this repo
```

---

## Iterative Development Workflow

### The Cycle

```
1. Test MCP tool (Claude Code CLI)
   ↓
2. Validate response (data quality, structure, errors)
   ↓
3. Identify gaps (missing fields, wrong defaults, poor errors)
   ↓
4. Refine MCP tool (modify code, rebuild)
   ↓
5. Re-test (verify fix)
   ↓
6. Update agent primitives (prompts, rules, skills)
   ↓
7. Test full workflow (cc-svc API)
   ↓
8. Success!
```

### When to Use This Workflow

**✅ Use Claude Code CLI testing when:**
- Building a new MCP tool
- Debugging MCP tool responses
- Validating API integrations
- Developing agent prompts (need real data structure)
- Testing edge cases (errors, rate limits, empty results)

**❌ Skip to full stack testing when:**
- MCP tools are stable and verified
- Testing agent orchestration logic
- Testing multi-agent workflows
- Performance testing under load

---

## Development Cycle Example

### Scenario: Add Creative Fatigue Detection

You want the Meta Analyst agent to detect when ad creatives are fatigued (high frequency, rising CPC, declining CTR).

### Traditional Approach (Slow)

```
1. Write agent prompt mentioning creative frequency
2. Deploy cc-svc
3. Call POST /brand-insights/analyze
4. Wait for orchestrator → meta analyst → MCP → response
5. Agent fails: "Frequency field not found"
6. Check meta-ads-mcp code
7. Discover frequency isn't included in response
8. Modify meta-ads-mcp to add frequency
9. Rebuild and redeploy
10. Re-test full workflow
11. Agent works but frequency only available at ad level, not campaign
12. Update prompt
13. Redeploy and test again
14. Finally works after 3+ iterations
```

**Time:** 1-2 hours

### With Claude Code CLI (Fast)

```
1. Test: "Use meta_get_insights and show me all available fields"
2. Claude returns actual response with all fields
3. Observe: Frequency is available but only at ad level, not campaign
4. Modify meta-ads-mcp to ensure frequency is in ad-level response
5. Rebuild: make build-mcp
6. Restart: make run-meta-ads-mcp
7. Re-test: "Call meta_get_insights at ad level, show frequency field"
8. Verify frequency is present and has correct values
9. Write accurate prompt: "Use meta_get_insights at ad level to get frequency..."
10. Add rule to .claude/rules/marketing-analytics.md
11. Test full workflow: POST /brand-insights/analyze
12. Success on first try!
```

**Time:** 15-30 minutes

### Key Learnings from CLI Testing

By testing the MCP directly, you discovered:
1. Frequency is only available at ad level (not campaign/adset)
2. The exact field name: `frequency` (not `freq` or `ad_frequency`)
3. Typical values range from 1.5 to 5.0
4. Frequency > 3.5 correlates with fatigue (rising CPC + declining CTR)

Armed with this knowledge, you wrote accurate agent instructions on the first try.

---

## Debugging Guide

### MCP Tools Not Appearing in Claude Code

**Symptoms:**
- Claude says "I don't have access to ga4_run_report"
- No MCP tools visible

**Solutions:**

1. **Verify `.claude/mcp.json` syntax**:
   ```bash
   cat .claude/mcp.json | jq .  # Should parse without errors
   ```

2. **Check MCP servers are running**:
   ```bash
   curl http://localhost:3003/health  # Should return {"status": "ok"}
   ```

3. **Restart Claude Code CLI**:
   ```bash
   exit
   claude
   ```

4. **Check Claude Code logs** (if available) for connection errors

---

### Tool Calls Fail with API Errors

**Symptoms:**
- Tool call succeeds but returns API error
- Example: "Meta API: Invalid OAuth access token"

**Solutions:**

1. **Check credentials in `.env` files**:
   ```bash
   # Verify credentials are set
   grep META_ACCESS_TOKEN src/meta-ads-mcp/.env
   ```

2. **Check token expiration**:
   - Meta tokens can expire (use System User tokens for production)
   - GA4 service accounts don't expire but can be revoked
   - Shopify tokens don't expire but can be revoked if app is uninstalled

3. **Check MCP server logs** for detailed errors:
   ```bash
   # Logs appear in terminal where MCP server is running
   # Look for API error codes, rate limit messages, etc.
   ```

4. **Test API credentials directly** (outside MCP):
   ```bash
   # Example: Test Meta token
   curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
   ```

---

### Rate Limit Errors

**Symptoms:**
- Error: "Rate limit exceeded"
- Error: "Too many requests"

**Solutions:**

1. **Wait and retry** - MCPs implement exponential backoff automatically
2. **Check platform limits**:
   - Meta: Varies by app tier (standard vs advanced)
   - Shopify: 40 req/s (standard), 80 req/s (Plus)
   - GA4: Quota-based (10,000 tokens/day default)

3. **Reduce request volume** during testing

---

### Dapr MCP Connection Failures

**Symptoms:**
- Error: "Connection refused on port 3500"
- Error: "Dapr sidecar not found"

**Solutions:**

1. **Start Dapr infrastructure**:
   ```bash
   make docker-compose-infra
   ```

2. **Verify Dapr sidecar is running**:
   ```bash
   curl http://localhost:3500/v1.0/healthz  # Should return OK
   ```

3. **Check dapr-mcp startup logs** for Dapr connection errors

---

### Data Quality Issues

**Symptoms:**
- Tool returns data but it's incomplete or incorrect
- Missing expected fields

**Solutions:**

1. **Test MCP tool directly** to see raw response:
   ```
   User: Call meta_get_insights and show me the raw response JSON
   ```

2. **Compare with API documentation**:
   - GA4: Check Google Analytics Data API docs
   - Meta: Check Meta Marketing API docs
   - Shopify: Check Shopify Admin API docs

3. **Check MCP tool implementation** in `src/*-mcp/src/tools/`

4. **Verify data freshness**:
   - GA4: 24-48 hour delay for some metrics
   - Meta: Real-time for most metrics
   - Shopify: Real-time

---

## Best Practices

### When to Test MCPs vs Full Stack

**Use Claude Code CLI for:**

✅ New MCP tool development
✅ Debugging individual tool responses
✅ Validating API integrations
✅ Testing edge cases (errors, empty data, rate limits)
✅ Learning data structures for agent prompt writing
✅ Quick iteration on tool parameters
✅ Exploring platform APIs interactively

**Use full cc-svc workflow for:**

✅ Testing agent orchestration logic
✅ Multi-agent coordination
✅ End-to-end workflow validation
✅ Performance testing
✅ Production smoke tests

### Testing Patterns

**Pattern 1: Data Structure Discovery**

```
User: Call ga4_run_report for last 7 days and show me ALL available fields
```

Use this to understand what data is actually returned before writing agent prompts.

**Pattern 2: Edge Case Testing**

```
User: Call meta_get_insights for a date range with no data. How does it handle empty results?
```

Helps you write better error handling in agent prompts.

**Pattern 3: Workflow Simulation**

```
User: Simulate the GA4 analyst workflow:
1. Fetch data
2. Persist to Dapr
3. Retrieve from cache
4. Verify data matches
```

Tests the full data flow before deploying to production.

**Pattern 4: Comparative Testing**

```
User: Call meta_get_insights at campaign level and ad level for the same date range. What fields differ?
```

Helps understand platform API nuances.

### Development Flow

**✅ Recommended:**

```
1. Test MCP tool in Claude Code CLI (learn data structure)
2. Write agent prompt with accurate field references
3. Test agent prompt in Claude Code CLI (if possible)
4. Deploy to cc-svc
5. Run integration test
6. Success on first try
```

**❌ Anti-pattern:**

```
1. Write agent prompt based on assumptions
2. Deploy to cc-svc
3. Test fails - missing field
4. Check MCP code
5. Modify MCP
6. Redeploy
7. Test fails - wrong field name
8. Repeat 3-4 times until it works
```

### Security

**✅ Good practices:**
- Keep credentials in `.env` files (never in `mcp.json`)
- Use `.gitignore` to exclude `.env` files
- Use localhost-only binding for MCP servers
- Rotate tokens before expiration
- Use System User tokens for Meta (never expire)

**❌ Bad practices:**
- Hardcoding credentials in MCP code
- Committing `.env` files to git
- Exposing MCP servers to public internet
- Using short-lived tokens in production

---

## Summary

Claude Code CLI testing transforms MCP development from a slow, iterative process into a fast, interactive workflow. By testing tools directly, you gain:

1. **Immediate feedback** - See responses in seconds, not minutes
2. **Better understanding** - Learn actual data structures, not assumptions
3. **Faster iteration** - Modify, rebuild, test without full deployment
4. **Informed design** - Write accurate agent prompts from real data
5. **Early bug detection** - Find issues before production

The workflow is simple:

```
Start MCP → Test in CLI → Learn → Refine → Deploy → Success
```

Use this guide to accelerate your MCP development and create more reliable agent workflows.
