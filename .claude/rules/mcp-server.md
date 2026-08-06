# MCP Server Rules

Rules for building Model Context Protocol (MCP) servers using Express + Effect-TS.

## Overview

MCP servers expose platform-specific tools to Claude via HTTP. This project follows a consistent architecture across all MCP servers (dapr-mcp, ga4-mcp, github-issues-mcp, shopify-mcp, meta-mcp).

**See also:** [Effect-TS Rules](./effect-typescript.md) for core Effect patterns.

## Architecture

### Directory Structure

**The logic lives in a package; the server is a container.** See CLAUDE.md, "Where code
lives". A server that holds its own platform client cannot be reused by a worker, a second
server, or a test without dragging an HTTP process along.

```
packages/js/{name}-core/          the reusable machinery
├── src/
│   ├── domain/
│   │   ├── models.ts             shapes (plain types, or Schema for API responses)
│   │   ├── errors.ts             Data.TaggedError per failure mode
│   │   └── ports.ts              the interface callers depend on
│   ├── infrastructure/
│   │   └── {name}.client.ts      Effect.Service over the vendor SDK + its Config
│   └── index.ts
└── package.json                  lint: depcruise --config ../../../.dependency-cruiser.cjs src

apps/{name}-mcp/                  the container
├── src/
│   ├── index.ts                  composition root: config → runtime → register → listen
│   ├── config.ts                 ServerConfig only (port, logLevel)
│   ├── runtime.ts                the app's ToolRunner type alias
│   └── presentation/tools/
│       └── {tool-name}.ts        zod schema + tool effect + registration
├── .env.template
└── README.md
```

Boundaries are machine-checked by `.dependency-cruiser.cjs`, and `scripts/check-hex-lint.mjs`
fails any package with these layers whose `lint` script does not run depcruise.

## Schemas: zod vs Effect Schema

**Tool inputs are zod. Everything else is Effect Schema or a plain type.**

This is not a preference — the MCP SDK's `registerTool` accepts only a zod raw shape or a
zod type (`AnySchema = z3.ZodTypeAny | z4.$ZodType`). There is no JSON Schema path, so an
Effect Schema cannot describe a tool's input to the protocol.

zod is therefore a property of the **inbound adapter**, and lives only in
`apps/*/src/presentation/tools/`. It must not appear in a `domain/` or `infrastructure/`
module.

The rule this replaces ("never use zod") was unachievable, and the workaround was worse than
either option: every analytics server declared its tool input **twice** — once in zod for
the SDK, once in Effect Schema in `types.ts` — and the Effect copy was dead code that no
longer matched. One shape, one declaration.

Use Effect `Schema` where runtime validation genuinely earns its keep: decoding a vendor
API's response, or reading a config file off disk.

## The shared runtime

Build the service layer **once**, at the composition root:

```typescript
const runtime = createServerRuntime(MyService.Default);   // from mcp-core
registerMyTool(server, runtime.run);                       // pass `run` to each tool
```

and have each tool take it:

```typescript
export function registerMyTool(server: McpServer, run: ToolRunner): void {
  server.registerTool("my_tool", { ...config }, (args) => run(myToolEffect(args)));
}
```

Never `Effect.runPromise(effect.pipe(Effect.provide(Service.Default)))` inside a handler:
`runPromise` creates a fresh runtime and `provide` builds the layer as part of executing it,
so **every request constructs a new platform client**, discarding connection pools and
re-running auth. `createServerRuntime` also gives the process a real shutdown path via
`dispose()`.

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

The composition root uses `serveMcp` — **not** `createMcpApp` directly. `serveMcp` picks the
transport, so one binary serves Claude Desktop (stdio, which Desktop spawns itself) and
Claude Code (http) with no code difference.

```typescript
// src/index.ts — the composition root. No business logic lives here.
import "dotenv/config";
import { Effect } from "effect";
import {
  createServerRuntime, log, McpServer, serveMcp, setLogLevel, type LogLevel,
} from "mcp-core";
import { MyClient } from "my-core";
import { ServerConfig } from "./config.js";
import { registerMyTool } from "./presentation/tools/my-tool.js";
import { INSTRUCTIONS, registerPrompts } from "./presentation/steering.js";

const SERVER_NAME = "my-mcp";
const SERVER_VERSION = "0.1.0";

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  setLogLevel(config.logLevel as LogLevel);

  // Built ONCE — every tool call runs against this runtime.
  const runtime = createServerRuntime(MyClient.Default);

  const { transport, stop } = yield* Effect.promise(() =>
    serveMcp(
      { name: SERVER_NAME, version: SERVER_VERSION, port: config.port, endpoint: "/mcp" },
      () => {
        const server = new McpServer(
          { name: SERVER_NAME, version: SERVER_VERSION },
          { instructions: INSTRUCTIONS },   // steering that reaches EVERY client
        );
        registerMyTool(server, runtime.run);
        registerPrompts(server);
        return server;
      },
    ),
  );

  const shutdown = (signal: string) => {
    log("info", `${signal} received, shutting down`);
    void stop().then(() => runtime.dispose()).then(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  log("debug", `${SERVER_NAME} serving over ${transport}`);
}).pipe(
  Effect.tapError((error) => Effect.sync(() => log("error", "Failed to start", error))),
);

Effect.runPromise(main).catch(() => process.exit(1));
```

**Key points:**
- `serveMcp`, not `createMcpApp` — the latter is HTTP-only and is what `serveMcp` calls.
- The runtime is built once, outside the server factory.
- `instructions` is not optional garnish: it is the only steering guaranteed to reach a
  client, so it carries the rules that prevent a wrong answer.
- **Never `console.log`.** Under stdio, stdout is the JSON-RPC channel; `log()` writes to
  stderr for exactly this reason.

### 5. Steering: instructions and prompts

Every server ships `src/presentation/steering.ts`:

```typescript
import { buildInstructions } from "analytics-core";   // or write the text directly
import { z, type McpServer } from "mcp-core";

export const INSTRUCTIONS = buildInstructions(
  `What this server covers — and, just as important, what it does not, so the model does
not try to answer a question this data cannot support.`,
  [`Any server-specific rule: units, required parameters, terminal errors.`],
);

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "my_review",
    { title: "…", description: "…", argsSchema: { period: z.string().optional() } },
    ({ period }) => ({ messages: [{ role: "user" as const, content: { type: "text" as const,
      text: `A COMPLETE request, not a fragment — say what to fetch, what to compare it
against, and what shape the answer should take.` } }] }),
  );
}
```

Keep `INSTRUCTIONS` short: it is sent on every connect and competes for context. Long-form
workflow guidance belongs in a skill.

### 6. Service Pattern

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

### 7. Configuration

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

### 8. Error Handling

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

### 9. Logging

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

### 10. Schema Conventions

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

### 11. Resilience Patterns

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
- ❌ Use zod anywhere except `presentation/` (see "Schemas: zod vs Effect Schema")
- ❌ Call `Effect.runPromise(... Effect.provide(Service.Default))` in a tool handler — that
  rebuilds the service on every single request. Use the shared runtime.
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

Session management is handled by mcp-core (`createMcpApp`, which `serveMcp` calls for the http transport). You don't need to implement session logic in individual MCP servers.

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

- `apps/dapr-mcp/` - Multi-tool caching server
- `apps/ga4-mcp/` - Single-tool analytics server
- `apps/github-issues-mcp/` - GitHub integration

These are canonical examples - follow their patterns.
