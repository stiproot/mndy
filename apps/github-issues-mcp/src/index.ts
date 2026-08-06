/**
 * Composition root for the GitHub Issues MCP server.
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
import { GitHubClient } from "github-core";
import { ServerConfig } from "./config.js";
import { registerIssuesTool } from "./presentation/tools/issues.js";
import { registerAddLabelsTool, registerRemoveLabelTool } from "./presentation/tools/labels.js";
import { registerUpdateIssueTool } from "./presentation/tools/update-issue.js";

const SERVER_NAME = "github-issues-mcp";
const SERVER_VERSION = "0.1.0";

const main = Effect.gen(function* () {
  const config = yield* ServerConfig;
  setLogLevel(config.logLevel as LogLevel);

  const runtime = createServerRuntime(GitHubClient.Default);
  const client = yield* Effect.promise(() => runtime.runStartup(GitHubClient));

  if (!client.hasToken()) {
    log(
      "warning",
      "GITHUB_TOKEN is not set — only public repos are reachable, at a much lower rate limit.",
    );
  }

  const { start, stop } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port: config.port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1", "github-issues-mcp"],
    },
    () => {
      const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
      registerIssuesTool(server, runtime.run);
      registerUpdateIssueTool(server, runtime.run);
      registerAddLabelsTool(server, runtime.run);
      registerRemoveLabelTool(server, runtime.run);
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
