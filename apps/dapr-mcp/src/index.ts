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
import { Layer } from "effect";
import { DaprActorSvc } from "dapr-core";
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
} from "./presentation/tools/index.js";
import { ServerConfig } from "./types.js";
import type { ToolRunner } from "./runtime.js";

const SERVER_NAME = "dapr-mcp";
const SERVER_VERSION = "0.1.0";

/**
 * Create and configure the MCP server with state store caching tools.
 */
function createServer(run: ToolRunner): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Generic actor tools disabled - agents were using incorrect actor types
  // registerActorGetStateTool(server);
  // registerActorSaveStateTool(server);

  // Register structured caching tools (type-safe, validated, with TTL)
  registerSubmitGA4DataTool(server, run);
  registerSubmitShopifyDataTool(server, run);
  registerSubmitMetaDataTool(server, run);
  registerSubmitBrandReportTool(server, run);
  registerGetCachedDataTool(server, run);
  registerGetBrandReportTool(server, run);

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

  const runtime = createServerRuntime(
    Layer.merge(DataCacheSvc.Default, DaprActorSvc.Default),
  );

  const { start, stop } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "dapr-mcp"],
    },
    () => createServer(runtime.run),
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

  log("info", `${SERVER_NAME} is running`, {
    endpoint: `http://localhost:${config.port}/mcp`,
    health: `http://localhost:${config.port}/health`,
  });
}).pipe(
  Effect.tapError((error) =>
    Effect.sync(() => log("error", "Failed to start server", error))
  )
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
