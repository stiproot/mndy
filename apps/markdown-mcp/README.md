# Markdown MCP Server

MCP server for markdown file generation and validation.

## Overview

This MCP server provides markdown generation, template-based creation, format conversion, and validation tools for Claude. It enables automated markdown document creation from structured data.

## Features

- **Generate from structured data**: Create markdown files from sections, lists, and tables
- **Template-based generation**: Use predefined templates for consistent document formatting
- **Format conversion**: Convert JSON, YAML, CSV to markdown
- **Syntax validation**: Validate markdown syntax and formatting

## Setup

1. Install dependencies:

```bash
bun install
```

2. Configure environment:

```bash
cp .env.template .env
# Edit .env if you need to customize settings
```

3. Start the server:

```bash
# Development
bun run dev

# Production
bun run build
bun start
```

The server will be available at `http://localhost:3008`.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3008 |
| LOG_LEVEL | Logging level (debug/info/warn/error) | info |
| TEMPLATES_DIR | Directory for markdown templates | ./templates |
| OUTPUT_DIR | Directory for generated markdown files | ./output |
| MAX_FILE_SIZE | Maximum file size in bytes | 1048576 (1MB) |

## Tools

### Coming Soon

Use the `@mcp-tool` skill to generate these tools:

- `markdown_generate_file` - Generate markdown from structured data (title, sections, lists, tables)
- `markdown_from_template` - Generate markdown from predefined templates
- `markdown_convert_json` - Convert JSON data to formatted markdown
- `markdown_convert_csv` - Convert CSV data to markdown tables
- `markdown_validate` - Validate markdown syntax and report errors

## Service Methods

The `MarkdownService` provides:

- `generateFromSections(title, sections)` - Create markdown from section objects
- `generateList(list)` - Generate ordered or unordered lists
- `generateTable(table)` - Generate markdown tables with alignment
- `convertJsonToMarkdown(json)` - Convert JSON to markdown code blocks
- `validateMarkdown(content)` - Validate markdown syntax and structure

## Development

### Adding a New Tool

1. Use the `@mcp-tool` skill to generate the tool:

```bash
claude @mcp-tool "Create markdown_generate_file tool"
```

2. The tool will be automatically added to `src/tools/`
3. Export from `src/tools/index.ts`
4. Register in `registerTools()` function

### Adding Service Methods

1. Edit `src/services/markdown.service.ts`
2. Add new methods to the service return object
3. Use Effect patterns for error handling
4. Add corresponding error types to `src/types.ts` if needed

## Architecture

This server follows the standard MCP server architecture:

- `src/index.ts` - Server bootstrap with Effect.gen
- `src/types.ts` - Configuration, errors, and schemas
- `src/services/markdown.service.ts` - Business logic as Effect.Service
- `src/tools/` - MCP tool definitions and registration

See `.claude/rules/mcp-server.md` for architectural patterns and best practices.

## Error Handling

The service defines these tagged errors:

- `MarkdownGenerationError` - Failed to generate markdown
- `MarkdownValidationError` - Markdown syntax validation failed
- `TemplateNotFoundError` - Requested template doesn't exist
- `ConversionError` - Format conversion failed
- `TimeoutError` - Operation timeout
- `ConfigError` - Configuration error

## Examples

### Generate Markdown from Sections

```typescript
const sections = [
  {
    heading: "Introduction",
    level: 2,
    content: "This is the introduction section."
  },
  {
    heading: "Features",
    level: 2,
    content: "Here are the key features:\n\n- Feature 1\n- Feature 2"
  }
];

const markdown = yield* markdownService.generateFromSections("My Document", sections);
```

### Generate a Table

```typescript
const table = {
  headers: ["Name", "Age", "City"],
  rows: [
    ["Alice", "30", "New York"],
    ["Bob", "25", "London"]
  ],
  alignment: ["left", "center", "right"]
};

const markdown = yield* markdownService.generateTable(table);
```

## Related

- [mcp-core](../mcp-core/README.md) - Shared MCP server library
- [MCP Specification](https://modelcontextprotocol.io/)
- [Effect-TS](https://effect.website/) - Effect-based architecture

## License

MIT
