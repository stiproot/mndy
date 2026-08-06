import type { Effect } from "effect";
import type { TimeoutError } from "analytics-core";
import type { GitHubApiError, GitHubRateLimitError } from "./errors.js";
import type {
  AddLabelsInput,
  IssueFilters,
  LabelsResult,
  ListIssuesResult,
  RemoveLabelInput,
  UpdateIssueInput,
  UpdateIssueResult,
} from "./models.js";

export type GitHubFailure = GitHubApiError | GitHubRateLimitError | TimeoutError;

export interface GitHubIssueReader {
  readonly listIssues: (
    filters: IssueFilters,
  ) => Effect.Effect<ListIssuesResult, GitHubFailure>;
}

export interface GitHubIssueWriter {
  readonly updateIssue: (
    input: UpdateIssueInput,
  ) => Effect.Effect<UpdateIssueResult, GitHubFailure>;
  readonly addLabels: (input: AddLabelsInput) => Effect.Effect<LabelsResult, GitHubFailure>;
  readonly removeLabel: (
    input: RemoveLabelInput,
  ) => Effect.Effect<LabelsResult, GitHubFailure>;
}
