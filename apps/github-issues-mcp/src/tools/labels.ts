import { Effect } from "effect";
import { type McpServer, createLogger, z } from "mcp-core";
import { GitHubClient } from "../services/github.js";
import type { AddLabelsInput, RemoveLabelInput } from "../types.js";

const logger = createLogger("github_labels");

/**
 * Input schema for the github_add_labels tool (Zod for MCP SDK compatibility)
 */
export const addLabelsSchema = {
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  issue_number: z.number().describe("Issue number"),
  labels: z.array(z.string()).describe("Labels to add to the issue"),
};

/**
 * Input schema for the github_remove_label tool (Zod for MCP SDK compatibility)
 */
export const removeLabelSchema = {
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  issue_number: z.number().describe("Issue number"),
  label: z.string().describe("Label name to remove from the issue"),
};

/**
 * Add labels effect - the core business logic
 */
const addLabelsEffect = (input: AddLabelsInput) =>
  Effect.gen(function* () {
    const client = yield* GitHubClient;

    logger.debug("Adding labels", input);

    const result = yield* client.addLabels(input);

    logger.debug("Labels added", {
      issue_number: result.issue_number,
      labels: result.labels.map((l) => l.name),
    });

    const summary = `Added ${input.labels.length} label(s) to issue #${input.issue_number} in ${input.owner}/${input.repo}`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              summary,
              added: input.labels,
              currentLabels: result.labels,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        summary,
        added: input.labels,
        currentLabels: result.labels,
      },
    };
  }).pipe(
    Effect.catchTags({
      GitHubApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Error adding labels: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`,
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
 * Remove label effect - the core business logic
 */
const removeLabelEffect = (input: RemoveLabelInput) =>
  Effect.gen(function* () {
    const client = yield* GitHubClient;

    logger.debug("Removing label", input);

    const result = yield* client.removeLabel(input);

    logger.debug("Label removed", {
      issue_number: result.issue_number,
      remainingLabels: result.labels.map((l) => l.name),
    });

    const summary = `Removed label "${input.label}" from issue #${input.issue_number} in ${input.owner}/${input.repo}`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              summary,
              removed: input.label,
              remainingLabels: result.labels,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        summary,
        removed: input.label,
        remainingLabels: result.labels,
      },
    };
  }).pipe(
    Effect.catchTags({
      GitHubApiError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Error removing label: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`,
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
 * Register the github_add_labels tool on the server
 */
export function registerAddLabelsTool(server: McpServer): void {
  server.registerTool(
    "github_add_labels",
    {
      title: "Add Labels to GitHub Issue",
      description:
        "Add one or more labels to an existing GitHub issue. Does not remove existing labels.",
      inputSchema: addLabelsSchema,
    },
    (args) => {
      const input: AddLabelsInput = {
        owner: args.owner,
        repo: args.repo,
        issue_number: args.issue_number,
        labels: args.labels,
      };

      return Effect.runPromise(
        addLabelsEffect(input).pipe(Effect.provide(GitHubClient.Default))
      );
    }
  );
}

/**
 * Register the github_remove_label tool on the server
 */
export function registerRemoveLabelTool(server: McpServer): void {
  server.registerTool(
    "github_remove_label",
    {
      title: "Remove Label from GitHub Issue",
      description: "Remove a specific label from an existing GitHub issue.",
      inputSchema: removeLabelSchema,
    },
    (args) => {
      const input: RemoveLabelInput = {
        owner: args.owner,
        repo: args.repo,
        issue_number: args.issue_number,
        label: args.label,
      };

      return Effect.runPromise(
        removeLabelEffect(input).pipe(Effect.provide(GitHubClient.Default))
      );
    }
  );
}
