/**
 * Composition root for the GA4 MCP server.
 *
 * This file is the ONLY place that knows how the pieces fit: it reads config, builds the
 * runtime from `ga4-core`'s layer, registers the inbound adapters, and starts the HTTP
 * server. No business logic — see CLAUDE.md, "Where code lives".
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
import { GA4Client } from "ga4-core";
import { ServerConfig } from "./config.js";
import { registerRunReportTool } from "./presentation/tools/run-report.js";

const SERVER_NAME = "ga4-mcp";
const SERVER_VERSION = "0.1.0";

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  setLogLevel(config.logLevel as LogLevel);

  // Built once. Every tool call runs against this runtime, so the GA4 client — and its
  // auth handshake — is created at startup rather than per request.
  const runtime = createServerRuntime(GA4Client.Default);

  const client = yield* Effect.promise(() => runtime.runStartup(GA4Client));

  if (!client.hasCredentials) {
    log(
      "warning",
      "GOOGLE_APPLICATION_CREDENTIALS is not set — GA4 calls will fail at authentication. " +
        "Point it at your service account JSON key.",
    );
  }

  log("info", `Default GA4 property: ${client.defaultPropertyId}`);

  const { start, stop } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "ga4-mcp"],
    },
    () => {
      const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
      registerRunReportTool(server, runtime.run);
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
