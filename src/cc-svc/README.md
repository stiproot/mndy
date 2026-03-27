# cc-svc (Claude Code Service)

Multi-agent orchestration service for automated contributor insights and brand analytics.

## Overview

cc-svc coordinates multiple specialized AI agents to generate comprehensive insights. It uses a **two-phase orchestration pattern**: specialized agents run in parallel to gather data, then an orchestrator agent synthesizes their results into actionable intelligence.

**Key Capabilities:**

- **Contributor Insights** - Analyze GitHub contributor activity and quality
- **Brand Analytics** - Cross-platform marketing analytics (GA4, Meta, Shopify)
- **Real-time Streaming** - SSE support for live analysis progress
- **MCP Integration** - Platform-specific tools via Model Context Protocol

## Architecture

### Two-Phase Orchestration Pattern

```
API Request (requirements)
         ↓
┌────────────────────────┐
│  PHASE 1: PARALLEL     │
│                        │
│  Sub-Agent 1 →┐        │
│  Sub-Agent 2 →├─ Data │
│  Sub-Agent 3 →┘        │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  PHASE 2: SYNTHESIS    │
│                        │
│  Orchestrator Agent    │
│  • Combines results    │
│  • Generates insights  │
└────────────────────────┘
         ↓
   Validated Response
```

### Workflows

#### Contributor Insights

```
POST /contributor-insights → OrchestratorService

Phase 1: Promise.all([
  Issue Analyzer      (themes, types, quality)
  Activity Tracker    (frequency, trends)
  Quality Assessor    (resolution, engagement)
])

Phase 2: Orchestrator synthesizes → ContributorInsightsResponse
```

#### Brand Insights

```
POST /brand-insights → BrandInsightsService

Phase 1: Promise.all([
  GA4 Analyst         (web analytics)
  Shopify Analyst     (e-commerce data)
  Meta Analyst        (ad performance)
])

Phase 2: Brand Orchestrator → BrandInsightsResponse
```

## Request Flow

### How Requirements Are Communicated

```
1. HTTP Request
   → Validated against Zod schema
   → Parameters: owner, repo, username, options

2. Controller
   → Extracts parameters
   → Routes to service method

3. OrchestratorService
   → Decides which agents to run
   → Executes Phase 1 (parallel) and Phase 2 (synthesis)
```

### How Orchestrator Communicates to Sub-Agents

Each sub-agent receives a **tailored prompt** consisting of:

1. **System Prompt** (static)
   - Role definition
   - Analysis categories
   - Available MCP tools
   - Expected output format

2. **Runtime Prompt** (dynamic)
   - Request parameters (owner/repo/username)
   - Options (lookbackDays, maxIssues, etc.)
   - Specific instructions

3. **MCP Tool Access**
   - Platform-specific tools (GitHub, GA4, Meta, Shopify)
   - Accessed via `mcp__<server>__<tool>` naming

4. **Resource Constraints**
   - Max turns (5 for sub-agents, 10 for orchestrator)
   - Budget limits ($0.25 for sub-agents, $1.00 for orchestrator)

The orchestrator then receives **all sub-agent results** and synthesizes them into comprehensive insights.

## Planning & Multi-Step Workflow

Planning happens at **three levels**:

1. **Service Level** - OrchestratorService decides which specialized agents to execute in parallel

2. **Sub-Agent Level** - Each agent uses multiple turns (up to 5) to:
   - Fetch data using MCP tools
   - Analyze and categorize
   - Generate structured output

3. **Orchestrator Level** - Synthesis agent:
   - Receives complete context from all sub-agents
   - Identifies patterns and correlations
   - Calculates scores and recommendations
   - Generates validated JSON response

## MCP Integration

MCP (Model Context Protocol) servers provide platform-specific tools.

**Tool Naming:** `mcp__<server-name>__<tool-name>`

**Available Servers:**

- `github-issues` (required) - Issue and PR data
- `ga4` (optional) - Google Analytics
- `meta` (optional) - Facebook/Instagram ads
- `shopify` (optional) - E-commerce data

Agents specify which MCP servers they need access to during creation.

## Getting Started

```bash
# 1. Environment setup
cp .env.template .env
# Configure ANTHROPIC_API_KEY and GITHUB_ISSUES_MCP_URL

# 2. Install and run
bun install
bun run dev

# 3. Test
curl -X POST http://localhost:3002/contributor-insights \
  -H "Content-Type: application/json" \
  -d '{"owner":"anthropics","repo":"claude-code","username":"johndoe"}'
```

## Project Structure

```
src/
├── agents/          # Agent factory functions
├── controllers/     # HTTP request handlers
├── prompts/         # System and runtime prompts
├── schemas/         # Zod validation schemas
├── services/        # Orchestration logic
└── routes/          # Express routes

../cc-core/          # Shared agent SDK
```

**Key Files:**

- `services/orchestrator.service.ts` - Main orchestration logic (Phase 1 & 2)
- `agents/index.ts` - Agent creation with MCP and prompts
- `prompts/*.prompt.ts` - System prompts for each agent
- `schemas/*.schema.ts` - Request/response validation

## Configuration

**Required:**

- `ANTHROPIC_API_KEY` - Claude API access
- `GITHUB_ISSUES_MCP_URL` - GitHub MCP server

**Resource Limits:**

- Sub-agents: 5 turns, $0.25 max
- Orchestrator: 10 turns, $1.00 max
- Total cost per request: ~$1.75 max

See `.env.template` for all options.

## Streaming Support

Use `?stream=true` or `Accept: text/event-stream` for real-time progress:

```bash
curl -N http://localhost:3002/contributor-insights?stream=true \
  -H "Content-Type: application/json" \
  -d '{"owner":"anthropics","repo":"claude-code","username":"johndoe"}'
```

**Stream Events:**

- `phase` - Progress updates (issue-analysis started/completed)
- `text` - Real-time synthesis output
- `tool` - Agent tool usage
- `complete` - Final result

## Related Documentation

- [cc-core Agent SDK](../cc-core/README.md)
- [github-issues-mcp](../github-issues-mcp/README.md)
- [Effect-TS Standards](../../docs/guides/effect-ts-standards.md)
- [MCP Specification](https://modelcontextprotocol.io/)
