import { Effect, Duration } from "effect";
import { DaprConfig } from "../config.js";
import { DaprConnectionError, DaprTimeoutError } from "../errors.js";

const REQUEST_TIMEOUT = Duration.seconds(30);

/**
 * Low-level HTTP service for communicating with the Dapr sidecar.
 * Provides typed methods for GET and POST requests with timeout and error handling.
 */
export class DaprHttpSvc extends Effect.Service<DaprHttpSvc>()("DaprHttpSvc", {
  effect: Effect.gen(function* () {
    const config = yield* DaprConfig;
    const baseUrl = `http://${config.daprHost}:${config.daprHttpPort}`;

    return {
      /**
       * Make a POST request to the Dapr sidecar
       */
      post: <TResponse, TBody = unknown>(
        path: string,
        body: TBody,
        headers: Record<string, string> = {}
      ): Effect.Effect<TResponse, DaprConnectionError | DaprTimeoutError> =>
        Effect.tryPromise({
          try: async () => {
            const response = await fetch(`${baseUrl}/${path}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const errorText = await response.text().catch(() => "Unknown error");
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Handle empty responses (204 No Content)
            const contentLength = response.headers.get("content-length");
            if (response.status === 204 || contentLength === "0") {
              return undefined as TResponse;
            }

            return (await response.json()) as TResponse;
          },
          catch: (error) =>
            new DaprConnectionError({
              message: `Dapr HTTP POST failed: ${error instanceof Error ? error.message : String(error)}`,
              host: config.daprHost,
              port: config.daprHttpPort,
              cause: error,
            }),
        }).pipe(
          Effect.timeoutFail({
            duration: REQUEST_TIMEOUT,
            onTimeout: () =>
              new DaprTimeoutError({
                message: "Dapr HTTP request timed out",
                duration: Duration.format(REQUEST_TIMEOUT),
              }),
          }),
          Effect.withSpan("DaprHttpSvc.post", { attributes: { path } })
        ),

      /**
       * Make a GET request to the Dapr sidecar
       */
      get: <TResponse>(
        path: string,
        headers: Record<string, string> = {}
      ): Effect.Effect<TResponse, DaprConnectionError | DaprTimeoutError> =>
        Effect.tryPromise({
          try: async () => {
            const response = await fetch(`${baseUrl}/${path}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
            });

            if (!response.ok) {
              const errorText = await response.text().catch(() => "Unknown error");
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Handle empty responses
            const contentLength = response.headers.get("content-length");
            if (response.status === 204 || contentLength === "0") {
              return undefined as TResponse;
            }

            return (await response.json()) as TResponse;
          },
          catch: (error) =>
            new DaprConnectionError({
              message: `Dapr HTTP GET failed: ${error instanceof Error ? error.message : String(error)}`,
              host: config.daprHost,
              port: config.daprHttpPort,
              cause: error,
            }),
        }).pipe(
          Effect.timeoutFail({
            duration: REQUEST_TIMEOUT,
            onTimeout: () =>
              new DaprTimeoutError({
                message: "Dapr HTTP request timed out",
                duration: Duration.format(REQUEST_TIMEOUT),
              }),
          }),
          Effect.withSpan("DaprHttpSvc.get", { attributes: { path } })
        ),

      /**
       * Get the base URL for the Dapr sidecar
       */
      getBaseUrl: () => baseUrl,
    };
  }),
}) {}
