/**
 * Composition root for the Shopify MCP server.
 *
 * One running server serves exactly ONE store — Shopify auth is an OAuth grant bound to a
 * store, so there is no per-call override the way GA4 and Meta have. The store this
 * process is bound to is logged at startup so a brand mismatch is visible immediately.
 */

import "dotenv/config";
import { Effect } from "effect";
import {
  createMcpApp,
  createServerRuntime,
  log,
  McpServer,
  setLogLevel,
  type LogLevel,
} from "mcp-core";
import { ShopifyClient } from "shopify-core";
import { ServerConfig } from "./config.js";
import { registerGetAnalyticsTool } from "./presentation/tools/get-analytics.js";
import { registerGetOrdersTool } from "./presentation/tools/get-orders.js";

const SERVER_NAME = "shopify-mcp";
const SERVER_VERSION = "0.1.0";

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  setLogLevel(config.logLevel as LogLevel);

  const runtime = createServerRuntime(ShopifyClient.Default);
  const client = yield* Effect.promise(() => runtime.runStartup(ShopifyClient));

  if (!client.hasCredentials) {
    log(
      "warning",
      "SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET is not set — every request will fail.",
    );
  } else {
    log("info", `Bound to Shopify store: ${client.storeUrl}`);
  }

  const { start, stop } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "shopify-mcp"],
    },
    () => {
      const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
      registerGetOrdersTool(server, runtime.run);
      registerGetAnalyticsTool(server, runtime.run);
      return server;
    },
  );

  const shutdown = (signal: string) => {
    log("info", `${signal} received, shutting down`);
    void stop()
      .then(() => runtime.dispose())
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  yield* Effect.promise(() => start());
}).pipe(
  Effect.tapError((error) =>
    Effect.sync(() => log("error", "Failed to start server", error)),
  ),
);

Effect.runPromise(main).catch(() => {
  process.exit(1);
});
