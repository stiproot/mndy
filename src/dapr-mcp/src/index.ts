import "dotenv/config";
import { Effect } from "effect";
import { createMcpApp, McpServer, log, setLogLevel, type LogLevel } from "mcp-core";
import { DataCacheSvc } from "./services/data-cache.service.js";
import {
  // Generic actor tools disabled - use structured submit tools instead
  // registerActorGetStateTool,
  // registerActorSaveStateTool,
  registerSubmitGA4DataTool,
  registerSubmitShopifyDataTool,
  registerSubmitMetaDataTool,
  registerSubmitBrandReportTool,
  registerGetCachedDataTool,
  registerGetBrandReportTool,
} from "./tools/index.js";
import { ServerConfig } from "./types.js";

const SERVER_NAME = "dapr-mcp";
const SERVER_VERSION = "0.1.0";

/**
 * Create and configure the MCP server with state store caching tools.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Generic actor tools disabled - agents were using incorrect actor types
  // registerActorGetStateTool(server);
  // registerActorSaveStateTool(server);

  // Register structured caching tools (type-safe, validated, with TTL)
  registerSubmitGA4DataTool(server);
  registerSubmitShopifyDataTool(server);
  registerSubmitMetaDataTool(server);
  registerSubmitBrandReportTool(server);
  registerGetCachedDataTool(server);
  registerGetBrandReportTool(server);

  return server;
}

/**
 * Main application startup effect.
 * Initializes configuration, services, and starts the HTTP server.
 */
const main = Effect.gen(function* () {
  const config = yield* ServerConfig;

  setLogLevel(config.logLevel as LogLevel);

  log("info", `Starting ${SERVER_NAME} v${SERVER_VERSION}`, {
    port: config.port,
    logLevel: config.logLevel,
  });

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

  log("info", `${SERVER_NAME} is running`, {
    endpoint: `http://localhost:${config.port}/mcp`,
    health: `http://localhost:${config.port}/health`,
  });
}).pipe(
  Effect.provide(DataCacheSvc.Default),
  Effect.tapError((error) =>
    Effect.sync(() => log("error", "Failed to start server", error))
  )
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
