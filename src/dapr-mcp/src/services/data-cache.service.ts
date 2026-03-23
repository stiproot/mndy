import { Effect, Data } from "effect";
import { DaprStateSvc } from "dapr-core";

const STORE_NAME = "statestore-analytics";
const MAX_HISTORY = 10;

// Tagged errors
export class CacheError extends Data.TaggedError("CacheError")<{
  readonly message: string;
  readonly key?: string;
  readonly cause?: unknown;
}> {}

export interface CachedData<T> {
  data: T;
  collectedAt: string;
  expiresAt?: string;
}

export class DataCacheSvc extends Effect.Service<DataCacheSvc>()("DataCacheSvc", {
  effect: Effect.gen(function* () {
    const stateSvc = yield* DaprStateSvc;

    return {
      // Save data with history tracking
      saveData: <T>(key: string, data: T, ttlSeconds?: number) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          const cachedData: CachedData<T> = {
            data,
            collectedAt: now,
            expiresAt: ttlSeconds
              ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
              : undefined,
          };

          // Get existing history
          const history = yield* stateSvc
            .getState<CachedData<T>[]>(STORE_NAME, `${key}:history`)
            .pipe(
              Effect.catchTag("DaprStateError", () => Effect.succeed([]))
            );

          // Add to history (keep last 10)
          const updatedHistory = [cachedData, ...history].slice(0, MAX_HISTORY);

          // Save both current data and history
          yield* stateSvc.saveState<unknown>(STORE_NAME, [
            {
              key: `${key}:data`,
              value: cachedData as unknown,
              metadata: ttlSeconds ? { ttlInSeconds: ttlSeconds.toString() } : undefined
            },
            {
              key: `${key}:history`,
              value: updatedHistory as unknown
            },
          ]);

          return { success: true, key, cachedAt: now };
        }).pipe(
          Effect.catchTag("DaprStateError", (err) =>
            Effect.fail(new CacheError({ message: "Failed to save data", key, cause: err }))
          ),
          Effect.withSpan("DataCacheSvc.saveData", { attributes: { key } })
        ),

      // Get cached data with TTL validation
      getData: <T>(key: string) =>
        Effect.gen(function* () {
          const cached = yield* stateSvc
            .getState<CachedData<T>>(STORE_NAME, `${key}:data`)
            .pipe(
              Effect.catchTag("DaprStateError", () => Effect.succeed(null))
            );

          if (!cached) {
            return { found: false, data: null, valid: false };
          }

          // Check if expired
          const isValid = !cached.expiresAt ||
            new Date(cached.expiresAt).getTime() > Date.now();

          return {
            found: true,
            data: cached.data,
            valid: isValid,
            metadata: {
              cachedAt: cached.collectedAt,
              expiresAt: cached.expiresAt,
            },
          };
        }).pipe(
          Effect.withSpan("DataCacheSvc.getData", { attributes: { key } })
        ),

      // Get data history
      getHistory: <T>(key: string) =>
        stateSvc
          .getState<CachedData<T>[]>(STORE_NAME, `${key}:history`)
          .pipe(
            Effect.catchTag("DaprStateError", () => Effect.succeed([])),
            Effect.withSpan("DataCacheSvc.getHistory", { attributes: { key } })
          ),

      // Delete cached data
      deleteData: (key: string) =>
        stateSvc
          .deleteState(STORE_NAME, [`${key}:data`, `${key}:history`])
          .pipe(
            Effect.catchTag("DaprStateError", (err) =>
              Effect.fail(new CacheError({ message: "Failed to delete data", key, cause: err }))
            ),
            Effect.withSpan("DataCacheSvc.deleteData", { attributes: { key } })
          ),

      // Query cache entries (powerful!)
      queryCache: (filter: { source?: string; brandId?: string }) =>
        Effect.gen(function* () {
          // Build query filter
          const queryFilter: any = {};

          // State keys are like: ga4-default-2025-03-01-2025-03-07:data
          // We can query by key prefix
          // TODO: Implement query logic based on filter

          const result = yield* stateSvc.queryState<{
            results: Array<{ key: string; data: CachedData<unknown> }>;
          }>(STORE_NAME, {
            filter: queryFilter,
            sort: [{ key: "collectedAt", order: "DESC" }],
          });

          return result.results;
        }).pipe(
          Effect.catchTag("DaprStateError", (err) =>
            Effect.fail(new CacheError({ message: "Failed to query cache", cause: err }))
          ),
          Effect.withSpan("DataCacheSvc.queryCache")
        ),
    };
  }),
  dependencies: [DaprStateSvc.Default],
}) {}
