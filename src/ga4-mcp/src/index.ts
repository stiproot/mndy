import "dotenv/config";
import { Effect } from "effect";
import { createMcpApp, McpServer, log, setLogLevel, type LogLevel } from "mcp-core";
import { registerRunReportTool } from "./tools/run-report.js";
import { ServerConfig } from "./types.js";
import { GA4Client } from "./services/ga4.js";

const SERVER_NAME = "ga4-mcp";
const SERVER_VERSION = "0.1.0";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerRunReportTool(server);

  return server;
}

/**
 * Main application startup effect
 */
const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const client = yield* GA4Client;

  setLogLevel(config.logLevel as LogLevel);

  if (!client.hasCredentials()) {
    yield* Effect.log(
      "GOOGLE_APPLICATION_CREDENTIALS not set - authentication may fail. " +
        "Set the path to your service account JSON key."
    );
  }

  yield* Effect.log(`Using GA4 Property ID: ${client.getDefaultPropertyId()}`);

  const { start } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "ga4-mcp"],
    },
    createServer
  );

  yield* Effect.promise(() => start());
}).pipe(
  Effect.provide(GA4Client.Default),
  Effect.tapError((error) => Effect.sync(() => log("error", "Failed to start server", error)))
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
