# MCP Server Rules

Rules for building Model Context Protocol (MCP) servers using Express + Effect-TS.

## Overview

MCP servers expose platform-specific tools to Claude via HTTP. This project follows a consistent architecture across all MCP servers (dapr-mcp, ga4-mcp, github-issues-mcp, shopify-mcp, meta-mcp).

**See also:** [Effect-TS Rules](./effect-typescript.md) for core Effect patterns.

## Architecture

### Directory Structure

```
src/{name}-mcp/
├── src/
│   ├── index.ts                 # Effect.gen bootstrap, server setup
│   ├── types.ts                 # Errors, Config, Schemas
│   ├── services/
│   │   └── {name}.service.ts    # Effect.Service with dependencies
│   └── tools/
│       ├── {tool-name}.ts       # Tool effect + registration
│       └── index.ts             # Re-exports all tools
├── package.json
├── tsconfig.json
├── .env.template
└── README.md
```

## Core Patterns

### 1. Tool Structure

Each MCP tool follows this pattern:

```typescript
// src/tools/submit-data.ts
import { Effect, Schema } from "effect";
import { McpServer, createLogger } from "mcp-core";
import type { ToolResult } from "mcp-core";

const logger = createLogger("submit-data");

// 1. Schema (Effect Schema with annotations)
export const SubmitDataInputSchema = Schema.Struct({
  key: Schema.String.annotations({
    description: "The cache key for storage"
  }),
  data: Schema.Struct({
    field1: Schema.String.annotations({ description: "..." }),
    field2: Schema.Number.annotations({ description: "..." }),
  }).annotations({ description: "The data to submit" }),
});

// 2. Type (derived from schema)
export type SubmitDataInput = Schema.Schema.Type<typeof SubmitDataInputSchema>;

// 3. Effect (business logic)
const submitDataEffect = (input: SubmitDataInput) =>
  Effect.gen(function* () {
    const service = yield* MyService;

    logger.debug("Submitting data", { key: input.key });

    const result = yield* service.saveData(input.key, input.data);

    logger.info("Data submitted successfully", { key: input.key });

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }).pipe(
    Effect.catchTag("ServiceError", (error) =>
      Effect.succeed({
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true as const,
      })
    )
  );

// 4. Registration (runtime validation + effect execution)
export function registerSubmitDataTool(server: McpServer): void {
  server.registerTool(
    "submit_data",
    {
      title: "Submit Data",
      description: "Submits data to the platform",
      inputSchema: SubmitDataInputSchema,
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          // Decode and validate input
          const input = yield* Schema.decodeUnknown(SubmitDataInputSchema)(args);
          return yield* submitDataEffect(input);
        }).pipe(Effect.provide(MyService.Default))
      )
  );
}
```

### 2. Tool Naming Convention

**Format:** `{platform}_{action}_{resource}`

- Use **snake_case** (not camelCase)
- Include platform prefix (ga4, meta, shopify, dapr, etc.)
- Be descriptive and specific

**Examples:**
- `ga4_run_report`
- `meta_get_insights`
- `shopify_get_orders`
- `dapr_save_state`
- `submit_ga4_data` (dapr-mcp storing GA4 data)

### 3. ToolResult Structure

Every tool must return a `ToolResult`:

```typescript
interface ToolResult {
  content: Array<TextContent | ImageContent | ...>;
  isError?: boolean;
  structuredContent?: unknown;
}
```

**Guidelines:**
- Always include `content` array with at least one text item
- Set `isError: true` for error responses
- Use `structuredContent` for typed return data (agents can parse)
- Log errors before returning error ToolResult

### 4. Server Setup Pattern

Use `createMcpApp` from mcp-core:

```typescript
// src/index.ts
import { Effect } from "effect";
import { createMcpApp, createLogger } from "mcp-core";
import { ServerConfig } from "./types.js";
import { MyService } from "./services/my.service.js";
import * as tools from "./tools/index.js";

const logger = createLogger("my-mcp");

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;

  logger.info("Starting My MCP Server", { port: config.port });

  const mcpApp = createMcpApp(
    { name: "my-mcp", version: "1.0.0" },
    (server) => {
      tools.registerTools(server);
    }
  );

  const { start, stop } = mcpApp;

  process.on("SIGINT", () => {
    logger.info("Shutting down...");
    Effect.runPromise(stop()).then(() => process.exit(0));
  });

  yield* Effect.promise(() => start(config.port));

  logger.info("My MCP Server running", { port: config.port });
}).pipe(
  Effect.provide(MyService.Default),
  Effect.tapError((error) =>
    Effect.sync(() => logger.error("Server failed", error))
  )
);

Effect.runPromise(main).catch(() => process.exit(1));
```

**Key Points:**
- Use Effect.gen for async startup
- Provide services at top level
- Handle SIGINT for graceful shutdown
- Error handling with tapError

### 5. Service Pattern

Use Effect.Service for all business logic:

```typescript
// src/services/my.service.ts
import { Effect, Schedule } from "effect";
import { createLogger } from "mcp-core";

const logger = createLogger("my-service");

export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    const config = yield* MyConfig;

    // Client initialization (not module-level!)
    const client = new ThirdPartyClient(config.apiKey);

    return {
      fetchData: (id: string) =>
        Effect.gen(function* () {
          logger.debug("Fetching data", { id });

          const result = yield* Effect.tryPromise({
            try: () => client.get(id),
            catch: (error) => new ApiError({ cause: error }),
          }).pipe(
            Effect.timeoutFail({
              duration: "60 seconds",
              onTimeout: () => new TimeoutError({ operation: "fetchData" }),
            }),
            Effect.retry({
              schedule: Schedule.exponential("1 second").pipe(
                Schedule.jittered,
                Schedule.intersect(Schedule.recurs(3))
              ),
            }),
            Effect.withSpan("fetchData", { attributes: { id } })
          );

          logger.info("Data fetched", { id });
          return result;
        }),
    };
  }),
  dependencies: [MyConfig.Default],
}) {}
```

