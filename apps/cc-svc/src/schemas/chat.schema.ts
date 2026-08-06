import { z } from "zod";

/**
 * Chat message role
 */
export const chatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

/**
 * Individual chat message in conversation context
 */
export const chatContextMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string(),
});

/**
 * Chat request schema
 */
export const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1, "Message content is required"),
  context: z.array(chatContextMessageSchema).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatContextMessage = z.infer<typeof chatContextMessageSchema>;
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;

/**
 * Chat response schema (for non-streaming)
 */
export const chatResponseSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  role: z.literal("assistant"),
  content: z.string(),
  timestamp: z.string(),
  metadata: z.object({
    model: z.string().optional(),
    processingTimeMs: z.number().optional(),
  }).optional(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;
