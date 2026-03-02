import { Config, Data, Schema } from "effect";

// =============================================================================
// Tagged Errors
// =============================================================================

/**
 * Error when GitHub API request fails
 */
export class GitHubApiError extends Data.TaggedError("GitHubApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly cause?: unknown;
}> {}

/**
 * Error when GitHub rate limit is exceeded
 */
export class GitHubRateLimitError extends Data.TaggedError("GitHubRateLimitError")<{
  readonly message: string;
  readonly resetAt?: Date;
  readonly retryAfter?: number;
}> {}

/**
 * Error when request times out
 */
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly duration: string;
}> {}

/**
 * Error when configuration is invalid or missing
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

// =============================================================================
// Configuration
// =============================================================================

/**
 * GitHub configuration from environment
 */
export const GitHubConfig = Config.all({
  token: Config.string("GITHUB_TOKEN").pipe(Config.withDefault("")),
});

/**
 * Server configuration from environment
 */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3001)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

// =============================================================================
// Schemas
// =============================================================================

/**
 * Schema for issue state
 */
export const IssueStateSchema = Schema.Literal("open", "closed", "all");
export type IssueState = Schema.Schema.Type<typeof IssueStateSchema>;

/**
 * Schema for sort options
 */
export const IssueSortSchema = Schema.Literal("created", "updated", "comments");
export type IssueSort = Schema.Schema.Type<typeof IssueSortSchema>;

/**
 * Schema for sort direction
 */
export const SortDirectionSchema = Schema.Literal("asc", "desc");
export type SortDirection = Schema.Schema.Type<typeof SortDirectionSchema>;

/**
 * Schema for issue filters input
 */
export const IssueFiltersSchema = Schema.Struct({
  owner: Schema.String.annotations({ description: "Repository owner (username or organization)" }),
  repo: Schema.String.annotations({ description: "Repository name" }),
  state: Schema.optional(IssueStateSchema).annotations({ description: "Filter by issue state" }),
  labels: Schema.optional(Schema.String).annotations({ description: "Comma-separated list of label names to filter by" }),
  assignee: Schema.optional(Schema.String).annotations({ description: 'Filter by assignee username, "none" for unassigned, "*" for any' }),
  creator: Schema.optional(Schema.String).annotations({ description: "Filter by issue creator username" }),
  mentioned: Schema.optional(Schema.String).annotations({ description: "Filter by username mentioned in the issue" }),
  milestone: Schema.optional(Schema.String).annotations({ description: 'Filter by milestone number, "none", or "*" for any' }),
  since: Schema.optional(Schema.String).annotations({ description: "Only issues updated after this ISO 8601 timestamp" }),
  sort: Schema.optional(IssueSortSchema).annotations({ description: "Sort field" }),
  direction: Schema.optional(SortDirectionSchema).annotations({ description: "Sort direction" }),
  per_page: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(100))).annotations({ description: "Results per page (max 100)" }),
  page: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(1))).annotations({ description: "Page number" }),
});

export type IssueFilters = Schema.Schema.Type<typeof IssueFiltersSchema>;

/**
 * Schema for label information
 */
export const IssueLabelSchema = Schema.Struct({
  name: Schema.String,
  color: Schema.String,
});

export type IssueLabel = Schema.Schema.Type<typeof IssueLabelSchema>;

/**
 * Schema for user information
 */
export const IssueUserSchema = Schema.Struct({
  login: Schema.String,
  avatar_url: Schema.String,
});

export type IssueUser = Schema.Schema.Type<typeof IssueUserSchema>;

/**
 * Schema for milestone information
 */
export const MilestoneSchema = Schema.Struct({
  number: Schema.Number,
  title: Schema.String,
});

export type Milestone = Schema.Schema.Type<typeof MilestoneSchema>;

/**
 * Schema for a single issue
 */
export const IssueSchema = Schema.Struct({
  number: Schema.Number,
  title: Schema.String,
  state: Schema.Literal("open", "closed"),
  labels: Schema.Array(IssueLabelSchema),
  assignee: Schema.NullOr(IssueUserSchema),
  assignees: Schema.Array(IssueUserSchema),
  user: IssueUserSchema,
  created_at: Schema.String,
  updated_at: Schema.String,
  closed_at: Schema.NullOr(Schema.String),
  body: Schema.NullOr(Schema.String),
  html_url: Schema.String,
  comments: Schema.Number,
  milestone: Schema.NullOr(MilestoneSchema),
});

export type Issue = Schema.Schema.Type<typeof IssueSchema>;

/**
 * Schema for list issues result
 */
export const ListIssuesResultSchema = Schema.Struct({
  issues: Schema.Array(IssueSchema),
  total_count: Schema.Number,
  page: Schema.Number,
  per_page: Schema.Number,
});

export type ListIssuesResult = Schema.Schema.Type<typeof ListIssuesResultSchema>;
