---
name: github-issues
description: Use the mndy GitHub Issues MCP server (mndy-github-issues) to list, filter, update, and label GitHub issues. Use when the user wants to read, triage, edit, or label issues on a GitHub repository through the mndy stack.
---

# GitHub Issues MCP (`mndy-github-issues`)

Tools for reading and editing GitHub issues. Server runs on **port 3009**
(`http://localhost:3009/mcp`).

## Prerequisites

- Start the server from the mndy repo root: `make run-github-issues-mcp`
- Config in `apps/github-issues-mcp/.env` (copy from `.env.template`):
  - `GITHUB_TOKEN` — GitHub PAT. Optional for public repos; needs `repo` scope for private
    repos and for any write (update/label) operations.
- Verify: `curl -s http://localhost:3009/health`

## Tools

### `github_list_issues` — list/filter issues

Required: `owner` (string), `repo` (string). Optional filters:

| Param | Type | Notes |
|---|---|---|
| state | `open`\|`closed`\|`all` | issue state |
| labels | string | comma-separated label names |
| assignee | string | username, `none` (unassigned), or `*` (any) |
| creator | string | issue creator username |
| mentioned | string | username mentioned in the issue |
| milestone | string | milestone number, `none`, or `*` |
| since | string | ISO 8601 timestamp; only issues updated after |
| sort | `created`\|`updated`\|`comments` | sort field |
| direction | `asc`\|`desc` | sort direction |
| per_page | number | 1–100 |
| page | number | ≥1 |

### `github_update_issue` — edit an issue

Required: `owner`, `repo`, `issue_number` (number). Optional (only send what you change):
`title` (string), `body` (string), `state` (`open`\|`closed`), `labels` (string[] — **replaces
all** labels), `assignees` (string[] — **replaces all**), `milestone` (number, or `null` to clear).

### `github_add_labels` — add labels (keeps existing)

Required: `owner`, `repo`, `issue_number`, `labels` (string[]).

### `github_remove_label` — remove one label

Required: `owner`, `repo`, `issue_number`, `label` (string).

## Examples

List open bugs:

```json
{ "owner": "acme", "repo": "web", "state": "open", "labels": "bug", "sort": "updated", "direction": "desc" }
```

Close an issue and set its labels (replaces all existing labels):

```json
{ "owner": "acme", "repo": "web", "issue_number": 42, "state": "closed", "labels": ["wontfix"] }
```

Add labels without disturbing existing ones:

```json
{ "owner": "acme", "repo": "web", "issue_number": 42, "labels": ["needs-triage", "p2"] }
```

## Tips

- `github_update_issue`'s `labels`/`assignees` **replace** the full set. To add without
  losing existing labels, use `github_add_labels` instead.
- Writes (update, add/remove label) require a `GITHUB_TOKEN` with write access; a missing
  or read-only token returns an API error.
