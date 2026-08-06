import { Effect, Duration } from "effect";
import { HttpRequestError, HttpResponseError, TimeoutError } from "../errors";

const DEFAULT_TIMEOUT = Duration.seconds(30);

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

export class HttpClientSvc extends Effect.Service<HttpClientSvc>()("HttpClientSvc", {
  sync: () => ({
    get: <T>(
      baseUrl: string,
      path: string,
      headers: Record<string, string> = {}
    ): Effect.Effect<T, HttpRequestError | HttpResponseError | TimeoutError> => {
      const url = `${baseUrl}${path}`;

      return Effect.tryPromise({
        try: () =>
          fetch(url, {
            method: "GET",
            headers: { ...DEFAULT_HEADERS, ...headers },
          }),
        catch: (error) =>
          new HttpRequestError({
            message: "HTTP GET request failed",
            url,
            method: "GET",
            cause: error,
          }),
      }).pipe(
        Effect.flatMap((response) =>
          response.ok
            ? Effect.tryPromise({
                try: () => response.json() as Promise<T>,
                catch: () =>
                  new HttpResponseError({
                    message: "Failed to parse JSON response",
                    status: response.status,
                    url,
                  }),
              })
            : Effect.fail(
                new HttpResponseError({
                  message: `HTTP GET request failed with status ${response.status}`,
                  status: response.status,
                  url,
                })
              )
        ),
        Effect.timeoutFail({
          duration: DEFAULT_TIMEOUT,
          onTimeout: () =>
            new TimeoutError({
              message: "HTTP GET request timed out",
              duration: Duration.format(DEFAULT_TIMEOUT),
            }),
        }),
        Effect.withSpan("HttpClientSvc.get", { attributes: { url, method: "GET" } })
      );
    },

    post: <T, D>(
      baseUrl: string,
      path: string,
      data: D,
      headers: Record<string, string> = {}
    ): Effect.Effect<T, HttpRequestError | HttpResponseError | TimeoutError> => {
      const url = `${baseUrl}${path}`;

      return Effect.tryPromise({
        try: () =>
          fetch(url, {
            method: "POST",
            headers: { ...DEFAULT_HEADERS, ...headers },
            body: JSON.stringify(data),
          }),
        catch: (error) =>
          new HttpRequestError({
            message: "HTTP POST request failed",
            url,
            method: "POST",
            cause: error,
          }),
      }).pipe(
        Effect.flatMap((response) =>
          response.ok
            ? Effect.tryPromise({
                try: () => response.json() as Promise<T>,
                catch: () =>
                  new HttpResponseError({
                    message: "Failed to parse JSON response",
                    status: response.status,
                    url,
                  }),
              })
            : Effect.fail(
                new HttpResponseError({
                  message: `HTTP POST request failed with status ${response.status}`,
                  status: response.status,
                  url,
                })
              )
        ),
        Effect.timeoutFail({
          duration: DEFAULT_TIMEOUT,
          onTimeout: () =>
            new TimeoutError({
              message: "HTTP POST request timed out",
              duration: Duration.format(DEFAULT_TIMEOUT),
            }),
        }),
        Effect.withSpan("HttpClientSvc.post", { attributes: { url, method: "POST" } })
      );
    },
  }),
}) {}
