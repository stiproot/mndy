import { Effect } from "effect";
import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr";
import { DaprConfig } from "../config";
import { DaprStateError } from "../errors";
import { HttpClientSvc } from "./http-client.svc";

export interface StateStoreMetadata {
  metadata?: {
    partitionKey: string;
    [key: string]: string;
  };
}

export interface StateItem<T> {
  key: string;
  value: T;
}

export class DaprStateSvc extends Effect.Service<DaprStateSvc>()("DaprStateSvc", {
  effect: Effect.gen(function* () {
    const config = yield* DaprConfig;
    const httpClientSvc = yield* HttpClientSvc;

    const daprPort =
      config.daprProtocol === CommunicationProtocolEnum.GRPC
        ? config.daprGrpcPort
        : config.daprHttpPort;

    const daprClient = new DaprClient({
      daprHost: config.daprHost,
      daprPort,
      communicationProtocol: config.daprProtocol,
    });

    const daprBaseUrl = `http://${config.daprHost}:${config.daprHttpPort}/`;

    return {
      getState: <T>(
        storeName: string,
        key: string,
        options: StateStoreMetadata = {}
      ): Effect.Effect<T, DaprStateError> =>
        Effect.tryPromise({
          try: () => daprClient.state.get(storeName, key, options) as Promise<T>,
          catch: (error) =>
            new DaprStateError({
              message: "Failed to get state",
              storeName,
              key,
              cause: error,
            }),
        }).pipe(Effect.withSpan("DaprStateSvc.getState", { attributes: { storeName, key } })),

      saveState: <T>(
        storeName: string,
        state: StateItem<T>[],
        options: StateStoreMetadata = {}
      ): Effect.Effect<void, DaprStateError> =>
        Effect.tryPromise({
          try: () => daprClient.state.save(storeName, state, options),
          catch: (error) =>
            new DaprStateError({
              message: "Failed to save state",
              storeName,
              cause: error,
            }),
        }).pipe(
          Effect.tap(() =>
            Effect.logInfo("State saved", { storeName, keys: state.map((s) => s.key) })
          ),
          Effect.withSpan("DaprStateSvc.saveState", {
            attributes: { storeName, count: state.length },
          })
        ),

      deleteState: (
        storeName: string,
        key: string,
        options: StateStoreMetadata = {}
      ): Effect.Effect<void, DaprStateError> =>
        Effect.tryPromise({
          try: () => daprClient.state.delete(storeName, key, options),
          catch: (error) =>
            new DaprStateError({
              message: "Failed to delete state",
              storeName,
              key,
              cause: error,
            }),
        }).pipe(
          Effect.tap(() => Effect.logInfo("State deleted", { storeName, key })),
          Effect.withSpan("DaprStateSvc.deleteState", { attributes: { storeName, key } })
        ),

      queryState: <T>(
        storeName: string,
        query: unknown
      ): Effect.Effect<T, DaprStateError> =>
        Effect.tryPromise({
          try: () => daprClient.state.query(storeName, query as Parameters<typeof daprClient.state.query>[1]) as Promise<T>,
          catch: (error) =>
            new DaprStateError({
              message: "Failed to query state",
              storeName,
              cause: error,
            }),
        }).pipe(Effect.withSpan("DaprStateSvc.queryState", { attributes: { storeName } })),

      getActorState: <T>(
        actorType: string,
        actorId: string,
        actorMethod: string
      ): Effect.Effect<T, DaprStateError> => {
        const route = `v1.0/actors/${actorType}/${actorId}/method/${actorMethod}`;
        return httpClientSvc.post<T, Record<string, never>>(daprBaseUrl, route, {}).pipe(
          Effect.mapError(
            (error) =>
              new DaprStateError({
                message: "Failed to get actor state",
                cause: error,
              })
          ),
          Effect.withSpan("DaprStateSvc.getActorState", {
            attributes: { actorType, actorId, actorMethod },
          })
        );
      },
    };
  }),
  dependencies: [HttpClientSvc.Default],
}) {}
