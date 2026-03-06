import "dotenv/config";
import { Effect } from "effect";
import { createMcpApp, McpServer, log, setLogLevel, type LogLevel } from "mcp-core";
import { registerGetOrdersTool } from "./tools/get-orders.js";
import { registerGetAnalyticsTool } from "./tools/get-analytics.js";
import { ServerConfig } from "./types.js";
import { ShopifyClient } from "./services/shopify.js";

const SERVER_NAME = "shopify-mcp";
const SERVER_VERSION = "0.1.0";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerGetOrdersTool(server);
  registerGetAnalyticsTool(server);

  return server;
}

/**
 * Main application startup effect
 */
const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const client = yield* ShopifyClient;

  setLogLevel(config.logLevel as LogLevel);

  if (!client.hasCredentials()) {
    yield* Effect.log("SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET not set - API requests will fail");
  } else {
    yield* Effect.log(`Shopify MCP configured for store: ${client.getStoreUrl()}`);
  }

  const { start } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1"],
    },
    createServer
  );

  yield* Effect.promise(() => start());
}).pipe(
  Effect.provide(ShopifyClient.Default),
  Effect.tapError((error) => Effect.sync(() => log("error", "Failed to start server", error)))
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
