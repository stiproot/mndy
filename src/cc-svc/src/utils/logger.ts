import { getConfig } from "../config/index.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  const config = getConfig();
  const currentLevel = LOG_LEVELS[config.LOG_LEVEL] ?? LOG_LEVELS.info;
  return LOG_LEVELS[level] >= currentLevel;
}

function formatPrefix(level: LogLevel, context?: string): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? `[${context}]` : "";
  return `[${timestamp}] [${level.toUpperCase()}]${ctx}`;
}

export const logger = {
  debug: (message: string, data?: unknown, context?: string) => {
    if (shouldLog("debug")) {
      const prefix = formatPrefix("debug", context);
      if (data !== undefined) {
        console.debug(prefix, message, JSON.stringify(data, null, 2));
      } else {
        console.debug(prefix, message);
      }
    }
  },

  info: (message: string, data?: unknown, context?: string) => {
    if (shouldLog("info")) {
      const prefix = formatPrefix("info", context);
      if (data !== undefined) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  },

  warn: (message: string, data?: unknown, context?: string) => {
    if (shouldLog("warn")) {
      const prefix = formatPrefix("warn", context);
      if (data !== undefined) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  },

  error: (message: string, data?: unknown, context?: string) => {
    if (shouldLog("error")) {
      const prefix = formatPrefix("error", context);
      if (data !== undefined) {
        console.error(prefix, message, data);
      } else {
        console.error(prefix, message);
      }
    }
  },
};

/**
 * Create a logger scoped to a specific context/agent
 */
export function createScopedLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) => logger.debug(message, data, context),
    info: (message: string, data?: unknown) => logger.info(message, data, context),
    warn: (message: string, data?: unknown) => logger.warn(message, data, context),
    error: (message: string, data?: unknown) => logger.error(message, data, context),
  };
}
