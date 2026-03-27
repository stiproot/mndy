---
name: mcp-errors
description: Generate tagged errors for MCP server domains (API, Quota, Timeout, Config)
---

# MCP Errors Generator

Generates tagged errors specific to an MCP server domain, following Effect-TS error patterns.

## What This Generates

Error class definitions in `src/types.ts`:
1. Platform-specific API errors
2. Quota/rate limit errors
3. Timeout errors
4. Configuration errors
5. Generic domain errors

## Usage

```bash
claude @mcp-errors "Create Stripe errors: StripeApiError, StripeRateLimitError, TimeoutError, ConfigError"
```

## Template

```typescript
// src/types.ts (errors section)
import { Data } from "effect";

// Platform-specific API error
export class $PLATFORM_ApiError extends Data.TaggedError("$PLATFORM_ApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

// Quota/rate limit error
export class $PLATFORM_QuotaError extends Data.TaggedError("$PLATFORM_QuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly quotaType?: string;
}> {}

// Rate limit error (alternative naming)
export class $PLATFORM_RateLimitError extends Data.TaggedError("$PLATFORM_RateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly limit?: number;
}> {}

// Timeout error
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly duration?: number;
}> {}

// Configuration error
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
  readonly expectedType?: string;
}> {}

// Generic domain error
export class $PLATFORM_McpError extends Data.TaggedError("$PLATFORM_McpError")<{
  readonly message: string;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
}> {}
```

## Placeholders

- `$PLATFORM` - Platform/domain name (e.g., "Stripe", "GA4", "Meta", "GitHub")
- Additional fields can be added based on platform-specific needs

## Common Error Types

### 1. API Errors

For general API failures from third-party services:

```typescript
export class StripeApiError extends Data.TaggedError("StripeApiError")<{
  readonly message: string;
  readonly status?: number;      // HTTP status code
  readonly code?: string;         // Platform-specific error code
  readonly cause?: unknown;       // Original error object
}> {}
```

### 2. Quota/Rate Limit Errors

For quota exceeded or rate limiting:

```typescript
export class GA4QuotaError extends Data.TaggedError("GA4QuotaError")<{
  readonly message: string;
  readonly retryAfter?: number;  // Seconds until retry allowed
  readonly quotaType?: string;   // Type of quota exceeded
}> {}

export class MetaRateLimitError extends Data.TaggedError("MetaRateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;  // Seconds until retry allowed
  readonly limit?: number;       // Rate limit threshold
}> {}
```

### 3. Timeout Errors

For operation timeouts (generic, not platform-specific):

```typescript
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;    // Operation that timed out
  readonly duration?: number;    // Timeout duration in seconds
}> {}
```

### 4. Configuration Errors

For missing or invalid configuration (generic):

```typescript
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;        // Config field name
  readonly expectedType?: string; // Expected type/format
}> {}
```

### 5. Domain-Specific Errors

For platform-specific issues:

```typescript
export class ShopifyWebhookError extends Data.TaggedError("ShopifyWebhookError")<{
  readonly message: string;
  readonly webhookId?: string;
  readonly cause?: unknown;
}> {}

export class GitHubPermissionError extends Data.TaggedError("GitHubPermissionError")<{
  readonly message: string;
  readonly scope?: string;        // Required scope
  readonly repository?: string;   // Repository name
}> {}
```

## Example 1: Stripe MCP

**Input:**
```
Create Stripe errors: StripeApiError, StripeRateLimitError, StripeWebhookError, TimeoutError, ConfigError
```

**Output:**
```typescript
// src/types.ts
import { Data } from "effect";

export class StripeApiError extends Data.TaggedError("StripeApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class StripeRateLimitError extends Data.TaggedError("StripeRateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly limit?: number;
}> {}

export class StripeWebhookError extends Data.TaggedError("StripeWebhookError")<{
  readonly message: string;
  readonly eventId?: string;
  readonly cause?: unknown;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly duration?: number;
}> {}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
  readonly expectedType?: string;
}> {}
```

