import { Octokit } from "@octokit/rest";
import { Effect, Layer } from "effect";
import type { Issue, IssueFilters, ListIssuesResult } from "../types.js";
import { GitHubApiError, GitHubConfig } from "../types.js";

const MAX_BODY_LENGTH = 500;

/**
 * Call GitHub API to list issues for a repo
 */
const callGitHubApi = (
  octokit: Octokit,
  filters: IssueFilters
): Effect.Effect<Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>, GitHubApiError> => {
  const { owner, repo, ...options } = filters;

  return Effect.promise(() =>
    octokit.issues.listForRepo({
      owner,
      repo,
      state: options.state === "all" ? "all" : options.state,
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
    })
  ).pipe(
    Effect.catchAllDefect((defect) =>
      Effect.fail(
        new GitHubApiError({
          message: defect instanceof Error ? defect.message : "Unknown GitHub API error",
          cause: defect,
        })
      )
    )
  );
};

/**
 * Transform GitHub API response to our domain model
 */
const transformResponse = (
  data: Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>["data"],
  filters: IssueFilters
): ListIssuesResult => {
  const issues: Issue[] = data
    .filter((item) => !item.pull_request)
    .map((item) => ({
      number: item.number,
      title: item.title,
      state: item.state as "open" | "closed",
      labels: item.labels
        .filter(
          (l): l is { name: string; color: string } =>
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
    page: filters.page ?? 1,
    per_page: Math.min(filters.per_page ?? 30, 100),
  };
};

/**
 * GitHubClient service interface
 */
export class GitHubClient extends Effect.Service<GitHubClient>()("GitHubClient", {
  effect: Effect.gen(function* () {
    const config = yield* GitHubConfig;

    const octokit = new Octokit({
      auth: config.token || undefined,
    });

    return {
      /**
       * Check if a token is configured
       */
      hasToken: (): boolean => config.token !== "",

      /**
       * List issues from a repository with filters
       */
      listIssues: (filters: IssueFilters): Effect.Effect<ListIssuesResult, GitHubApiError> =>
        callGitHubApi(octokit, filters).pipe(
          Effect.map((response) => transformResponse(response.data, filters))
        ),
    };
  }),
}) {}

/**
 * Live layer for GitHubClient
 */
export const GitHubClientLive = GitHubClient.Default;
