/**
 * One entry point, two transports.
 *
 * Which one a server uses is a *deployment* decision, not a code one:
 *
 * - **stdio** — Claude Desktop (and any client that launches servers itself) spawns the
 *   process and talks over its stdin/stdout. No port, no lifecycle, nothing for the user
 *   to start or remember. This is the right default for an end user.
 * - **http** — the server listens on a port and clients connect to it. Needed when several
 *   clients share one server, when it runs in Docker, and for the Claude Code dev loop
 *   where you restart the server under a live session.
 *
 * Selected by `MCP_TRANSPORT`; stdio is chosen automatically when stdin is not a TTY and
 * no port is configured, which is exactly the shape of a client-spawned process.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpApp } from "./server.js";
import { log } from "./logging.js";
import type { McpServerConfig, ServerFactory } from "./types.js";

export type TransportKind = "stdio" | "http";

export interface ServeResult {
  readonly transport: TransportKind;
  /** Shut the server down. For stdio this closes the transport; for HTTP it stops listening. */
  readonly stop: () => Promise<void>;
}

/**
 * Decide the transport.
 *
 * An explicit `MCP_TRANSPORT` always wins. Otherwise: a process launched by an MCP client
 * has its stdin wired to a pipe rather than a terminal, so a non-TTY stdin is a strong
 * signal for stdio — but only when nothing has asked for a port, since the detached HTTP
 * runner also redirects stdin from /dev/null.
 */
export function resolveTransport(
  env: Readonly<Record<string, string | undefined>> = process.env,
  isTty: boolean = Boolean(process.stdin.isTTY),
): TransportKind {
  const explicit = env.MCP_TRANSPORT?.trim().toLowerCase();
  if (explicit === "stdio" || explicit === "http") return explicit;
  if (explicit) {
    log("warning", `Unknown MCP_TRANSPORT "${explicit}" — falling back to http.`);
    return "http";
  }
  return !isTty && !env.PORT ? "stdio" : "http";
}

/**
 * Start an MCP server on the resolved transport.
 *
 * The factory is called once per stdio process, or once per session over HTTP — which is
 * why a restarted HTTP server serves updated tool definitions to a reconnecting client.
 */
export async function serveMcp(
  config: McpServerConfig,
  createServer: ServerFactory,
): Promise<ServeResult> {
  const transport = resolveTransport();

  if (transport === "stdio") {
    const server = createServer();
    const stdio = new StdioServerTransport();
    await server.connect(stdio);

    // NOTHING may be written to stdout from here on — it is the protocol channel.
    log("info", `${config.name} ready on stdio`);

    return {
      transport,
      stop: async () => {
        await stdio.close();
      },
    };
  }

  const { start, stop } = createMcpApp(config, createServer);
  await start();

  return { transport, stop };
}
