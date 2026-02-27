import "dotenv/config";
import { createMcpApp, McpServer, log } from "mcp-core";
import { registerIssuesTool } from "./tools/issues.js";

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

async function main(): Promise<void> {
  const port = parseInt(process.env.PORT ?? "3001", 10);

  if (!process.env.GITHUB_TOKEN) {
    log("warning", "GITHUB_TOKEN not set - only public repos will be accessible");
  }

  const { start } = createMcpApp(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      port,
      endpoint: "/mcp",
      allowedHosts: ["localhost", "127.0.0.1"],
    },
    createServer
  );

  await start();
}

main().catch((error) => {
  log("error", "Failed to start server", error);
  process.exit(1);
});
