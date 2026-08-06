import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { CcSvcError } from "../types/index.js";
import { sendSSEError } from "../utils/sse.js";
import { getConfig } from "../config/index.js";

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const config = getConfig();

  // Log the error
  console.error(`[ERROR] ${error.name}: ${error.message}`);
  if (config.LOG_LEVEL === "debug") {
    console.error(error.stack);
  }

  // Check if response was already started (SSE)
  if (res.headersSent) {
    // If headers already sent and it's an SSE response, try to send error event
    if (res.getHeader("Content-Type")?.toString().includes("text/event-stream")) {
      sendSSEError(res, error);
    }
    return;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Custom application errors
  if (error instanceof CcSvcError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Generic errors
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message:
        config.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
    },
  });
}