**Required patterns:**
- Client initialization inside effect (not module-level)
- Timeout all external calls
- Retry with exponential backoff + jitter
- Observability via withSpan
- Logging at debug/info/error levels

### 6. Configuration

Use Effect Config module (never `process.env` directly):

```typescript
// src/types.ts
import { Config } from "effect";

export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3000)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

export const MyConfig = Config.all({
  apiKey: Config.secret("MY_API_KEY"),
  endpoint: Config.string("MY_ENDPOINT"),
  timeout: Config.integer("MY_TIMEOUT").pipe(Config.withDefault(60)),
});
```

**Guidelines:**
- ServerConfig is required (port, logLevel)
- Platform-specific config separately
- Use `Config.secret` for sensitive values
- Provide sensible defaults with `.pipe(Config.withDefault(...))`

### 7. Error Handling

Define tagged errors per domain:

```typescript
// src/types.ts
import { Data } from "effect";

export class MyApiError extends Data.TaggedError("MyApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class MyQuotaError extends Data.TaggedError("MyQuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly quotaType?: string;
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
```

**In tools, catch and return ToolResult:**

```typescript
Effect.catchTag("MyApiError", (error) =>
  Effect.succeed({
    content: [{ type: "text" as const, text: `API error: ${error.message}` }],
    isError: true as const,
  })
)
```

### 8. Logging

Use `createLogger` from mcp-core:

```typescript
import { createLogger } from "mcp-core";

const logger = createLogger("module-name");

logger.debug("Detailed info", { contextObj });
logger.info("Milestone", { contextObj });
logger.error("Failure", errorObj);
```

**Guidelines:**
- One logger per file/module
- Debug for entry points and detailed flow
- Info for successful operations
- Error for failures (before returning error ToolResult)
- Always include context objects

### 9. Schema Conventions

Use Effect Schema with annotations:

```typescript
import { Schema } from "effect";

// Good: Descriptive annotations for Claude
export const DataSchema = Schema.Struct({
  dateRange: Schema.Struct({
    startDate: Schema.String.annotations({
      description: "Start date in YYYY-MM-DD format"
    }),
    endDate: Schema.String.annotations({
      description: "End date in YYYY-MM-DD format"
    }),
  }).annotations({ description: "The date range for the report" }),

  metrics: Schema.Array(Schema.String).annotations({
    description: "List of metric names to include (e.g., 'sessions', 'conversions')"
  }),
});

export type Data = Schema.Schema.Type<typeof DataSchema>;
```

**Why annotations matter:**
- Claude reads these descriptions
- Better tool selection and parameter filling
- Self-documenting code

### 10. Resilience Patterns

All external API calls must include:

**1. Timeout:**
```typescript
Effect.timeoutFail({
  duration: "60 seconds",
  onTimeout: () => new TimeoutError({ operation: "callName" }),
})
```

**2. Retry with backoff:**
```typescript
Effect.retry({
  schedule: Schedule.exponential("1 second").pipe(
    Schedule.jittered,
    Schedule.intersect(Schedule.recurs(3))
  ),
})
```

**3. Type guards for third-party errors:**
```typescript
function isQuotaError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "QUOTA_EXCEEDED"
  );
}

Effect.tryPromise({
  try: () => client.call(),
  catch: (error) =>
    isQuotaError(error)
      ? new MyQuotaError({ message: "..." })
      : new MyApiError({ cause: error }),
})
```

## Anti-Patterns

**Don't:**
- ❌ Use `process.env` directly (use Config module)
- ❌ Initialize clients at module level (use Service)
- ❌ Use raw Promises in business logic (use Effect)
- ❌ Forget timeouts on external calls
- ❌ Return errors via throw (use Effect error channel)
- ❌ Use Zod (use Effect Schema for consistency)
- ❌ Skip logging in tools
- ❌ Use camelCase for tool names (use snake_case)
- ❌ Return malformed ToolResult (missing `content` array)

## Tool Registration Pattern

All tools register in `src/tools/index.ts`:

```typescript
import { McpServer } from "mcp-core";
import { registerTool1 } from "./tool1.js";
import { registerTool2 } from "./tool2.js";

export function registerTools(server: McpServer): void {
  registerTool1(server);
  registerTool2(server);
}

export * from "./tool1.js";
export * from "./tool2.js";
```

## Session Management

Session management is handled by mcp-core's `createMcpApp`. You don't need to implement session logic in individual MCP servers.

**Endpoints provided by mcp-core:**
- `POST /` - Send message to session
- `GET /` - SSE stream for session
- `DELETE /` - Terminate session

## Testing

Integration tests should verify:
- Tool registration
- Schema validation (valid and invalid inputs)
- Error handling
- Service integration

See `tests/integration/{mcp-name}/` for examples.

## Reference Implementations

- `src/dapr-mcp/` - Multi-tool caching server
- `src/ga4-mcp/` - Single-tool analytics server
- `src/github-issues-mcp/` - GitHub integration

These are canonical examples - follow their patterns.
