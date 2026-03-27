---
name: mcp-server
description: Scaffold a complete MCP server with Express + Effect-TS
---

# MCP Server Scaffolding

Generates a complete MCP server following the dapr-mcp/ga4-mcp/github-issues-mcp architecture.

## What This Generates

A fully functional MCP server in `src/{name}-mcp/`:
1. Server bootstrap (`index.ts`)
2. Type definitions (`types.ts`)
3. Service directory with initial service
4. Tools directory with tool registration
5. Configuration files (package.json, tsconfig.json, .env.template)
6. README.md

## Usage

```bash
claude @mcp-server "Create a Stripe MCP server on port 3007"
```

## Directory Structure

```
src/$NAME-mcp/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── services/
│   │   └── $NAME.service.ts
│   └── tools/
│       └── index.ts
├── package.json
├── tsconfig.json
├── .env.template
└── README.md
```

## Template: index.ts

```typescript
import "dotenv/config";
import { Effect } from "effect";
import { createMcpApp, McpServer, log, setLogLevel, type LogLevel } from "mcp-core";
import * as tools from "./tools/index.js";
import { ServerConfig } from "./types.js";
import { $SERVICE_CLASS } from "./services/$SERVICE_FILE.js";

const SERVER_NAME = "$NAME-mcp";
const SERVER_VERSION = "1.0.0";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  tools.registerTools(server);

  return server;
}

/**
 * Main application startup effect
 */
const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const service = yield* $SERVICE_CLASS;

  setLogLevel(config.logLevel as LogLevel);

  const { start } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1"],
    },
    createServer
  );

  yield* Effect.promise(() => start());
}).pipe(
  Effect.provide($SERVICE_CLASS.Default),
  Effect.tapError((error) => Effect.sync(() => log("error", "Failed to start server", error)))
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
```

## Template: types.ts

```typescript
import { Config, Data, Schema } from "effect";

// ==================== Configuration ====================

export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault($PORT)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

export const $CONFIG_CLASS = Config.all({
  $CONFIG_FIELDS
});

// ==================== Errors ====================

export class $PLATFORM_ApiError extends Data.TaggedError("$PLATFORM_ApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class $PLATFORM_RateLimitError extends Data.TaggedError("$PLATFORM_RateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly duration?: number;
}> {}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

// ==================== Schemas ====================
// Tool schemas will be added here by @mcp-tool or @mcp-schema
```

## Template: services/{name}.service.ts

```typescript
import { Effect, Schedule } from "effect";
import { createLogger } from "mcp-core";
import { $CONFIG_CLASS, $ERROR_TYPES } from "../types.js";

const logger = createLogger("$SERVICE_LOGGER");

export class $SERVICE_CLASS extends Effect.Service<$SERVICE_CLASS>()("$SERVICE_CLASS", {
  effect: Effect.gen(function* () {
    const config = yield* $CONFIG_CLASS;

    // TODO: Initialize client here
    // const client = new ThirdPartyClient(config.apiKey);

    return {
      // TODO: Add service methods here
      // Use @mcp-service skill to generate methods
    };
  }),
}) {}
```

## Template: tools/index.ts

```typescript
import { McpServer } from "mcp-core";

export function registerTools(server: McpServer): void {
  // TODO: Register tools here
  // Use @mcp-tool skill to generate tools
  // Example:
  // registerMyToolName(server);
}
```

## Template: package.json

```json
{
  "name": "$NAME-mcp",
  "version": "1.0.0",
  "description": "$DESCRIPTION",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "effect": "^3.11.9",
    "mcp-core": "workspace:*",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "eslint": "^9.17.0"
  }
}
```

## Template: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Template: .env.template

```bash
# Server Configuration
PORT=$PORT
LOG_LEVEL=info

# $PLATFORM Configuration
$ENV_VARS
```

## Template: README.md

```markdown
# $TITLE MCP Server

$DESCRIPTION

## Overview

This MCP server provides $PLATFORM integration tools for Claude.

## Setup

1. Install dependencies:
\`\`\`bash
bun install
\`\`\`

2. Configure environment:
\`\`\`bash
cp .env.template .env
# Edit .env with your $PLATFORM credentials
\`\`\`

3. Start the server:
\`\`\`bash
# Development
bun run dev

# Production
bun run build
bun start
\`\`\`

The server will be available at \`http://localhost:$PORT\`.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | $PORT |
| LOG_LEVEL | Logging level (debug/info/warn/error) | info |
$CONFIG_TABLE

## Tools

### TODO: Add tools here

Use \`@mcp-tool\` skill to generate tools.

## Development

### Adding a New Tool

1. Use the \`@mcp-tool\` skill to generate the tool
2. Export from \`src/tools/index.ts\`
3. Register in \`registerTools()\`

### Adding Service Methods

1. Use the \`@mcp-service\` skill to generate methods
2. Update \`src/services/$NAME.service.ts\`

## Architecture

See \`.claude/rules/mcp-server.md\` for architectural patterns.

## Related

- [mcp-core](../mcp-core/README.md) - Shared MCP server library
- [MCP Specification](https://modelcontextprotocol.io/)
```

