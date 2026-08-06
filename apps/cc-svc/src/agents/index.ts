import {
  agentBuilder,
  createHttpMcpServer,
  type Agent,
} from "cc-core";
import { getConfig } from "../config/index.js";
import {
  ISSUE_ANALYZER_PROMPT,
  ACTIVITY_TRACKER_PROMPT,
  QUALITY_ASSESSOR_PROMPT,
  ORCHESTRATOR_PROMPT,
  CHAT_AGENT_PROMPT,
  GA4_ANALYST_PROMPT,
  SHOPIFY_ANALYST_PROMPT,
  META_ANALYST_PROMPT,
  BRAND_ORCHESTRATOR_PROMPT,
} from "../prompts/index.js";

/**
 * Get the GitHub Issues MCP server configuration
 */
function getGitHubMcpServer() {
  const config = getConfig();
  return createHttpMcpServer(config.GITHUB_ISSUES_MCP_URL);
}

/**
 * Get the GA4 MCP server configuration (if available)
 */
function getGA4McpServer() {
  const config = getConfig();
  if (!config.GA4_MCP_URL) return null;
  return createHttpMcpServer(config.GA4_MCP_URL);
}

/**
 * Get the Meta Ads MCP server configuration (if available)
 */
function getMetaMcpServer() {
  const config = getConfig();
  if (!config.META_MCP_URL) return null;
  return createHttpMcpServer(config.META_MCP_URL);
}

/**
 * Get the Shopify MCP server configuration (if available)
 */
function getShopifyMcpServer() {
  const config = getConfig();
  if (!config.SHOPIFY_MCP_URL) return null;
  return createHttpMcpServer(config.SHOPIFY_MCP_URL);
}

/**
 * Get the Dapr MCP server configuration (if available)
 * Used for persisting state via Dapr actors
 */
function getDaprMcpServer() {
  const config = getConfig();
  if (!config.DAPR_MCP_URL) return null;
  return createHttpMcpServer(config.DAPR_MCP_URL);
}

/**
 * Get the Markdown MCP server configuration (if available)
 * Used for generating markdown files
 */
function getMarkdownMcpServer() {
  const config = getConfig();
  if (!config.MARKDOWN_MCP_URL) return null;
  return createHttpMcpServer(config.MARKDOWN_MCP_URL);
}

/**
 * Create the issue analyzer agent
 */
