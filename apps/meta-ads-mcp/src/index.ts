/**
 * Composition root for the Meta Ads MCP server.
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
import { MetaAdsClient } from "meta-ads-core";
import { ServerConfig } from "./config.js";
import { registerGetCampaignsTool } from "./presentation/tools/get-campaigns.js";
import { registerGetInsightsTool } from "./presentation/tools/get-insights.js";

const SERVER_NAME = "meta-ads-mcp";
const SERVER_VERSION = "0.1.0";

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  setLogLevel(config.logLevel as LogLevel);

  const runtime = createServerRuntime(MetaAdsClient.Default);
  const client = yield* Effect.promise(() => runtime.runStartup(MetaAdsClient));

  if (!client.hasAccessToken) {
    log(
      "warning",
      "META_ACCESS_TOKEN is not set — every Meta call will fail at authentication. " +
        "Generate a token at developers.facebook.com, or run `make refresh-meta-token`.",
    );
  }

  log("info", `Default Meta ad account: ${client.defaultAdAccountId}`);

  const { start, stop } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "meta-ads-mcp"],
    },
    () => {
      const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
      registerGetInsightsTool(server, runtime.run);
      registerGetCampaignsTool(server, runtime.run);
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
