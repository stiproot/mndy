import type { LogLevel } from "./types.js";

/**
 * Log level severity order (lower index = less severe)
 */
const LOG_LEVEL_ORDER: LogLevel[] = [
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency",
];

/**
 * Current minimum log level
 */
let currentLogLevel: LogLevel = "info";

/**
 * Set the minimum log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get the current minimum log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Check if a log level should be output based on current minimum level
 */
export function shouldLog(level: LogLevel): boolean {
  const currentIndex = LOG_LEVEL_ORDER.indexOf(currentLogLevel);
  const targetIndex = LOG_LEVEL_ORDER.indexOf(level);
  return targetIndex >= currentIndex;
}

/**
 * Format a log message with timestamp and level
 */
export function formatLogMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Log a message at the specified level
 */
export function log(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const formatted = formatLogMessage(level, message);

  switch (level) {
    case "debug":
    case "info":
    case "notice":
      console.log(formatted, data !== undefined ? data : "");
      break;
    case "warning":
      console.warn(formatted, data !== undefined ? data : "");
      break;
    case "error":
    case "critical":
    case "alert":
    case "emergency":
      console.error(formatted, data !== undefined ? data : "");
      break;
  }
}

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string): {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  notice: (message: string, data?: unknown) => void;
  warning: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  critical: (message: string, data?: unknown) => void;
  alert: (message: string, data?: unknown) => void;
  emergency: (message: string, data?: unknown) => void;
} {
  const prefixedLog = (level: LogLevel, message: string, data?: unknown) => {
    log(level, `[${prefix}] ${message}`, data);
  };

  return {
    debug: (message, data) => prefixedLog("debug", message, data),
    info: (message, data) => prefixedLog("info", message, data),
    notice: (message, data) => prefixedLog("notice", message, data),
    warning: (message, data) => prefixedLog("warning", message, data),
    error: (message, data) => prefixedLog("error", message, data),
    critical: (message, data) => prefixedLog("critical", message, data),
    alert: (message, data) => prefixedLog("alert", message, data),
    emergency: (message, data) => prefixedLog("emergency", message, data),
  };
}
