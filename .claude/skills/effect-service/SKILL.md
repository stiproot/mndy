---
name: effect-service
description: Generate Effect-TS service boilerplate. Auto-invoked when creating new services.
---

# Effect Service Generator

Generate an Effect-TS service for `$ARGUMENTS`.

## Service Template

Create the service file with this structure:

```typescript
import { Effect, Data, Layer, Context } from "effect";

// 1. Define service-specific errors
export class ${NAME}Error extends Data.TaggedError("${NAME}Error")<{
  readonly cause: unknown;
  readonly operation: string;
}> {}

export class ${NAME}NotFoundError extends Data.TaggedError("${NAME}NotFoundError")<{
  readonly id: string;
}> {}

// 2. Define service interface
export interface ${NAME}Service {
  readonly findById: (id: string) => Effect.Effect<${TYPE}, ${NAME}NotFoundError>;
  readonly create: (data: Create${NAME}Input) => Effect.Effect<${TYPE}, ${NAME}Error>;
  readonly update: (id: string, data: Update${NAME}Input) => Effect.Effect<${TYPE}, ${NAME}Error | ${NAME}NotFoundError>;
  readonly delete: (id: string) => Effect.Effect<void, ${NAME}NotFoundError>;
}

// 3. Create service tag
export class ${NAME} extends Effect.Service<${NAME}Service>()("${NAME}", {
  // Use 'effect' for services with dependencies
  effect: Effect.gen(function* () {
    // Yield dependencies
    const config = yield* Config;
    const logger = yield* Logger;

    // Initialize any clients/connections
    const client = new ExternalClient(config.apiKey);

    return {
      findById: (id: string) =>
        Effect.gen(function* () {
          yield* logger.debug(`Finding ${NAME} by id: ${id}`);
          const result = yield* Effect.tryPromise({
            try: () => client.get(id),
            catch: (e) => new ${NAME}Error({ cause: e, operation: "findById" }),
          });

          if (!result) {
            return yield* Effect.fail(new ${NAME}NotFoundError({ id }));
          }

          return result;
        }),

      create: (data: Create${NAME}Input) =>
        Effect.gen(function* () {
          yield* logger.info(`Creating ${NAME}`);
          return yield* Effect.tryPromise({
            try: () => client.create(data),
            catch: (e) => new ${NAME}Error({ cause: e, operation: "create" }),
          });
        }),

      update: (id: string, data: Update${NAME}Input) =>
        Effect.gen(function* () {
          // First check if exists
          yield* Effect.tryPromise({
            try: () => client.get(id),
            catch: () => new ${NAME}NotFoundError({ id }),
          });

          return yield* Effect.tryPromise({
            try: () => client.update(id, data),
            catch: (e) => new ${NAME}Error({ cause: e, operation: "update" }),
          });
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => client.delete(id),
            catch: () => new ${NAME}NotFoundError({ id }),
          });
        }),
    };
  }),

  // Declare dependencies
  dependencies: [Config.Default, Logger.Default],
}) {}

// 4. Export default layer for composition
export const ${NAME}Live = ${NAME}.Default;
```

## Usage Example

```typescript
// In a handler or other service
const program = Effect.gen(function* () {
  const service = yield* ${NAME};
  const item = yield* service.findById("123");
  return item;
});

// Provide the layer
const result = await Effect.runPromise(
  program.pipe(Effect.provide(${NAME}Live))
);
```

## Checklist

- [ ] Service has tagged errors for all failure modes
- [ ] All async operations wrapped with Effect.tryPromise
- [ ] Dependencies declared in `dependencies` array
- [ ] No module-level singletons
- [ ] Logging integrated via Logger service

## Reference

See `docs/guides/effect-ts.standards.md` section "Dependency Injection & Services".
