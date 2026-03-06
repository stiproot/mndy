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

  return builder.build();
}

