/**
 * Filter options for listing GitHub issues
 */
export interface IssueFilters {
  /** Repository owner (required) */
  owner: string;
  /** Repository name (required) */
  repo: string;
  /** Filter by state */
  state?: "open" | "closed" | "all";
  /** Comma-separated list of label names */
  labels?: string;
  /** Filter by assignee username, "none", or "*" for any */
  assignee?: string;
  /** Filter by creator username */
  creator?: string;
  /** Filter by mentioned username */
  mentioned?: string;
  /** Filter by milestone number, "none", or "*" for any */
  milestone?: string;
  /** Only issues updated after this ISO 8601 timestamp */
  since?: string;
  /** Sort field */
  sort?: "created" | "updated" | "comments";
  /** Sort direction */
  direction?: "asc" | "desc";
  /** Results per page (max 100) */
  per_page?: number;
  /** Page number */
  page?: number;
}

/**
 * Label information
 */
export interface IssueLabel {
  name: string;
  color: string;
}

/**
 * User information
 */
export interface IssueUser {
  login: string;
  avatar_url: string;
}

/**
 * Simplified issue response
 */
export interface Issue {
  number: number;
  title: string;
  state: "open" | "closed";
  labels: IssueLabel[];
  assignee: IssueUser | null;
  assignees: IssueUser[];
  user: IssueUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body: string | null;
  html_url: string;
  comments: number;
  milestone: {
    number: number;
    title: string;
  } | null;
}

/**
 * Result from listing issues
 */
export interface ListIssuesResult {
  issues: Issue[];
  total_count: number;
  page: number;
  per_page: number;
}
