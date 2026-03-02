# GitHub Issues MCP Server

MCP server providing tools for GitHub issue operations via the Model Context Protocol.

## Features

- List issues with filters (state, labels, assignee, creator, milestone)
- Update issues (title, body, state, labels, assignees, milestone)
- Add and remove labels from issues
- Resilient API calls with timeout, retry, and rate limit handling

## Quick Start

### Prerequisites

- Node.js 20+
- bun (package manager)
- GitHub Personal Access Token (optional, for private repos)

### Installation

From the repository root:

```bash
make install-node
```

### Running

```bash
make run-github-issues-mcp
```

The server starts on port 3001 by default.

## Configuration

Copy `.env.template` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub PAT (repo scope for private repos) | none |
| `PORT` | Server port | `3001` |
| `LOG_LEVEL` | Log verbosity (debug, info, warning, error) | `info` |

## Tools Reference

| Tool | Description |
|------|-------------|
| `github_list_issues` | List issues with filters (state, labels, assignee, creator, milestone, sort) |
| `github_update_issue` | Update an issue's title, body, state, labels, assignees, or milestone |
| `github_add_labels` | Add one or more labels to an issue (keeps existing labels) |
| `github_remove_label` | Remove a specific label from an issue |

### Tool Examples

**List open bugs:**

```json
{
  "owner": "anthropics",
  "repo": "claude-code",
  "state": "open",
  "labels": "bug"
}
```

**Update issue labels:**

```json
{
  "owner": "anthropics",
  "repo": "claude-code",
  "issue_number": 123,
  "labels": ["bug", "priority-high"]
}
```

## Architecture

```
src/
├── index.ts           # Server entry point
├── types.ts           # Schemas, errors, config
├── services/
│   └── github.ts      # GitHubClient Effect service
└── tools/
    ├── issues.ts      # github_list_issues tool
    ├── update-issue.ts # github_update_issue tool
    └── labels.ts      # github_add_labels, github_remove_label tools
```

**Key patterns:**

- Effect-TS for typed errors and dependency injection
- Effect.Service pattern for GitHubClient
- Resilience: 30s timeout, exponential backoff retry, rate limit handling

## Development

### Build

```bash
make build-mcp
```

### Test

```bash
make test-mcp
```

### Lint

```bash
bun run --cwd src/github-issues-mcp lint
```

## Troubleshooting

**"GITHUB_TOKEN not set"**

- Public repos work without a token
- For private repos, create a PAT with `repo` scope

**Rate limit exceeded**

- The server handles rate limits with automatic retry
- For heavy usage, use a token with higher limits

**Connection refused on port 3001**

- Check if another service is using the port
- Set a different `PORT` in `.env`
