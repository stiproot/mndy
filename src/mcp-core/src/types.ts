import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Express } from "express";

/**
 * MCP log levels in order of severity
 */
export type LogLevel =
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "emergency";

/**
 * Server configuration options
 */
export interface McpServerConfig {
  /** Server name (used in initialization) */
  name: string;
  /** Server version */
  version: string;
  /** Port to listen on (default: 3000) */
  port?: number;
  /** MCP endpoint path (default: /mcp) */
  endpoint?: string;
  /** Allowed hosts for DNS rebinding protection (default: ["localhost", "127.0.0.1"]) */
  allowedHosts?: string[];
  /** CORS origin configuration (default: true) */
  corsOrigin?: boolean | string | string[];
  /** Session TTL in milliseconds (default: 30 minutes) */
  sessionTtlMs?: number;
  /** Enable request logging (default: true) */
  enableRequestLogging?: boolean;
}

/**
 * Session state stored for each connected client
 */
export interface SessionState {
  /** Unique session identifier */
  id: string;
  /** MCP server instance for this session */
  server: McpServer;
  /** Transport instance for this session */
  transport: StreamableHTTPServerTransport;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivityAt: Date;
}

/**
 * Session store interface for managing sessions
 */
export interface SessionStore {
  /** Get a session by ID */
  get(id: string): SessionState | undefined;
  /** Store a session */
  set(id: string, session: SessionState): void;
  /** Delete a session */
  delete(id: string): boolean;
  /** Check if session exists */
  has(id: string): boolean;
  /** Get all session IDs */
  keys(): IterableIterator<string>;
  /** Get session count */
  size: number;
}

/**
 * Server factory function type
 */
export type ServerFactory = () => McpServer;

/**
 * Result from createMcpApp
 */
export interface McpAppResult {
  /** Express application instance */
  app: Express;
  /** Session store for managing sessions */
  sessions: SessionStore;
  /** Start the server */
  start: () => Promise<void>;
  /** Stop the server and cleanup sessions */
  stop: () => Promise<void>;
}

/**
 * Tool result content types
 */
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

export interface AudioContent {
  type: "audio";
  data: string;
  mimeType: string;
}

export interface ResourceContent {
  type: "resource";
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
}

export type ToolContent = TextContent | ImageContent | AudioContent | ResourceContent;

/**
 * Tool execution result
 */
export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
  structuredContent?: unknown;
}
