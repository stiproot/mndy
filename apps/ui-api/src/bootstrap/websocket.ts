import { Effect } from "effect";
import { Server } from "http";
import { WebSocketSvc, setWebSocketMessageHandler } from "../svc";
import { WebSocketError } from "../errors";
import { handleWebSocketMessage } from "../handlers/websocket-chat.handler";

/**
 * Initializes the WebSocket server and attaches it to the HTTP server.
 * Also configures the message handler for chat functionality.
 * Returns an Effect that requires WebSocketSvc.
 */
export const initializeWebSocket = (
  httpServer: Server
): Effect.Effect<void, WebSocketError, WebSocketSvc> =>
  Effect.gen(function* () {
    // Set up message handler for chat before initializing WebSocket
    setWebSocketMessageHandler(handleWebSocketMessage);

    const webSocketSvc = yield* WebSocketSvc;
    yield* webSocketSvc.initialize(httpServer);
    yield* Effect.logInfo("WebSocket server initialized with chat handler");
  });
