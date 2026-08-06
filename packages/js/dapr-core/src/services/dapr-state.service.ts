import { Effect } from "effect";
import { DaprHttpSvc } from "./dapr-http.service.js";
import { DaprStateError } from "../errors.js";

/**
 * State store metadata for TTL and other features
 */
export interface StateMetadata {
  ttlInSeconds?: string;
  [key: string]: string | undefined;
}

/**
 * State store item for save operations
 */
export interface StateItem<T = unknown> {
  key: string;
  value: T;
  metadata?: StateMetadata;
}

/**
 * Dapr State Store Service
 * Provides typed methods for interacting with Dapr state stores
 */
export class DaprStateSvc extends Effect.Service<DaprStateSvc>()("DaprStateSvc", {
  effect: Effect.gen(function* () {
    const httpSvc = yield* DaprHttpSvc;

    return {
      /**
       * Get state from a state store
       */
      getState: <T>(storeName: string, key: string) =>
        httpSvc
          .get<T>(`v1.0/state/${storeName}/${key}`)
          .pipe(
            Effect.catchAll((error) =>
              Effect.fail(
                new DaprStateError({
                  message: `Failed to get state: ${error.message}`,
                  storeName,
                  key,
                  cause: error,
                })
              )
            ),
            Effect.withSpan("DaprStateSvc.getState", {
              attributes: { storeName, key },
            })
          ),

      /**
       * Save state to a state store (batch operation)
       */
      saveState: <T>(storeName: string, items: StateItem<T>[]) =>
        httpSvc
          .post<void>(`v1.0/state/${storeName}`, items)
          .pipe(
            Effect.catchAll((error) =>
              Effect.fail(
                new DaprStateError({
                  message: `Failed to save state: ${error.message}`,
                  storeName,
                  cause: error,
                })
              )
            ),
            Effect.withSpan("DaprStateSvc.saveState", {
              attributes: { storeName, count: items.length },
            })
          ),

      /**
       * Delete state from a state store
       */
      deleteState: (storeName: string, keys: string[]) =>
        Effect.all(
          keys.map((key) =>
            httpSvc.delete(`v1.0/state/${storeName}/${key}`).pipe(
              Effect.catchAll((error) =>
                Effect.fail(
                  new DaprStateError({
                    message: `Failed to delete state: ${error.message}`,
                    storeName,
                    key,
                    cause: error,
                  })
                )
              )
            )
          ),
          { concurrency: "unbounded" }
        ).pipe(
          Effect.withSpan("DaprStateSvc.deleteState", {
            attributes: { storeName, count: keys.length },
          })
        ),

      /**
       * Query state store (if supported by the state store component)
       */
      queryState: <T>(storeName: string, query: unknown) =>
        httpSvc
          .post<T>(`v1.0-alpha1/state/${storeName}/query`, query)
          .pipe(
            Effect.catchAll((error) =>
              Effect.fail(
                new DaprStateError({
                  message: `Failed to query state: ${error.message}`,
                  storeName,
                  cause: error,
                })
              )
            ),
            Effect.withSpan("DaprStateSvc.queryState", {
              attributes: { storeName },
            })
          ),
    };
  }),
  dependencies: [DaprHttpSvc.Default],
}) {}
