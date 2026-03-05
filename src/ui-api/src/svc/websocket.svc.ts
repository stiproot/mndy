import { Effect, Ref, HashMap, Option } from "effect";
import { WebSocket, WebSocketServer } from "ws";
import { Server, IncomingMessage } from "http";
import { WebSocketConfig, OktaConfig } from "../config";
import {
  WebSocketError,
  WebSocketConnectionError,
  WebSocketSendError,
} from "../errors";
import { WebSocketClient, OutboundMessage } from "../types";
import { OktaAuthSvc } from "./okta-auth.svc";

// Wrap ws.send in a promise
const sendMessageAsync = (
  ws: WebSocket,
  message: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    ws.send(message, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

// Handle new WebSocket connection
const handleConnection = (
  ws: WebSocket,
  req: IncomingMessage,
  clientsRef: Ref.Ref<HashMap.HashMap<string, WebSocketClient>>,
  authSvc: {
    isDevAuthEnabled: () => boolean;
    validateAccessToken: (
      token: string
    ) => Effect.Effect<{ claims: { sub?: string } }, unknown>;
  }
): Effect.Effect<void, WebSocketConnectionError> =>
  Effect.gen(function* () {
    // Extract auth from query params or headers
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const fingerprint =
      url.searchParams.get("fingerprint") ||
      (req.headers["x-fingerprint"] as string);

    // Authenticate
    let userId: string;

    if (authSvc.isDevAuthEnabled()) {
      if (!fingerprint) {
        ws.close(4001, "No fingerprint provided in dev mode");
        return yield* Effect.fail(
          new WebSocketConnectionError({
            message: "No fingerprint in dev mode",
            reason: "auth_failed",
          })
        );
      }
      userId = fingerprint;
      yield* Effect.logInfo("[DEV AUTH] WebSocket connection", { userId });
    } else {
      if (!token) {
        ws.close(4001, "No token provided");
        return yield* Effect.fail(
          new WebSocketConnectionError({
            message: "No token provided",
            reason: "auth_failed",
          })
        );
      }

      const jwt = yield* authSvc.validateAccessToken(token).pipe(
        Effect.catchAll(() => {
          ws.close(4003, "Invalid token");
          return Effect.fail(
            new WebSocketConnectionError({
              message: "Invalid token",
              reason: "auth_failed",
            })
          );
        })
      );

      userId = (jwt.claims.sub as string) || token.substring(0, 16);
    }

    // Create client entry
    const client: WebSocketClient = {
      userId,
      socket: ws,
      isAlive: true,
      connectedAt: new Date(),
    };

    // Store client
    yield* Ref.update(clientsRef, HashMap.set(userId, client));

    yield* Effect.logInfo("WebSocket client connected", { userId });

    // Setup event handlers
    ws.on("pong", () => {
      Effect.runSync(
        Ref.update(clientsRef, (clients) => {
          const existing = HashMap.get(clients, userId);
          if (Option.isSome(existing)) {
            return HashMap.set(clients, userId, {
              ...existing.value,
              isAlive: true,
              lastPing: new Date(),
            });
          }
          return clients;
        })
      );
    });

    ws.on("close", () => {
      Effect.runSync(Ref.update(clientsRef, HashMap.remove(userId)));
      Effect.runSync(
        Effect.logInfo("WebSocket client disconnected", { userId })
      );
    });

    ws.on("message", (data) => {
      const message = data.toString();
      Effect.runSync(
        Effect.logInfo("WebSocket message received", { userId, message })
      );
    });

    ws.on("error", (error) => {
      Effect.runSync(Effect.logError("WebSocket error", { userId, error }));
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connected",
        data: { userId, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      })
    );
  });

// Heartbeat to detect stale connections and send test messages
const startHeartbeat = (
  clientsRef: Ref.Ref<HashMap.HashMap<string, WebSocketClient>>,
  intervalMs: number
): Effect.Effect<NodeJS.Timeout, never> =>
  Effect.sync(() => {
    const timer = setInterval(() => {
      Effect.runSync(
        Effect.gen(function* () {
          const clients = yield* Ref.get(clientsRef);
          const clientCount = HashMap.size(clients);

          for (const [userId, client] of HashMap.toEntries(clients)) {
            if (!client.isAlive) {
              client.socket.terminate();
              yield* Ref.update(clientsRef, HashMap.remove(userId));
              yield* Effect.logInfo("Terminated stale WebSocket connection", {
                userId,
              });
              continue;
            }

            // Mark as not alive until pong received
            yield* Ref.update(clientsRef, (cs) => {
              const existing = HashMap.get(cs, userId);
              if (Option.isSome(existing)) {
                return HashMap.set(cs, userId, {
                  ...existing.value,
                  isAlive: false,
                });
              }
              return cs;
            });

            // Send heartbeat status message to client
            if (client.socket.readyState === WebSocket.OPEN) {
              const statusMessage = {
                type: "status",
                data: {
                  status: "connected",
                  userId,
                },
              };
              client.socket.send(JSON.stringify(statusMessage));
              yield* Effect.logInfo("Heartbeat sent", {
                userId,
                message: JSON.stringify(statusMessage),
              });
            }

            client.socket.ping();
          }
        })
      );
    }, intervalMs);

    return timer;
  });

// Run connection handler with error logging
const runConnectionHandler = (
  ws: WebSocket,
  req: IncomingMessage,
  clientsRef: Ref.Ref<HashMap.HashMap<string, WebSocketClient>>,
  authSvc: {
    isDevAuthEnabled: () => boolean;
    validateAccessToken: (
      token: string
    ) => Effect.Effect<{ claims: { sub?: string } }, unknown>;
  }
): void => {
  handleConnection(ws, req, clientsRef, authSvc).pipe(
    Effect.catchAll((error) =>
      Effect.logError("WebSocket connection error", { error })
    ),
    Effect.runPromise
  );
};

// Send message effect wrapper
const sendMessageEffect = (
  ws: WebSocket,
  message: string,
  userId: string
): Effect.Effect<void, WebSocketSendError> =>
  Effect.async<void, WebSocketSendError>((resume) => {
    ws.send(message, (err) => {
      if (err) {
        resume(
          Effect.fail(
            new WebSocketSendError({
              message: "Failed to send WebSocket message",
              userId,
              cause: err,
            })
          )
        );
      } else {
        resume(Effect.succeed(undefined));
      }
    });
  });

export class WebSocketSvc extends Effect.Service<WebSocketSvc>()(
  "WebSocketSvc",
  {
    effect: Effect.gen(function* () {
      const config = yield* WebSocketConfig;
      const oktaConfig = yield* OktaConfig;
      const authSvc = yield* OktaAuthSvc;

      // Store connected clients: userId -> WebSocketClient
      const clientsRef = yield* Ref.make<
        HashMap.HashMap<string, WebSocketClient>
      >(HashMap.empty());

      // WebSocket server instance (will be set during initialization)
      let wss: WebSocketServer | null = null;
      let heartbeatTimer: NodeJS.Timeout | null = null;

      return {
        // Initialize WebSocket server and attach to HTTP server
        initialize: (httpServer: Server): Effect.Effect<void, WebSocketError> =>
          Effect.gen(function* () {
            wss = new WebSocketServer({
              server: httpServer,
              path: config.wsPath,
            });

            wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
              runConnectionHandler(ws, req, clientsRef, authSvc);
            });

            // Start heartbeat interval
            heartbeatTimer = yield* startHeartbeat(
              clientsRef,
              config.heartbeatIntervalMs
            );

            yield* Effect.logInfo("WebSocket server initialized", {
              path: config.wsPath,
            });
          }).pipe(
            Effect.catchAll((error) =>
              Effect.fail(
                new WebSocketError({
                  message: "Failed to initialize WebSocket server",
                  cause: error,
                })
              )
            ),
            Effect.withSpan("WebSocketSvc.initialize")
          ),

        // Send message to specific user
        sendToUser: (
          userId: string,
          message: OutboundMessage
        ): Effect.Effect<void, WebSocketSendError> =>
          Effect.gen(function* () {
            const clients = yield* Ref.get(clientsRef);
            const client = HashMap.get(clients, userId);

            if (Option.isNone(client)) {
              yield* Effect.logWarning("No WebSocket connection for user", {
                userId,
              });
              return;
            }

            const ws = client.value.socket;

            if (ws.readyState !== WebSocket.OPEN) {
              yield* Effect.logWarning("WebSocket not open for user", {
                userId,
              });
              return;
            }

            yield* sendMessageEffect(ws, JSON.stringify(message), userId);

            yield* Effect.logDebug("Message sent to user", {
              userId,
              type: message.type,
            });
          }).pipe(
            Effect.withSpan("WebSocketSvc.sendToUser", {
              attributes: { userId },
            })
          ),

        // Broadcast message to all connected clients
        broadcast: (message: OutboundMessage): Effect.Effect<void, never> =>
          Effect.gen(function* () {
            const clients = yield* Ref.get(clientsRef);
            const messageStr = JSON.stringify(message);

            for (const [, client] of HashMap.toEntries(clients)) {
              if (client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(messageStr);
              }
            }

            yield* Effect.logDebug("Broadcast sent", {
              type: message.type,
              clientCount: HashMap.size(clients),
            });
          }).pipe(Effect.withSpan("WebSocketSvc.broadcast")),

        // Get count of connected clients
        getConnectionCount: (): Effect.Effect<number, never> =>
          Ref.get(clientsRef).pipe(Effect.map(HashMap.size)),

        // Check if user is connected
        isUserConnected: (userId: string): Effect.Effect<boolean, never> =>
          Ref.get(clientsRef).pipe(
            Effect.map((clients) =>
              Option.isSome(HashMap.get(clients, userId))
            )
          ),

        // Remove client connection
        removeClient: (userId: string): Effect.Effect<void, never> =>
          Ref.update(clientsRef, HashMap.remove(userId)).pipe(
            Effect.tap(() => Effect.logInfo("Client removed", { userId }))
          ),

        // Cleanup (for graceful shutdown)
        shutdown: (): Effect.Effect<void, never> =>
          Effect.gen(function* () {
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
            }

            const clients = yield* Ref.get(clientsRef);
            for (const [, client] of HashMap.toEntries(clients)) {
              client.socket.close(1000, "Server shutting down");
            }

            if (wss) {
              wss.close();
            }

            yield* Effect.logInfo("WebSocket server shut down");
          }),
      };
    }),
    dependencies: [OktaAuthSvc.Default],
  }
) {}
