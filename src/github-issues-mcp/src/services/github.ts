import { Octokit } from "@octokit/rest";
import { Duration, Effect, Layer, Schedule } from "effect";
import type { Issue, IssueFilters, ListIssuesResult } from "../types.js";
import { GitHubApiError, GitHubRateLimitError, TimeoutError, GitHubConfig } from "../types.js";

const MAX_BODY_LENGTH = 500;
const REQUEST_TIMEOUT = Duration.seconds(30);
const MAX_RETRIES = 3;

/**
 * Type guard for Octokit RequestError (duck typing)
 */
interface OctokitRequestError extends Error {
  status: number;
  response?: {
    headers?: Record<string, string>;
  };
}

const isOctokitRequestError = (error: unknown): error is OctokitRequestError =>
  error instanceof Error &&
  "status" in error &&
  typeof (error as OctokitRequestError).status === "number";

/**
 * Retry schedule with exponential backoff and jitter
 * Retries on transient errors (5xx, network issues)
 */
const retrySchedule = Schedule.exponential(Duration.millis(500)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES))
);

/**
 * Check if an error is retryable (transient)
 */
const isRetryableError = (error: GitHubApiError): boolean => {
  const status = error.status;
  if (!status) return true; // Network errors are retryable
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Extract error details from Octokit errors
 */
const extractOctokitError = (
  error: unknown
): GitHubApiError | GitHubRateLimitError => {
  if (isOctokitRequestError(error)) {
    // Handle rate limiting
    if (error.status === 403 || error.status === 429) {
      const resetHeader = error.response?.headers?.["x-ratelimit-reset"];
      const retryAfterHeader = error.response?.headers?.["retry-after"];

      return new GitHubRateLimitError({
        message: error.message || "GitHub API rate limit exceeded",
        resetAt: resetHeader ? new Date(parseInt(resetHeader) * 1000) : undefined,
        retryAfter: retryAfterHeader ? parseInt(retryAfterHeader) : undefined,
      });
    }

    return new GitHubApiError({
      message: error.message,
      status: error.status,
      cause: error,
    });
  }

  return new GitHubApiError({
    message: error instanceof Error ? error.message : "Unknown GitHub API error",
    cause: error,
  });
};

/**
 * Call GitHub API to list issues for a repo
 */
const callGitHubApi = (
  octokit: Octokit,
  filters: IssueFilters
): Effect.Effect<
  Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>,
  GitHubApiError | GitHubRateLimitError | TimeoutError
> => {
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
    // Add timeout
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "GitHub API request timed out",
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    // Convert defects to typed errors
    Effect.catchAllDefect((defect) => Effect.fail(extractOctokitError(defect))),
    // Add tracing span
    Effect.withSpan("github.listIssuesForRepo", {
      attributes: {
        "github.owner": filters.owner,
        "github.repo": filters.repo,
        "github.state": filters.state ?? "open",
      },
    }),
    // Retry transient errors with backoff
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "GitHubApiError" && isRetryableError(error),
    })
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
      listIssues: (
        filters: IssueFilters
      ): Effect.Effect<ListIssuesResult, GitHubApiError | GitHubRateLimitError | TimeoutError> =>
        callGitHubApi(octokit, filters).pipe(
          Effect.map((response) => transformResponse(response.data, filters)),
          Effect.withSpan("GitHubClient.listIssues")
        ),
    };
  }),
}) {}

/**
 * Live layer for GitHubClient
 */
export const GitHubClientLive = GitHubClient.Default;
