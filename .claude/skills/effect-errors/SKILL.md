---
name: effect-errors
description: Generate tagged error types for Effect-TS. Auto-invoked when defining error types.
---

# Effect Error Generator

Generate tagged error types for: `$ARGUMENTS`

## Error Type Template

For each error type requested, generate:

```typescript
import { Data } from "effect";

// Base error with common fields
export class BaseError extends Data.TaggedError("BaseError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Domain-specific errors
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
  readonly id: string;
}> {
  get message() {
    return `${this.resource} with id '${this.id}' not found`;
  }
}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly reason: string;
  readonly value?: unknown;
}> {
  get message() {
    return `Validation failed for '${this.field}': ${this.reason}`;
  }
}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {
  get message() {
    return `Database operation '${this.operation}' failed`;
  }
}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly endpoint: string;
  readonly statusCode?: number;
  readonly cause: unknown;
}> {
  get message() {
    return `Network request to '${this.endpoint}' failed${this.statusCode ? ` with status ${this.statusCode}` : ""}`;
  }
}

export class AuthenticationError extends Data.TaggedError("AuthenticationError")<{
  readonly reason: string;
}> {
  get message() {
    return `Authentication failed: ${this.reason}`;
  }
}

export class AuthorizationError extends Data.TaggedError("AuthorizationError")<{
  readonly resource: string;
  readonly action: string;
  readonly userId?: string;
}> {
  get message() {
    return `User not authorized to ${this.action} on ${this.resource}`;
  }
}

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly key: string;
  readonly reason: string;
}> {
  get message() {
    return `Configuration error for '${this.key}': ${this.reason}`;
  }
}
```

## Usage Patterns

### Creating Errors

```typescript
// Fail with specific error
return yield* Effect.fail(new NotFoundError({ resource: "User", id: "123" }));

// Map external errors
Effect.tryPromise({
  try: () => fetch(url),
  catch: (e) => new NetworkError({ endpoint: url, cause: e }),
});
```

### Handling Errors

```typescript
// Handle specific error type
program.pipe(
  Effect.catchTag("NotFoundError", (e) =>
    Effect.succeed({ found: false, id: e.id })
  )
);

// Handle multiple error types
program.pipe(
  Effect.catchTags({
    NotFoundError: (e) => Effect.succeed(null),
    ValidationError: (e) => Effect.fail(new ApiError({ field: e.field })),
    DatabaseError: (e) => Effect.retry(program, retryPolicy),
  })
);
```

### Error Union Types

```typescript
// Explicit error union in function signature
const findUser = (id: string): Effect.Effect<
  User,
  NotFoundError | DatabaseError
> => Effect.gen(function* () {
  // ...
});
```

## Best Practices

1. **Include context** - Add relevant data to help debug
2. **Computed message** - Use getter for dynamic message
3. **Type-safe handling** - Use catchTag for compile-time safety
4. **Don't over-granularize** - Group related errors
5. **Document error scenarios** - Comment when each error occurs

## Reference

See `docs/guides/effect-ts.standards.md` section "Error Handling Patterns".
