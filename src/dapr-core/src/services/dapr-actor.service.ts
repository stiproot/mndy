import { Effect, Duration, Schedule } from "effect";
import { DaprHttpSvc } from "./dapr-http.service.js";
import {
  DaprActorError,
  DaprTimeoutError,
  DaprConnectionError,
} from "../errors.js";

const MAX_RETRIES = 3;

const retrySchedule = Schedule.exponential(Duration.millis(500)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(MAX_RETRIES))
);

/**
 * Check if an error is retryable (network issues, 5xx errors)
 */
const isRetryable = (error: DaprActorError | DaprConnectionError): boolean => {
  if (error._tag === "DaprConnectionError") {
    return true;
  }
  if (error._tag === "DaprActorError" && error.statusCode) {
    return error.statusCode >= 500;
  }
  return false;
};

/**
 * Service for interacting with Dapr actors.
 * Provides methods for invoking actor methods and managing actor state.
 */
export class DaprActorSvc extends Effect.Service<DaprActorSvc>()("DaprActorSvc", {
  effect: Effect.gen(function* () {
    const httpSvc = yield* DaprHttpSvc;

    return {
      /**
       * Invoke a method on a Dapr actor.
       * This is the primary way to interact with actors.
       *
       * @param actorType - The type of actor (e.g., "BrandInsightsActor")
       * @param actorId - The unique ID of the actor instance
       * @param method - The method name to invoke
       * @param payload - Optional payload to send to the method
       */
      invokeMethod: <TResponse, TPayload = unknown>(
        actorType: string,
        actorId: string,
        method: string,
        payload?: TPayload
      ): Effect.Effect<
        TResponse,
        DaprActorError | DaprTimeoutError | DaprConnectionError
      > => {
        const route = `v1.0/actors/${encodeURIComponent(actorType)}/${encodeURIComponent(actorId)}/method/${encodeURIComponent(method)}`;

        return httpSvc
          .post<TResponse, TPayload | Record<string, never>>(
            route,
            payload ?? ({} as Record<string, never>)
          )
          .pipe(
            Effect.mapError((error) => {
              if (error._tag === "DaprTimeoutError") {
                return new DaprTimeoutError({
                  ...error,
                  actorType,
                  actorId,
                });
              }
              return new DaprActorError({
                message: `Actor method invocation failed: ${error.message}`,
                actorType,
                actorId,
                method,
                cause: error,
              });
            }),
            Effect.retry({
              schedule: retrySchedule,
              while: (error) =>
                error._tag !== "DaprTimeoutError" &&
                isRetryable(error as DaprActorError | DaprConnectionError),
            }),
            Effect.withSpan("DaprActorSvc.invokeMethod", {
              attributes: { actorType, actorId, method },
            })
          );
      },

      /**
       * Get a specific state key from an actor.
       * This directly accesses actor state without invoking a method.
       *
       * @param actorType - The type of actor
       * @param actorId - The unique ID of the actor instance
       * @param stateKey - The state key to retrieve
       */
      getState: <TResponse>(
        actorType: string,
        actorId: string,
        stateKey: string
      ): Effect.Effect<
        TResponse,
        DaprActorError | DaprTimeoutError | DaprConnectionError
      > => {
        const route = `v1.0/actors/${encodeURIComponent(actorType)}/${encodeURIComponent(actorId)}/state/${encodeURIComponent(stateKey)}`;

        return httpSvc.get<TResponse>(route).pipe(
          Effect.mapError((error) =>
            new DaprActorError({
              message: `Failed to get actor state: ${error.message}`,
              actorType,
              actorId,
              cause: error,
            })
          ),
          Effect.withSpan("DaprActorSvc.getState", {
            attributes: { actorType, actorId, stateKey },
          })
        );
      },

      /**
       * Save a state value to an actor.
       * This directly sets actor state without invoking a method.
       *
       * @param actorType - The type of actor
       * @param actorId - The unique ID of the actor instance
       * @param stateKey - The state key to save
       * @param value - The value to save
       */
      saveState: <TValue>(
        actorType: string,
        actorId: string,
        stateKey: string,
        value: TValue
      ): Effect.Effect<
        void,
        DaprActorError | DaprTimeoutError | DaprConnectionError
      > => {
        const route = `v1.0/actors/${encodeURIComponent(actorType)}/${encodeURIComponent(actorId)}/state`;

        // Dapr expects an array of state operations for the transactional state API
        const stateOps = [
          {
            operation: "upsert",
            request: {
              key: stateKey,
              value,
            },
          },
        ];

        return httpSvc.post<void, typeof stateOps>(route, stateOps).pipe(
          Effect.mapError((error) =>
            new DaprActorError({
              message: `Failed to save actor state: ${error.message}`,
              actorType,
              actorId,
              cause: error,
            })
          ),
          Effect.tap(() =>
            Effect.logInfo("Actor state saved", { actorType, actorId, stateKey })
          ),
          Effect.withSpan("DaprActorSvc.saveState", {
            attributes: { actorType, actorId, stateKey },
          })
        );
      },

      /**
       * Delete actor state.
       *
       * @param actorType - The type of actor
       * @param actorId - The unique ID of the actor instance
       * @param stateKey - The state key to delete
       */
      deleteState: (
        actorType: string,
        actorId: string,
        stateKey: string
      ): Effect.Effect<
        void,
        DaprActorError | DaprTimeoutError | DaprConnectionError
      > => {
        const route = `v1.0/actors/${encodeURIComponent(actorType)}/${encodeURIComponent(actorId)}/state`;

        const stateOps = [
          {
            operation: "delete",
            request: {
              key: stateKey,
            },
          },
        ];

        return httpSvc.post<void, typeof stateOps>(route, stateOps).pipe(
          Effect.mapError((error) =>
            new DaprActorError({
              message: `Failed to delete actor state: ${error.message}`,
              actorType,
              actorId,
              cause: error,
            })
          ),
          Effect.tap(() =>
            Effect.logInfo("Actor state deleted", { actorType, actorId, stateKey })
          ),
          Effect.withSpan("DaprActorSvc.deleteState", {
            attributes: { actorType, actorId, stateKey },
          })
        );
      },
    };
  }),
  dependencies: [DaprHttpSvc.Default],
}) {}
