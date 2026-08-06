/**
 * github-core — the GitHub issues domain and its REST API adapter.
 */

export * from "./domain/models.js";
export { GitHubApiError, GitHubRateLimitError } from "./domain/errors.js";
export type { GitHubFailure, GitHubIssueReader, GitHubIssueWriter } from "./domain/ports.js";

// Infrastructure — wire this from a composition root only.
export * from "./infrastructure/github.client.js";
