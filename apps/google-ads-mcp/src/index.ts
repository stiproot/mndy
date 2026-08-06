/**
 * Composition root for the Google Ads MCP server.
 */

import "dotenv/config";
import { Effect } from "effect";
import {
  createServerRuntime,
  log,
  McpServer,
  serveMcp,
  setLogLevel,
  type LogLevel,
} from "mcp-core";
import { GoogleAdsClient } from "google-ads-core";
import { ServerConfig } from "./config.js";
import { INSTRUCTIONS, registerPrompts } from "./presentation/steering.js";
import { registerGetCampaignsTool } from "./presentation/tools/get-campaigns.js";
import { registerGetPerformanceTool } from "./presentation/tools/get-performance.js";

const SERVER_NAME = "google-ads-mcp";
const SERVER_VERSION = "0.1.0";

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  setLogLevel(config.logLevel as LogLevel);

  const runtime = createServerRuntime(GoogleAdsClient.Default);
  const client = yield* Effect.promise(() => runtime.runStartup(GoogleAdsClient));

  log("info", `Default Google Ads customer: ${client.defaultCustomerId}`);

  const { transport, stop } = yield* Effect.promise(() =>
    serveMcp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "google-ads-mcp"],
    },
    () => {
      const server = new McpServer(
          { name: SERVER_NAME, version: SERVER_VERSION },
          { instructions: INSTRUCTIONS },
        );
      registerGetPerformanceTool(server, runtime.run);
      registerGetCampaignsTool(server, runtime.run);
      registerPrompts(server);
      return server;
    },
    ),
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

  log("debug", `${SERVER_NAME} serving over ${transport}`);
}).pipe(
  Effect.tapError((error) =>
    Effect.sync(() => log("error", "Failed to start server", error)),
  ),
);

Effect.runPromise(main).catch(() => {
  process.exit(1);
});
