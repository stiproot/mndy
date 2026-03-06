import type { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service.js";
import type { ChatRequest } from "../types/index.js";
import { setupSSE, sendSSEEvent, endSSE, wantsSSE } from "../utils/sse.js";

const chatService = new ChatService();

/**
 * POST /chat
 * Send a chat message and receive a response
 */
export async function chatHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as ChatRequest;
  const isSSE = wantsSSE(req.headers.accept, req.query.stream);

  try {
    if (isSSE) {
      // Stream response via SSE
      setupSSE(res);

      for await (const event of chatService.streamChat(body)) {
        sendSSEEvent(res, event);
      }

      endSSE(res);
    } else {
      // Synchronous JSON response
      const result = await chatService.chat(body);
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
}
