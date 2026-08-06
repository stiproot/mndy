import { Octokit } from "@octokit/rest";
import { Duration, Effect, Layer, Schedule } from "effect";
import type { Issue, IssueFilters, ListIssuesResult, UpdateIssueInput, UpdateIssueResult, AddLabelsInput, RemoveLabelInput, LabelsResult } from "../types.js";
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
 * Wrap GitHub API call with timeout, error handling, tracing, and retry
 */
const withApiResilience = <T>(
  effect: Effect.Effect<T, never, never>,
  spanName: string,
  attributes: Record<string, string | number>
): Effect.Effect<T, GitHubApiError | GitHubRateLimitError | TimeoutError> =>
  effect.pipe(
    Effect.timeoutFail({
      duration: REQUEST_TIMEOUT,
      onTimeout: () =>
        new TimeoutError({
          message: "GitHub API request timed out",
          duration: Duration.format(REQUEST_TIMEOUT),
        }),
    }),
    Effect.catchAllDefect((defect) => Effect.fail(extractOctokitError(defect))),
    Effect.withSpan(spanName, { attributes }),
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "GitHubApiError" && isRetryableError(error),
    })
  );

/**
 * Call GitHub API to list issues for a repo
 */
const callListIssuesApi = (
  octokit: Octokit,
  filters: IssueFilters
): Effect.Effect<
  Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>,
  GitHubApiError | GitHubRateLimitError | TimeoutError
> => {
  const { owner, repo, ...options } = filters;

  return withApiResilience(
    Effect.promise(() =>
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
    ),
    "github.listIssuesForRepo",
    {
      "github.owner": filters.owner,
      "github.repo": filters.repo,
      "github.state": filters.state ?? "open",
    }
  );
};

/**
 * Call GitHub API to update an issue
 */
const callUpdateIssueApi = (
  octokit: Octokit,
  input: UpdateIssueInput
): Effect.Effect<
  Awaited<ReturnType<Octokit["issues"]["update"]>>,
  GitHubApiError | GitHubRateLimitError | TimeoutError
> => {
  const { owner, repo, issue_number, ...updates } = input;

  return withApiResilience(
    Effect.promise(() =>
      octokit.issues.update({
        owner,
        repo,
        issue_number,
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.body !== undefined && { body: updates.body }),
        ...(updates.state !== undefined && { state: updates.state }),
        ...(updates.labels !== undefined && { labels: updates.labels }),
        ...(updates.assignees !== undefined && { assignees: updates.assignees }),
        ...(updates.milestone !== undefined && { milestone: updates.milestone }),
      })
    ),
    "github.updateIssue",
    {
      "github.owner": owner,
      "github.repo": repo,
      "github.issue_number": issue_number,
    }
  );
};

/**
 * Call GitHub API to add labels to an issue
 */
const callAddLabelsApi = (
  octokit: Octokit,
  input: AddLabelsInput
): Effect.Effect<
  Awaited<ReturnType<Octokit["issues"]["addLabels"]>>,
  GitHubApiError | GitHubRateLimitError | TimeoutError
> =>
  withApiResilience(
    Effect.promise(() =>
      octokit.issues.addLabels({
        owner: input.owner,
        repo: input.repo,
        issue_number: input.issue_number,
        labels: input.labels,
      })
    ),
    "github.addLabels",
    {
      "github.owner": input.owner,
      "github.repo": input.repo,
      "github.issue_number": input.issue_number,
    }
  );

/**
 * Call GitHub API to remove a label from an issue
 */
const callRemoveLabelApi = (
  octokit: Octokit,
  input: RemoveLabelInput
): Effect.Effect<
  Awaited<ReturnType<Octokit["issues"]["removeLabel"]>>,
  GitHubApiError | GitHubRateLimitError | TimeoutError
> =>
  withApiResilience(
    Effect.promise(() =>
      octokit.issues.removeLabel({
        owner: input.owner,
        repo: input.repo,
        issue_number: input.issue_number,
        name: input.label,
      })
    ),
    "github.removeLabel",
    {
      "github.owner": input.owner,
      "github.repo": input.repo,
      "github.issue_number": input.issue_number,
      "github.label": input.label,
    }
  );

/**
 * Transform a single issue from GitHub API response
 */
const transformIssue = (
  item: Awaited<ReturnType<Octokit["issues"]["get"]>>["data"]
): Issue => ({
  number: item.number,
  title: item.title,
  state: item.state as "open" | "closed",
  labels: (item.labels ?? [])
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
});

/**
 * Transform labels from GitHub API response
 */
const transformLabels = (
  data: Awaited<ReturnType<Octokit["issues"]["addLabels"]>>["data"],
  issueNumber: number
): LabelsResult => ({
  labels: data.map((l) => ({
    name: l.name ?? "",
    color: l.color ?? "",
  })),
  issue_number: issueNumber,
});

/**
 * Transform GitHub API response to our domain model
 */
const transformListResponse = (
  data: Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>["data"],
  filters: IssueFilters
): ListIssuesResult => {
  const issues: Issue[] = data
    .filter((item) => !item.pull_request)
    .map((item) => transformIssue(item as Parameters<typeof transformIssue>[0]));

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
        callListIssuesApi(octokit, filters).pipe(
          Effect.map((response) => transformListResponse(response.data, filters)),
          Effect.withSpan("GitHubClient.listIssues")
        ),

      /**
       * Update an issue (title, body, state, labels, assignees, milestone)
       */
      updateIssue: (
        input: UpdateIssueInput
      ): Effect.Effect<UpdateIssueResult, GitHubApiError | GitHubRateLimitError | TimeoutError> =>
        callUpdateIssueApi(octokit, input).pipe(
          Effect.map((response) => ({
            issue: transformIssue(response.data),
            updated: true,
          })),
          Effect.withSpan("GitHubClient.updateIssue")
        ),

      /**
       * Add labels to an issue
       */
      addLabels: (
        input: AddLabelsInput
      ): Effect.Effect<LabelsResult, GitHubApiError | GitHubRateLimitError | TimeoutError> =>
        callAddLabelsApi(octokit, input).pipe(
          Effect.map((response) => transformLabels(response.data, input.issue_number)),
          Effect.withSpan("GitHubClient.addLabels")
        ),

      /**
       * Remove a label from an issue
       */
      removeLabel: (
        input: RemoveLabelInput
      ): Effect.Effect<LabelsResult, GitHubApiError | GitHubRateLimitError | TimeoutError> =>
        callRemoveLabelApi(octokit, input).pipe(
          Effect.map((response) => transformLabels(response.data, input.issue_number)),
          Effect.withSpan("GitHubClient.removeLabel")
        ),
    };
  }),
}) {}

/**
 * Live layer for GitHubClient
 */
export const GitHubClientLive = GitHubClient.Default;