## Example 2: GA4 MCP

**Input:**
```
Create GA4 errors: GA4ApiError, GA4QuotaError, TimeoutError, ConfigError
```

**Output:**
```typescript
// src/types.ts
import { Data } from "effect";

export class GA4ApiError extends Data.TaggedError("GA4ApiError")<{
  readonly message: string;
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class GA4QuotaError extends Data.TaggedError("GA4QuotaError")<{
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
  readonly expectedType?: string;
}> {}
```

## Usage in Services

```typescript
import { Effect } from "effect";
import { GA4ApiError, GA4QuotaError, TimeoutError } from "../types.js";

// Error mapping
Effect.tryPromise({
  try: () => client.runReport(request),
  catch: (error) => {
    if (isQuotaError(error)) {
      return new GA4QuotaError({
        message: "Quota exceeded",
        quotaType: "daily",
      });
    }
    return new GA4ApiError({ cause: error });
  },
}).pipe(
  Effect.timeoutFail({
    duration: "60 seconds",
    onTimeout: () => new TimeoutError({
      operation: "runReport",
      duration: 60,
    }),
  })
);
```

## Usage in Tools

```typescript
import { Effect } from "effect";
import { GA4ApiError, TimeoutError } from "../types.js";

const toolEffect = (input: Input) =>
  Effect.gen(function* () {
    // ... tool logic
  }).pipe(
    Effect.catchTag("GA4ApiError", (error) =>
      Effect.succeed({
        content: [{ type: "text" as const, text: `GA4 API error: ${error.message}` }],
        isError: true as const,
      })
    ),
    Effect.catchTag("TimeoutError", (error) =>
      Effect.succeed({
        content: [{ type: "text" as const, text: `Timeout: ${error.operation} took too long` }],
        isError: true as const,
      })
    )
  );
```

## Guidelines

### Naming
- ✅ Use PascalCase for error class names
- ✅ Include platform prefix for platform-specific errors
- ✅ Use descriptive suffixes: `ApiError`, `QuotaError`, `RateLimitError`
- ✅ Keep generic errors generic: `TimeoutError`, `ConfigError` (no prefix)

### Fields
- ✅ Always include `readonly message: string`
- ✅ Make contextual fields optional (use `?`)
- ✅ Use `cause?: unknown` for wrapping third-party errors
- ✅ Include fields useful for retry logic (retryAfter, status)
- ✅ Include fields useful for debugging (operation, field)

### Error Hierarchy
- ✅ Create specific error types for different failure modes
- ✅ Don't create a single catch-all error
- ✅ Balance specificity with maintainability (3-6 error types typical)

### Integration
- ✅ Define type guards in services for third-party error detection
- ✅ Map third-party errors to tagged errors in services
- ✅ Catch tagged errors by tag in tools
- ✅ Include contextual information in error messages

## Common Patterns by Platform

### REST APIs (Stripe, Shopify, etc.)
- ApiError (general failures)
- RateLimitError (429 responses)
- TimeoutError (network timeouts)
- ConfigError (missing API keys)

### Analytics APIs (GA4, Meta, etc.)
- ApiError (general failures)
- QuotaError (quota exceeded)
- TimeoutError (long-running queries)
- ConfigError (missing credentials)

### Version Control (GitHub, GitLab, etc.)
- ApiError (general failures)
- RateLimitError (rate limits)
- PermissionError (insufficient scopes)
- TimeoutError (large operations)
- ConfigError (missing tokens)

## Related

- See `.claude/rules/effect-typescript.md` for error handling patterns
- See `.claude/rules/mcp-server.md` for MCP-specific error usage
- See `@effect-errors` for basic Effect error patterns
- See `@mcp-service` for using errors in services
- See `@mcp-tool` for catching errors in tools
