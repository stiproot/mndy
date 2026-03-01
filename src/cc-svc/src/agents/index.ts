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
} from "../prompts/index.js";

/**
 * Get the GitHub Issues MCP server configuration
 */
function getGitHubMcpServer() {
  const config = getConfig();
  return createHttpMcpServer(config.GITHUB_ISSUES_MCP_URL);
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

