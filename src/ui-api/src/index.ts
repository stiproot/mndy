import http from "http";
import { Effect, ConfigProvider, Layer } from "effect";
import "dotenv/config";

import { ServerConfig } from "./config";
import { AppLayer } from "./svc";
import { createServer, initializeWebSocket } from "./bootstrap";

// Create Express app with all routes
const app = createServer();

// Create HTTP server (needed for WebSocket upgrade)
const httpServer = http.createServer(app);

// Start server
const startServer = Effect.gen(function* () {
  const config = yield* ServerConfig;

  // Initialize WebSocket server
  yield* initializeWebSocket(httpServer);

  // Start listening
  httpServer.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    console.log(`WebSocket available at ws://localhost:${config.port}/ws`);
  });
}).pipe(
  Effect.provide(AppLayer),
  Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
);

Effect.runPromise(startServer).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