export function createIssueAnalyzerAgent(): Agent {
  const config = getConfig();

  return agentBuilder("issue-analyzer")
    .model(config.CLAUDE_MODEL)
    .mcpServer("github-issues", getGitHubMcpServer())
    .systemPrompt(ISSUE_ANALYZER_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    .build();
}

/**
 * Create the activity tracker agent
 */
export function createActivityTrackerAgent(): Agent {
  const config = getConfig();

  return agentBuilder("activity-tracker")
    .model(config.CLAUDE_MODEL)
    .mcpServer("github-issues", getGitHubMcpServer())
    .systemPrompt(ACTIVITY_TRACKER_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    .build();
}

/**
 * Create the quality assessor agent
 */
export function createQualityAssessorAgent(): Agent {
  const config = getConfig();

  return agentBuilder("quality-assessor")
    .model(config.CLAUDE_MODEL)
    .mcpServer("github-issues", getGitHubMcpServer())
    .systemPrompt(QUALITY_ASSESSOR_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    .build();
}

/**
 * Create the orchestrator agent for synthesizing results
 */
export function createOrchestratorAgent(): Agent {
  const config = getConfig();

  return agentBuilder("orchestrator")
    .model(config.CLAUDE_MODEL)
    .systemPrompt(ORCHESTRATOR_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_ORCHESTRATOR_TURNS)
    .maxBudget(config.MAX_BUDGET_USD)
    .persistSession(false)
    .build();
}

/**
 * Create the chat agent with access to all available MCP servers
 */
export function createChatAgent(): Agent {
  const config = getConfig();

  const builder = agentBuilder("chat-agent")
    .model(config.CLAUDE_MODEL)
    .systemPrompt(CHAT_AGENT_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_CHAT_TURNS)
    .maxBudget(config.MAX_CHAT_BUDGET_USD)
    .persistSession(false);

  // Add available MCP servers
  builder.mcpServer("github-issues", getGitHubMcpServer());

  const ga4Server = getGA4McpServer();
  if (ga4Server) {
    builder.mcpServer("ga4", ga4Server);
  }

  const metaServer = getMetaMcpServer();
  if (metaServer) {
    builder.mcpServer("meta-ads", metaServer);
  }

  const shopifyServer = getShopifyMcpServer();
  if (shopifyServer) {
    builder.mcpServer("shopify", shopifyServer);
  }

  const daprServer = getDaprMcpServer();
  if (daprServer) {
    builder.mcpServer("dapr", daprServer);
  }

  const markdownServer = getMarkdownMcpServer();
  if (markdownServer) {
    builder.mcpServer("markdown", markdownServer);
  }

  return builder.build();
}

/**
 * Create the GA4 analyst agent for brand insights
 */
export function createGA4AnalystAgent(): Agent | null {
  const config = getConfig();
  const ga4Server = getGA4McpServer();
  const daprServer = getDaprMcpServer();

  if (!ga4Server) {
    return null;
  }

  const builder = agentBuilder("ga4-analyst")
    .model(config.CLAUDE_MODEL)
    .mcpServer("ga4", ga4Server)
    .systemPrompt(GA4_ANALYST_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    // Disable filesystem tools - only use MCP tools
    .disallowTools("Read", "Write", "Edit", "Bash", "Glob", "Grep");

  if (daprServer) {
    builder.mcpServer("dapr", daprServer);
  }

  return builder.build();
}

/**
 * Create the Shopify analyst agent for brand insights
 */
export function createShopifyAnalystAgent(): Agent | null {
  const config = getConfig();
  const shopifyServer = getShopifyMcpServer();
  const daprServer = getDaprMcpServer();

  if (!shopifyServer) {
    return null;
  }

  const builder = agentBuilder("shopify-analyst")
    .model(config.CLAUDE_MODEL)
    .mcpServer("shopify", shopifyServer)
    .systemPrompt(SHOPIFY_ANALYST_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    // Disable filesystem tools - only use MCP tools
    .disallowTools("Read", "Write", "Edit", "Bash", "Glob", "Grep");

  if (daprServer) {
    builder.mcpServer("dapr", daprServer);
  }

  return builder.build();
}

/**
 * Create the Meta Ads analyst agent for brand insights
 */
export function createMetaAnalystAgent(): Agent | null {
  const config = getConfig();
  const metaServer = getMetaMcpServer();
  const daprServer = getDaprMcpServer();

  if (!metaServer) {
    return null;
  }

  const builder = agentBuilder("meta-analyst")
    .model(config.CLAUDE_MODEL)
    .mcpServer("meta-ads", metaServer)
    .systemPrompt(META_ANALYST_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_SUBAGENT_TURNS)
    .maxBudget(config.MAX_SUBAGENT_BUDGET_USD)
    .persistSession(false)
    // Disable filesystem tools - only use MCP tools
    .disallowTools("Read", "Write", "Edit", "Bash", "Glob", "Grep");

  if (daprServer) {
    builder.mcpServer("dapr", daprServer);
  }

  return builder.build();
}

/**
 * Create the brand orchestrator agent for synthesizing analytics
 */
export function createBrandOrchestratorAgent(): Agent {
  const config = getConfig();
  const daprServer = getDaprMcpServer();
  const markdownServer = getMarkdownMcpServer();

  const builder = agentBuilder("brand-orchestrator")
    .model(config.CLAUDE_MODEL)
    .systemPrompt(BRAND_ORCHESTRATOR_PROMPT)
    .permissionMode("bypassPermissions")
    .maxTurns(config.MAX_ORCHESTRATOR_TURNS)
    .maxBudget(config.MAX_BUDGET_USD)
    .persistSession(false)
    // Disable filesystem tools - only use MCP tools
    .disallowTools("Read", "Write", "Edit", "Bash", "Glob", "Grep");

  if (daprServer) {
    builder.mcpServer("dapr", daprServer);
  }

  if (markdownServer) {
    builder.mcpServer("markdown", markdownServer);
  }

  return builder.build();
}

/**
 * Check which analytics MCPs are available
 */
export function getAvailableAnalyticsSources(): {
  ga4: boolean;
  shopify: boolean;
  meta: boolean;
} {
  const config = getConfig();
  return {
    ga4: !!config.GA4_MCP_URL,
    shopify: !!config.SHOPIFY_MCP_URL,
    meta: !!config.META_MCP_URL,
  };
}

