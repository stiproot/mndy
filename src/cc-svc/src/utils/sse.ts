import type { Response } from "express";
import type { StreamEvent } from "../types/index.js";

/**
 * Set up SSE response headers
 */
export function setupSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();
}

/**
 * Send an SSE event to the client
 */
export function sendSSEEvent(res: Response, event: StreamEvent): void {
  const data = JSON.stringify(event);
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${data}\n\n`);

  // Attempt to flush if available (depends on middleware)
  if (typeof (res as unknown as { flush?: () => void }).flush === "function") {
    (res as unknown as { flush: () => void }).flush();
  }
}

/**
 * End the SSE stream
 */
export function endSSE(res: Response): void {
  res.write("event: done\n");
  res.write("data: {}\n\n");
  res.end();
}

/**
 * Send an SSE error and end the stream
 */
export function sendSSEError(res: Response, error: Error): void {
  sendSSEEvent(res, {
    type: "error",
    data: {
      message: error.message,
      code: (error as unknown as { code?: string }).code ?? "INTERNAL_ERROR",
    },
  });
  endSSE(res);
}

/**
 * Check if the request wants SSE streaming
 */
export function wantsSSE(
  acceptHeader: string | undefined,
  streamParam: unknown
): boolean {
  if (acceptHeader?.includes("text/event-stream")) {
    return true;
  }
  return streamParam === "true" || streamParam === "1";
}
