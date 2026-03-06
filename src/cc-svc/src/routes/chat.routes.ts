import { Router, type Router as RouterType } from "express";
import { chatHandler } from "../controllers/chat.controller.js";
import { validateRequest } from "../middleware/index.js";
import { chatRequestSchema } from "../schemas/index.js";

export const chatRouter: RouterType = Router();

/**
 * POST /chat
 *
 * Request body:
 * {
 *   conversationId?: string,
 *   content: string,
 *   context?: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
 * }
 *
 * Supports SSE streaming via:
 * - Accept: text/event-stream header
 * - ?stream=true query parameter
 */
chatRouter.post(
  "/chat",
  validateRequest(chatRequestSchema),
  chatHandler
);
