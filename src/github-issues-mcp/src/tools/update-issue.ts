import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { GitHubClient } from "../services/github.js";
import type { UpdateIssueInput } from "../types.js";

const logger = createLogger("github_update_issue");

/**
 * Input schema for the github_update_issue tool (Zod for MCP SDK compatibility)
 */
export const updateIssueSchema = {
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  issue_number: z.number().describe("Issue number to update"),
  title: z.string().optional().describe("New title for the issue"),
  body: z.string().optional().describe("New body content for the issue"),
  state: z.enum(["open", "closed"]).optional().describe("Set issue state"),
  labels: z
    .array(z.string())
    .optional()
    .describe("Replace all labels with these"),
  assignees: z
    .array(z.string())
    .optional()
    .describe("Replace all assignees with these usernames"),
  milestone: z
    .number()
    .nullable()
    .optional()
    .describe("Milestone number (null to clear)"),
};

/**
 * Update issue effect - the core business logic
 */
const updateIssueEffect = (input: UpdateIssueInput) =>
  Effect.gen(function* () {
    const client = yield* GitHubClient;

    logger.debug("Updating issue", input);

    const result = yield* client.updateIssue(input);

    logger.debug("Issue updated", {
      number: result.issue.number,
      state: result.issue.state,
      title: result.issue.title,
      labels: result.issue.labels.map((l) => l.name),
    });

    const summary = `Updated issue #${result.issue.number} in ${input.owner}/${input.repo}`;

    return {
      content: [
        {
          type: "text" as const,
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
  }).pipe(
    Effect.catchTags({
      GitHubApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Error updating issue: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      GitHubRateLimitError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `GitHub rate limit exceeded: ${error.message}${error.retryAfter ? `. Retry after ${error.retryAfter} seconds.` : ""}`,
            },
          ],
          isError: true as const,
        }),
      TimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Request timed out after ${error.duration}: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
    })
  );

/**
 * Register the github_update_issue tool on the server
 */
export function registerUpdateIssueTool(server: McpServer): void {
  server.registerTool(
    "github_update_issue",
    {
      title: "Update GitHub Issue",
      description:
        "Update an existing GitHub issue. Can modify title, body, state, labels, assignees, and milestone.",
      inputSchema: updateIssueSchema,
    },
    (args) => {
      const input: UpdateIssueInput = {
        owner: args.owner,
        repo: args.repo,
        issue_number: args.issue_number,
        title: args.title,
        body: args.body,
        state: args.state,
        labels: args.labels,
        assignees: args.assignees,
        milestone: args.milestone,
      };

      return Effect.runPromise(
        updateIssueEffect(input).pipe(Effect.provide(GitHubClient.Default))
      );
    }
  );
}
