# Effect-TS TypeScript Rules

When writing or modifying TypeScript code in this project, follow these Effect-TS patterns:

## Core Principles

1. **Effects are lazy blueprints** - They do nothing until executed with `runPromise`/`runSync`
2. **Use `Effect.gen`** for multi-step business logic (not long `flatMap` chains)
3. **Use `.pipe()`** for transformations and composition
4. **Define tagged errors** with `Data.TaggedError` for type-safe error handling
5. **Model dependencies as Services** - No module-level singletons
6. **Use `Schema`** for all runtime validation

## Error Handling

```typescript
// GOOD: Tagged errors with context
class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly id: string;
}> {}

// GOOD: Handle with catchTag
effect.pipe(
  Effect.catchTag("NotFoundError", (e) => Effect.succeed(defaultValue))
);

// BAD: Generic try-catch
try {
  const result = yield* riskyOperation;
} catch (error) {
  // Bypasses Effect's error channel!
}
```

## Dependency Injection

```typescript
// GOOD: Service pattern
export class Database extends Effect.Service<Database>()("Database", {
  sync: () => ({
    findUser: (id: string) => Effect.gen(function* () { /* ... */ }),
  }),
}) {}

// BAD: Module-level singleton
const daprClient = new DaprClient({ /* ... */ });
export async function getState(key: string) { /* ... */ }
```

## Concurrency

```typescript
// GOOD: Explicit concurrency
const results = yield* Effect.all([task1, task2, task3], { concurrency: "unbounded" });

// BAD: Sequential when parallel is possible (missing concurrency option)
const results = yield* Effect.all([task1, task2, task3]);
```

## Reference

See `docs/guides/effect-ts-standards.md` for comprehensive patterns and examples.
