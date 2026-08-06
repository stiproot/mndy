import type { Request, Response, NextFunction, RequestHandler } from "express";
import cors from "cors";
import { log } from "./logging.js";

/**
 * DNS rebinding protection middleware
 * Validates the Host header against allowed hosts
 */
export function hostHeaderValidation(
  allowedHosts: string[] = ["localhost", "127.0.0.1"]
): RequestHandler {
  const allowedSet = new Set(allowedHosts.map((h) => h.toLowerCase()));

  return (req: Request, res: Response, next: NextFunction): void => {
    const host = req.headers.host?.split(":")[0]?.toLowerCase();

    if (!host || !allowedSet.has(host)) {
      log("warning", `Blocked request with invalid host: ${host}`);
      res.status(403).json({ error: "Forbidden: Invalid host header" });
      return;
    }

    next();
  };
}

/**
 * Request logging middleware
 */
export function requestLogging(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const { method, path } = req;

    res.on("finish", () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      log("info", `${method} ${path} ${statusCode} ${duration}ms`);
    });

    next();
  };
}

/**
 * Create CORS middleware with the specified configuration
 */
export function createCorsMiddleware(
  origin: boolean | string | string[] = true
): RequestHandler {
  return cors({ origin });
}

/**
 * Error handling middleware
 */
export function errorHandler(): (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    log("error", `Unhandled error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  };
}
