# README Standards

Standards for service-level documentation in monorepo projects.

## Purpose

Each service should have its own README that serves as the "front door" for anyone engaging with that service. This approach:

- Keeps documentation close to the code it describes
- Enables distributed ownership (teams maintain their own docs)
- Reduces root README bloat while maintaining discoverability
- Ensures services are self-documenting and portable

## Service README Template

All services **must** include the following sections:

### Required Sections

```markdown
# Service Name

One-line description of what this service does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Quick Start

### Prerequisites

- Runtime/tooling requirements
- External dependencies

### Installation

Steps to install dependencies.

### Running

Commands to start the service.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VAR_NAME` | What it controls | `default` |

## API Reference

Document endpoints, tools, or interfaces exposed by the service.

For MCP servers, use a tools table:

| Tool | Description |
|------|-------------|
| `tool_name` | What it does |

## Architecture

Brief overview of service structure:

- `src/` - Source code
- `src/services/` - Business logic
- Key files and their purposes

## Development

### Build

Commands to build the service.

### Test

Commands to run tests.

### Lint

Commands to lint code.

## Troubleshooting

Common issues and solutions.
```

## Root README Pattern

The root README should:

1. **List all services** with one-line descriptions
2. **Link to service READMEs** for details
3. **Keep high-level commands** (make targets)
4. **Remove detailed documentation** that belongs in service READMEs

Example pattern:

```markdown
## Services

- `src/service-a/` - Description. [Details](src/service-a/README.md)
- `src/service-b/` - Description. [Details](src/service-b/README.md)
```

## Guidelines

1. **Keep it scannable** - Use tables, bullet points, and code blocks
2. **Update with code** - Documentation should change when functionality changes
3. **Be self-contained** - Reader shouldn't need to look elsewhere for basics
4. **Avoid duplication** - Don't repeat root README content
5. **Include examples** - Show actual commands and configurations
