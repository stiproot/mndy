import { Effect } from "effect";
import { Server } from "http";
import { WebSocketSvc } from "../svc";
import { WebSocketError } from "../errors";

/**
 * Initializes the WebSocket server and attaches it to the HTTP server.
 * Returns an Effect that requires WebSocketSvc.
 */
export const initializeWebSocket = (
  httpServer: Server
): Effect.Effect<void, WebSocketError, WebSocketSvc> =>
  Effect.gen(function* () {
    const webSocketSvc = yield* WebSocketSvc;
    yield* webSocketSvc.initialize(httpServer);
    yield* Effect.logInfo("WebSocket server initialized");
  });
