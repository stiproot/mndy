import type { ChatRequest, ChatResponse } from "../schemas/index.js";
import type { StreamEvent } from "../types/index.js";
import { AgentError } from "../types/index.js";
import { createChatAgent } from "../agents/index.js";
import { buildChatPrompt } from "../prompts/index.js";
import { createScopedLogger } from "../utils/logger.js";
import type { AgentMessage } from "cc-core";
import { randomUUID } from "crypto";

/**
 * Chat stream event types
 */
export interface ChatStreamEvent extends StreamEvent {
  type: "start" | "text" | "tool" | "error" | "complete";
}

export interface ChatStartEvent extends ChatStreamEvent {
  type: "start";
  data: {
    conversationId: string;
    messageId: string;
  };
}

export interface ChatTextEvent extends ChatStreamEvent {
  type: "text";
  data: {
    content: string;
    done: boolean;
  };
}

export interface ChatToolEvent extends ChatStreamEvent {
  type: "tool";
  data: {
    tool: string;
    input?: Record<string, unknown>;
  };
}

export interface ChatCompleteEvent extends ChatStreamEvent {
  type: "complete";
  data: ChatResponse;
}

export class ChatService {
  /**
   * Create an onMessage callback for debug logging
   */
  private createMessageLogger(agentName: string): (message: AgentMessage) => void {
    const logger = createScopedLogger(agentName);
    return (message: AgentMessage) => {
      if (message.type === "text") {
        logger.debug("Claude thinking", { content: message.content });
      } else if (message.type === "tool_use") {
        logger.debug("Tool call", { tool: message.toolName, input: message.toolInput });
      } else if (message.type === "tool_result") {
        logger.debug("Tool result", { content: message.content, isError: message.isError });
      }
    };
  }

  /**
   * Process a chat request (synchronous)
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const conversationId = request.conversationId ?? randomUUID();
    const messageId = randomUUID();

    const agent = createChatAgent();
    const prompt = buildChatPrompt(request.content, request.context);

    const result = await agent.execute(prompt, {
      onMessage: this.createMessageLogger("chat-agent"),
    });

    if (!result.success) {
      throw new AgentError(
        result.error ?? "Chat agent failed",
        "chat-agent"
      );
    }

    return {
      conversationId,
      messageId,
      role: "assistant",
      content: result.result,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Stream a chat response (SSE)
   */
  async *streamChat(request: ChatRequest): AsyncGenerator<ChatStreamEvent> {
    const startTime = Date.now();
    const conversationId = request.conversationId ?? randomUUID();
    const messageId = randomUUID();

    // Emit start event
    yield {
      type: "start",
      data: { conversationId, messageId },
    } as ChatStartEvent;

    const agent = createChatAgent();
    const prompt = buildChatPrompt(request.content, request.context);

    let fullResponse = "";

    try {
      for await (const message of agent.stream(prompt)) {
        if (message.type === "text") {
          fullResponse += message.content;
          yield {
            type: "text",
            data: { content: message.content, done: false },
          } as ChatTextEvent;
        } else if (message.type === "tool_use") {
          yield {
            type: "tool",
            data: {
              tool: message.toolName ?? "unknown",
              input: message.toolInput as Record<string, unknown> | undefined,
            },
          } as ChatToolEvent;
        }
      }

      // Signal text stream complete
      yield {
        type: "text",
        data: { content: "", done: true },
      } as ChatTextEvent;

      // Emit complete event with full response
      yield {
        type: "complete",
        data: {
          conversationId,
          messageId,
          role: "assistant",
          content: fullResponse,
          timestamp: new Date().toISOString(),
          metadata: {
            processingTimeMs: Date.now() - startTime,
          },
        },
      } as ChatCompleteEvent;
    } catch (error) {
      yield {
        type: "error",
        data: {
          message: error instanceof Error ? error.message : "Unknown error",
          code: "CHAT_ERROR",
        },
      };
      throw error;
    }
  }
}
