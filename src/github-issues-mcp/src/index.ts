import "dotenv/config";
import { Effect } from "effect";
import { createMcpApp, McpServer, log, setLogLevel, type LogLevel } from "mcp-core";
import { registerIssuesTool } from "./tools/issues.js";
import { ServerConfig } from "./types.js";
import { GitHubClient } from "./services/github.js";

const SERVER_NAME = "github-issues-mcp";
const SERVER_VERSION = "0.1.0";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerIssuesTool(server);

  return server;
}

/**
 * Main application startup effect
 */
const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const client = yield* GitHubClient;

  setLogLevel(config.logLevel as LogLevel);

  if (!client.hasToken()) {
    yield* Effect.log("GITHUB_TOKEN not set - only public repos will be accessible");
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
  Effect.provide(GitHubClient.Default),
  Effect.tapError((error) => Effect.sync(() => log("error", "Failed to start server", error)))
);

// Execute the main effect
Effect.runPromise(main).catch(() => {
  process.exit(1);
});
