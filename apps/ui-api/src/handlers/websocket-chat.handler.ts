import { Effect } from "effect";
import { ChatSvc, AppLayer } from "../svc";
import type { ChatRequest } from "../svc";

// WebSocket inbound message types (from UI)
interface WsChatMessage {
  type: "chat";
  payload: {
    conversationId?: string;
    content: string;
    context?: Array<{
      id: string;
      conversationId: string;
      role: "user" | "assistant" | "system";
      content: string;
      timestamp: string;
      labels: string[];
    }>;
  };
}

interface WsPingMessage {
  type: "ping";
}

type WsInboundMessage = WsChatMessage | WsPingMessage;

// Safe JSON parse
function safeParseMessage(data: string): WsInboundMessage | null {
  const trimmed = data.trim();
  if (!trimmed.startsWith("{")) return null;
  const parsed = JSON.parse(trimmed) as WsInboundMessage;
  if (!parsed || typeof parsed.type !== "string") return null;
  return parsed;
}

/**
 * Handle incoming WebSocket message from a client.
 * This function is called by the WebSocket service when a message is received.
 */
export const handleWebSocketMessage = (userId: string, data: string): void => {
  // Parse message
  let message: WsInboundMessage | null = null;
  Promise.resolve()
    .then(() => {
      message = safeParseMessage(data);
      return message;
    })
    .then((msg) => {
      if (!msg) {
        console.warn("[WS Handler] Invalid message format:", data);
        return;
      }

      if (msg.type === "ping") {
        // Ping messages are handled by the heartbeat system
        return;
      }

      if (msg.type === "chat") {
        const chatRequest: ChatRequest = {
          conversationId: msg.payload.conversationId,
          content: msg.payload.content,
          context: msg.payload.context,
        };

        // Process chat via ChatSvc
        const effect = ChatSvc.pipe(
          Effect.flatMap((chatSvc) => chatSvc.processChat(userId, chatRequest)),
          Effect.provide(AppLayer)
        );

        Effect.runPromise(effect).catch((error) => {
          console.error("[WS Handler] Chat processing error:", error);
        });
      }
    })
    .catch((error) => {
      console.error("[WS Handler] Message parse error:", error);
    });
};
