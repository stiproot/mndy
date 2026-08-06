import crypto from "crypto";
import express, { type Express, type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type {
  McpServerConfig,
  McpAppResult,
  ServerFactory,
  SessionState,
} from "./types.js";
import { InMemorySessionStore } from "./session.js";
import {
  hostHeaderValidation,
  requestLogging,
  createCorsMiddleware,
  errorHandler,
} from "./middleware.js";
import { log, createLogger } from "./logging.js";

const DEFAULT_PORT = 3000;
const DEFAULT_ENDPOINT = "/mcp";
const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1"];
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Create an MCP server application with Express
 */
export function createMcpApp(
  config: McpServerConfig,
  serverFactory: ServerFactory
): McpAppResult {
  const {
    name,
    port = DEFAULT_PORT,
    endpoint = DEFAULT_ENDPOINT,
    allowedHosts = DEFAULT_ALLOWED_HOSTS,
    corsOrigin = true,
    sessionTtlMs = DEFAULT_SESSION_TTL_MS,
    enableRequestLogging = true,
  } = config;

  const logger = createLogger(name);
  const app = express();
  const sessions = new InMemorySessionStore(sessionTtlMs);

  // Middleware
  // Note: Do NOT use express.json() globally - the MCP SDK's StreamableHTTPServerTransport
  // needs to parse the raw request body itself. express.json() would consume the body stream
  // before the transport can read it, causing "Parse error: Invalid JSON".
  app.use(createCorsMiddleware(corsOrigin));
  app.use(hostHeaderValidation(allowedHosts));
  if (enableRequestLogging) {
    app.use(requestLogging());
  }

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", sessions: sessions.size });
  });

  // MCP POST endpoint - client sends messages
  app.post(endpoint, async (req: Request, res: Response) => {
    try {
      const clientSessionId = req.headers["mcp-session-id"] as string | undefined;
      let session = clientSessionId ? sessions.get(clientSessionId) : undefined;

      if (!session) {
        // Use client's session ID if provided, otherwise generate one
        const id = clientSessionId || crypto.randomUUID();
        const server = serverFactory();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => id,
        });

        await server.connect(transport);

        session = {
          id,
          server,
          transport,
          createdAt: new Date(),
          lastActivityAt: new Date(),
        } satisfies SessionState;

        sessions.set(id, session);
        logger.info(`New session created: ${id}`);
      } else {
        session.lastActivityAt = new Date();
      }

      await session.transport.handleRequest(req, res);
    } catch (error) {
      logger.error("Error handling POST request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // MCP GET endpoint - SSE stream for server notifications
  app.get(endpoint, async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string;
      const session = sessionId ? sessions.get(sessionId) : undefined;

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      await session.transport.handleRequest(req, res);
    } catch (error) {
      logger.error("Error handling GET request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // MCP DELETE endpoint - terminate session
  app.delete(endpoint, (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string;

    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
      logger.info(`Session terminated: ${sessionId}`);
      res.status(200).json({ message: "Session terminated" });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  // Error handler
  app.use(errorHandler());

  let server: ReturnType<Express["listen"]> | null = null;

  const start = async (): Promise<void> => {
    return new Promise((resolve) => {
      sessions.startCleanup();
      server = app.listen(port, () => {
        log("info", `${name} listening on port ${port}`);
        log("info", `MCP endpoint: ${endpoint}`);
        resolve();
      });
    });
  };

  const stop = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      sessions.stopCleanup();
      sessions.clear();

      if (server) {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  };

  return { app, sessions, start, stop };
}
