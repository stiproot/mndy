import { Octokit } from "@octokit/rest";
import type { Issue, IssueFilters, ListIssuesResult } from "../types.js";

const MAX_BODY_LENGTH = 500;

/**
 * GitHub API client for issues
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * List issues from a repository with filters
   */
  async listIssues(filters: IssueFilters): Promise<ListIssuesResult> {
    const { owner, repo, ...options } = filters;

    const response = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: options.state,
      labels: options.labels,
      assignee: options.assignee,
      creator: options.creator,
      mentioned: options.mentioned,
      milestone: options.milestone,
      since: options.since,
      sort: options.sort,
      direction: options.direction,
      per_page: Math.min(options.per_page ?? 30, 100),
      page: options.page ?? 1,
    });

    const issues: Issue[] = response.data
      .filter((item) => !item.pull_request) // Exclude PRs
      .map((item) => ({
        number: item.number,
        title: item.title,
        state: item.state as "open" | "closed",
        labels: item.labels
          .filter((l): l is { name: string; color: string } =>
            typeof l === "object" && l !== null && "name" in l
          )
          .map((l) => ({
            name: l.name ?? "",
            color: l.color ?? "",
          })),
        assignee: item.assignee
          ? {
              login: item.assignee.login,
              avatar_url: item.assignee.avatar_url,
            }
          : null,
        assignees: (item.assignees ?? []).map((a) => ({
          login: a.login,
          avatar_url: a.avatar_url,
        })),
        user: {
          login: item.user?.login ?? "unknown",
          avatar_url: item.user?.avatar_url ?? "",
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
        closed_at: item.closed_at,
        body: item.body
          ? item.body.length > MAX_BODY_LENGTH
            ? item.body.slice(0, MAX_BODY_LENGTH) + "..."
            : item.body
          : null,
        html_url: item.html_url,
        comments: item.comments,
        milestone: item.milestone
          ? {
              number: item.milestone.number,
              title: item.milestone.title,
            }
          : null,
      }));

    return {
      issues,
      total_count: issues.length,
      page: options.page ?? 1,
      per_page: Math.min(options.per_page ?? 30, 100),
    };
  }
}

/**
 * Create a GitHub client instance
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient(token ?? process.env.GITHUB_TOKEN);
}
