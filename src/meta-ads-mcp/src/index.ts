import "dotenv/config";
import { Effect } from "effect";
import { createMcpApp, McpServer, log, setLogLevel, type LogLevel } from "mcp-core";
import { registerGetInsightsTool } from "./tools/get-insights.js";
import { registerGetCampaignsTool } from "./tools/get-campaigns.js";
import { ServerConfig } from "./types.js";
import { MetaAdsClient } from "./services/meta.js";

const SERVER_NAME = "meta-ads-mcp";
const SERVER_VERSION = "0.1.0";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerGetInsightsTool(server);
  registerGetCampaignsTool(server);

  return server;
}

/**
 * Main application startup effect
 */
const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const client = yield* MetaAdsClient;

  setLogLevel(config.logLevel as LogLevel);

  if (!client.hasAccessToken()) {
    yield* Effect.log(
      "META_ACCESS_TOKEN not set - API calls will fail. " +
        "Generate a token at developers.facebook.com."
    );
  }

  yield* Effect.log(`Using Ad Account: ${client.getDefaultAdAccountId()}`);

  const { start } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "meta-ads-mcp"],
    },
    createServer
  );

  yield* Effect.promise(() => start());
}).pipe(
  Effect.provide(MetaAdsClient.Default),
  Effect.tapError((error) => Effect.sync(() => log("error", "Failed to start server", error)))
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
