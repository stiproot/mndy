---
name: effect-migrate-handler
description: Migrate an Express/async handler to Effect-TS patterns. Auto-invoked when migrating handlers.
---

# Effect Handler Migration

Migrate the handler at `$ARGUMENTS` from Express/async patterns to Effect-TS.

## Migration Steps

### 1. Analyze Current Implementation

Read the handler file and identify:

- Dependencies (DaprClient, HTTP clients, etc.) - these become Services
- Error scenarios - each becomes a TaggedError
- Async operations - wrap with Effect.promise or Effect.tryPromise
- Try-catch blocks - convert to catchTag/catchTags

### 2. Create Tagged Errors

For each error scenario, create a tagged error:

```typescript
class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause: unknown;
  readonly operation: string;
}> {}

class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly id: string;
  readonly resource: string;
}> {}
```

### 3. Create Service Definitions

Convert module-level singletons to Services:

```typescript
export class StateManager extends Effect.Service<StateManager>()("StateManager", {
  effect: Effect.gen(function* () {
    const config = yield* Config;
    const client = new DaprClient({ /* config */ });

    return {
      getState: (key: string) =>
        Effect.tryPromise({
          try: () => client.state.get(storeName, key),
          catch: (e) => new DatabaseError({ cause: e, operation: "getState" }),
        }),
    };
  }),
  dependencies: [Config.Default],
}) {}
```

### 4. Convert Handler to Effect

```typescript
// Before
export const processQuery = async (req: Request, res: Response) => {
  try {
    const data = await queryState(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};

// After
export const processQuery = (req: Request) =>
  Effect.gen(function* () {
    const stateManager = yield* StateManager;
    const validated = yield* Schema.decode(QuerySchema)(req.body);
    const data = yield* stateManager.queryState(validated);
    return data;
  }).pipe(
    Effect.catchTag("NotFoundError", () => Effect.succeed({ items: [] })),
    Effect.mapError((e) => new ApiError({ cause: e, endpoint: "/query" }))
  );
```

### 5. Update Route Registration

Wrap Effect handlers for Express compatibility:

```typescript
app.post("/query", async (req, res) => {
  const result = await Effect.runPromise(
    processQuery(req).pipe(Effect.provide(AppLive))
  );
  res.json(result);
});
```

### 6. Verify

- Run type check: `make lint-node`
- Ensure no `any` types in handler signatures
- Verify all errors are tagged and handled

## Reference

See `docs/guides/effect-ts.standards.md` for comprehensive patterns.