## Placeholders

- `$NAME` - Kebab-case name (e.g., "stripe-mcp")
- `$PLATFORM` - PascalCase platform name (e.g., "Stripe", "GA4", "Shopify")
- `$TITLE` - Human-readable title (e.g., "Stripe", "Google Analytics 4")
- `$DESCRIPTION` - One-line description
- `$PORT` - Server port number
- `$LOGGER_NAME` - Kebab-case logger name (e.g., "stripe-mcp")
- `$SERVICE_CLASS` - PascalCase service class (e.g., "StripeService")
- `$SERVICE_FILE` - Kebab-case service file (e.g., "stripe.service")
- `$SERVICE_LOGGER` - Kebab-case service logger (e.g., "stripe-service")
- `$CONFIG_CLASS` - PascalCase config class (e.g., "StripeConfig")
- `$CONFIG_FIELDS` - Config field definitions
- `$ENV_VARS` - Environment variable names with placeholders
- `$ERROR_TYPES` - Import list of error types
- `$CONFIG_TABLE` - Markdown table rows for additional config

## Example

**Input:**
```
Create a Stripe MCP server on port 3007 with:
- API key configuration
- Webhook secret configuration
- Description: "Stripe payment processing integration"
```

**Output:**

**File: `src/stripe-mcp/src/index.ts`**
```typescript
import { Effect, Config } from "effect";
import { createMcpApp, createLogger } from "mcp-core";
import { ServerConfig } from "./types.js";
import { StripeService } from "./services/stripe.service.js";
import * as tools from "./tools/index.js";

const logger = createLogger("stripe-mcp");

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;

  logger.info("Starting Stripe MCP Server", { port: config.port });

  const mcpApp = createMcpApp(
    { name: "stripe-mcp", version: "1.0.0" },
    (server) => {
      // Register tools
      tools.registerTools(server);
    }
  );

  const { start, stop } = mcpApp;

  process.on("SIGINT", () => {
    logger.info("Shutting down...");
    Effect.runPromise(stop()).then(() => process.exit(0));
  });

  yield* Effect.promise(() => start(config.port));

  logger.info("Stripe MCP Server running", { port: config.port });
}).pipe(
  Effect.provide(StripeService.Default),
  Effect.tapError((error) =>
    Effect.sync(() => {
      logger.error("Server failed", error);
    })
  )
);

Effect.runPromise(main).catch(() => process.exit(1));
```

**File: `src/stripe-mcp/src/types.ts`**
```typescript
import { Config, Data, Schema } from "effect";

// ==================== Configuration ====================

export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3007)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

export const StripeConfig = Config.all({
  apiKey: Config.secret("STRIPE_API_KEY"),
  webhookSecret: Config.secret("STRIPE_WEBHOOK_SECRET"),
});

// ==================== Errors ====================

export class StripeApiError extends Data.TaggedError("StripeApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class StripeRateLimitError extends Data.TaggedError("StripeRateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly duration?: number;
}> {}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

// ==================== Schemas ====================
// Tool schemas will be added here
```

**File: `src/stripe-mcp/.env.template`**
```bash
# Server Configuration
PORT=3007
LOG_LEVEL=info

# Stripe Configuration
STRIPE_API_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

## After Scaffolding

1. Add to workspace if not already included
2. Use `@mcp-errors` to expand error definitions
3. Use `@mcp-service` to add service methods
4. Use `@mcp-tool` to add tools
5. Update README.md with tool documentation

## Guidelines

- ✅ Use kebab-case for directory and file names
- ✅ Use PascalCase for classes and types
- ✅ Include all necessary config in types.ts
- ✅ Provide sensible defaults (port, log level)
- ✅ Include comprehensive README
- ✅ Follow existing MCP server patterns (dapr-mcp, ga4-mcp)
- ✅ Use workspace dependencies (mcp-core)
- ✅ Include .env.template with all required variables

## Related

- See `.claude/rules/mcp-server.md` for architectural patterns
- See `@mcp-tool` for adding tools
- See `@mcp-service` for adding services
- See `@mcp-errors` for defining errors
- See `@mcp-schema` for complex schemas
