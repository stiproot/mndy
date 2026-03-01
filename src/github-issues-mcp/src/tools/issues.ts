import { z, type McpServer, createLogger } from "mcp-core";
import { createGitHubClient } from "../services/github.js";
import type { IssueFilters } from "../types.js";

const logger = createLogger("github_list_issues");

/**
 * Input schema for the github_list_issues tool
 */
export const listIssuesSchema = {
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  state: z
    .enum(["open", "closed", "all"])
    .optional()
    .describe("Filter by issue state"),
  labels: z
    .string()
    .optional()
    .describe("Comma-separated list of label names to filter by"),
  assignee: z
    .string()
    .optional()
    .describe('Filter by assignee username, "none" for unassigned, "*" for any'),
  creator: z.string().optional().describe("Filter by issue creator username"),
  mentioned: z
    .string()
    .optional()
    .describe("Filter by username mentioned in the issue"),
  milestone: z
    .string()
    .optional()
    .describe('Filter by milestone number, "none", or "*" for any'),
  since: z
    .string()
    .optional()
    .describe("Only issues updated after this ISO 8601 timestamp"),
  sort: z
    .enum(["created", "updated", "comments"])
    .optional()
    .describe("Sort field"),
  direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
  per_page: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (max 100)"),
  page: z.number().min(1).optional().describe("Page number"),
};

/**
 * Register the github_list_issues tool on the server
 */
export function registerIssuesTool(server: McpServer): void {
  const client = createGitHubClient();

  server.registerTool(
    "github_list_issues",
    {
      title: "List GitHub Issues",
      description:
        "Fetch issues from a GitHub repository with optional filters for state, labels, assignee, creator, milestone, and more.",
      inputSchema: listIssuesSchema,
    },
    async (args) => {
      try {
        const filters: IssueFilters = {
          owner: args.owner,
          repo: args.repo,
          state: args.state,
          labels: args.labels,
          assignee: args.assignee,
          creator: args.creator,
          mentioned: args.mentioned,
          milestone: args.milestone,
          since: args.since,
          sort: args.sort,
          direction: args.direction,
          per_page: args.per_page,
          page: args.page,
        };

        logger.debug("Fetching issues with filters", filters);

        const result = await client.listIssues(filters);

        logger.debug("Issues response", {
          total_count: result.total_count,
          returned: result.issues.length,
          issues: result.issues.map((i) => ({
            number: i.number,
            state: i.state,
            title: i.title,
            user: i.user?.login,
          })),
        });

        const summary = `Found ${result.total_count} issue(s) in ${args.owner}/${args.repo} (page ${result.page})`;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary,
                  ...result,
                },
                null,
                2
              ),
            },
          ],
          structuredContent: {
            summary,
            ...result,
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error fetching issues: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
