import { Effect, Duration, Layer } from "effect";
import { CcSvcConfig, Configs } from "../config";
import {
  ChatError,
  CcSvcError,
  HttpRequestError,
  TimeoutError,
} from "../errors";
import { DaprStateSvc } from "./dapr-state.svc";
import { HttpClientSvc } from "./http-client.svc";
import { WebSocketSvc } from "./websocket.svc";

// Chat types (matching UI types)
export interface IChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  labels: string[];
  metadata?: {
    model?: string;
    tokens?: number;
    processingTimeMs?: number;
  };
}

export interface IChatConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  labels: string[];
}

export interface ChatRequest {
  conversationId?: string;
  content: string;
  context?: IChatMessage[];
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTimeMs?: number;
  };
}

// SSE event types
interface SseChunkEvent {
  type: "chunk";
  content: string;
}

interface SseCompleteEvent {
  type: "complete";
  messageId: string;
  model?: string;
  tokens?: number;
}

interface SseErrorEvent {
  type: "error";
  error: string;
}

type SseEvent = SseChunkEvent | SseCompleteEvent | SseErrorEvent;

// Stream processing callbacks type
interface StreamCallbacks {
  onChunk: (content: string) => void;
  onComplete: (data: { messageId: string; model?: string; tokens?: number }) => void;
  onError: (error: string) => void;
}

// Safe JSON parse that returns null on invalid input
function safeJsonParse<T>(str: string): T | null {
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[") && !trimmed.startsWith("\"")) {
    return null;
  }
  return JSON.parse(str) as T;
}

// Parse a single SSE line
function parseSseLine(line: string): SseEvent | null {
  if (!line.startsWith("data: ")) {
    return null;
  }
  const jsonStr = line.slice(6);
  if (jsonStr === "[DONE]") {
    return null;
  }
  return safeJsonParse<SseEvent>(jsonStr);
}

// Process SSE stream - plain function using promise chains
function processSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  callbacks: StreamCallbacks,
  abortController: AbortController
): void {
  let buffer = "";
  let fullContent = "";

  const processChunk = (result: ReadableStreamReadResult<Uint8Array>): void => {
    if (result.done) {
      if (fullContent) {
        callbacks.onComplete({ messageId: "unknown" });
      }
      return;
    }

    buffer += decoder.decode(result.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;

      let event: SseEvent | null = null;
      Promise.resolve().then(() => {
        event = parseSseLine(trimmed);
        return event;
      }).then((e) => {
        if (!e) return;
        if (e.type === "chunk") {
          fullContent += e.content;
          callbacks.onChunk(e.content);
        } else if (e.type === "complete") {
          callbacks.onComplete({ messageId: e.messageId, model: e.model, tokens: e.tokens });
          abortController.abort();
        } else if (e.type === "error") {
          callbacks.onError(e.error);
          abortController.abort();
        }
      }).catch(() => { /* skip invalid JSON */ });
    }

    reader.read().then(processChunk).catch((err) => {
      if (err.name !== "AbortError") callbacks.onError(String(err));
    });
  };

  reader.read().then(processChunk).catch((err) => {
    if (err.name !== "AbortError") callbacks.onError(String(err));
  });
}

// Helper to make fetch request - returns Effect
const makeFetchRequest = (
  url: string,
  body: unknown
): Effect.Effect<Response, HttpRequestError> =>
  Effect.async<Response, HttpRequestError>((resume) => {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body),
    })
      .then((response) => resume(Effect.succeed(response)))
      .catch((error) =>
        resume(
          Effect.fail(
            new HttpRequestError({
              message: "Failed to connect to cc-svc",
              url,
              method: "POST",
              cause: error,
            })
          )
        )
      );
  });

// Build the ChatSvc layer manually to avoid yield* + tryPromise combination
export class ChatSvc extends Effect.Service<ChatSvc>()("ChatSvc", {
  effect: Effect.all([CcSvcConfig, DaprStateSvc, HttpClientSvc, WebSocketSvc]).pipe(
    Effect.map(([config, stateSvc, httpClientSvc, wsSvc]) => {
      const ccSvcUrl = `${config.baseUrl}${config.chatEndpoint}`;
      const timeoutMs = config.timeoutMs;

      return {
        getConversation: (
          conversationId: string
        ): Effect.Effect<IChatConversation | null, ChatError> =>
          stateSvc
            .getState<IChatConversation>(
              Configs.DAPR_CHAT_STATE_STORE_NAME,
              `conversation:${conversationId}`
            )
            .pipe(
              Effect.catchTag("DaprStateError", () => Effect.succeed(null)),
              Effect.withSpan("ChatSvc.getConversation", { attributes: { conversationId } })
            ),

        getMessages: (conversationId: string): Effect.Effect<IChatMessage[], ChatError> =>
          stateSvc
            .getState<IChatMessage[]>(
              Configs.DAPR_CHAT_STATE_STORE_NAME,
              `messages:${conversationId}`
            )
            .pipe(
              Effect.catchTag("DaprStateError", () => Effect.succeed([])),
              Effect.withSpan("ChatSvc.getMessages", { attributes: { conversationId } })
            ),

        listConversations: (userId: string): Effect.Effect<IChatConversation[], ChatError> =>
          stateSvc
            .queryState<{ results: Array<{ data: IChatConversation }> }>(
              Configs.DAPR_CHAT_STATE_STORE_NAME,
              { filter: { EQ: { userId } }, sort: [{ key: "updatedAt", order: "DESC" }] }
            )
            .pipe(
              Effect.map((resp) => resp.results.map((r) => r.data)),
              Effect.catchTag("DaprStateError", (err) =>
                Effect.fail(new ChatError({ message: "Failed to list conversations", cause: err }))
              ),
              Effect.withSpan("ChatSvc.listConversations", { attributes: { userId } })
            ),

        saveConversation: (conversation: IChatConversation): Effect.Effect<void, ChatError> =>
          stateSvc
            .saveState<IChatConversation>(Configs.DAPR_CHAT_STATE_STORE_NAME, [
              { key: `conversation:${conversation.id}`, value: conversation },
            ])
            .pipe(
              Effect.catchTag("DaprStateError", (err) =>
                Effect.fail(
                  new ChatError({
                    message: "Failed to save conversation",
                    conversationId: conversation.id,
                    cause: err,
                  })
                )
              ),
              Effect.withSpan("ChatSvc.saveConversation", {
                attributes: { conversationId: conversation.id },
              })
            ),

        saveMessages: (
          conversationId: string,
          messages: IChatMessage[]
        ): Effect.Effect<void, ChatError> =>
          stateSvc
            .saveState<IChatMessage[]>(Configs.DAPR_CHAT_STATE_STORE_NAME, [
              { key: `messages:${conversationId}`, value: messages },
            ])
            .pipe(
              Effect.catchTag("DaprStateError", (err) =>
                Effect.fail(
                  new ChatError({ message: "Failed to save messages", conversationId, cause: err })
                )
              ),
              Effect.withSpan("ChatSvc.saveMessages", {
                attributes: { conversationId, count: messages.length },
              })
            ),

        processChat: (
          userId: string,
          request: ChatRequest
        ): Effect.Effect<void, ChatError | CcSvcError | HttpRequestError | TimeoutError> => {
          const conversationId = request.conversationId || crypto.randomUUID();
          const messageId = crypto.randomUUID();
          const startTime = Date.now();

          return Effect.logInfo("Processing chat request", {
            userId,
            conversationId,
            contentLength: request.content.length,
          }).pipe(
            Effect.flatMap(() =>
              wsSvc
                .sendToUser(userId, {
                  type: "chat_start",
                  data: { conversationId, messageId },
                  timestamp: new Date().toISOString(),
                })
                .pipe(Effect.catchAll(() => Effect.void))
            ),
            Effect.flatMap(() =>
              makeFetchRequest(ccSvcUrl, {
                conversationId,
                content: request.content,
                context: request.context || [],
              })
            ),
            Effect.flatMap((response) => {
              if (!response.ok) {
                return Effect.fail(
                  new CcSvcError({ message: `cc-svc returned ${response.status}`, endpoint: ccSvcUrl })
                );
              }
              if (!response.body) {
                return Effect.fail(
                  new CcSvcError({ message: "No response body from cc-svc", endpoint: ccSvcUrl })
                );
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              const abortController = new AbortController();
              let fullContent = "";

              const callbacks: StreamCallbacks = {
                onChunk: (content) => {
                  fullContent += content;
                  Effect.runPromise(
                    wsSvc
                      .sendToUser(userId, {
                        type: "chat_chunk",
                        data: { conversationId, messageId, content },
                        timestamp: new Date().toISOString(),
                      })
                      .pipe(Effect.catchAll(() => Effect.void))
                  );
                },
                onComplete: (data) => {
                  Effect.runPromise(
                    wsSvc
                      .sendToUser(userId, {
                        type: "chat_complete",
                        data: {
                          conversationId,
                          message: {
                            id: messageId,
                            conversationId,
                            role: "assistant" as const,
                            content: fullContent,
                            timestamp: new Date().toISOString(),
                            labels: [],
                            metadata: {
                              model: data.model,
                              tokens: data.tokens,
                              processingTimeMs: Date.now() - startTime,
                            },
                          },
                        },
                        timestamp: new Date().toISOString(),
                      })
                      .pipe(Effect.catchAll(() => Effect.void))
                  );
                },
                onError: (error) => {
                  Effect.runPromise(
                    wsSvc
                      .sendToUser(userId, {
                        type: "chat_error",
                        data: { conversationId, error },
                        timestamp: new Date().toISOString(),
                      })
                      .pipe(Effect.catchAll(() => Effect.void))
                  );
                },
              };

              processSseStream(reader, decoder, callbacks, abortController);

              return Effect.logInfo("Chat request initiated", { userId, conversationId, messageId });
            }),
            Effect.timeoutFail({
              duration: Duration.millis(timeoutMs),
              onTimeout: () =>
                new TimeoutError({ message: "Chat request timed out", duration: `${timeoutMs}ms` }),
            }),
            Effect.withSpan("ChatSvc.processChat", { attributes: { userId } })
          );
        },

        chat: (
          userId: string,
          request: ChatRequest
        ): Effect.Effect<ChatResponse, ChatError | CcSvcError | HttpRequestError | TimeoutError> =>
          httpClientSvc
            .post<ChatResponse, ChatRequest>(config.baseUrl, config.chatEndpoint, request)
            .pipe(
              Effect.mapError(
                (error) =>
                  new CcSvcError({ message: "Chat request failed", endpoint: ccSvcUrl, cause: error })
              ),
              Effect.withSpan("ChatSvc.chat", { attributes: { userId } })
            ),
      };
    })
  ),
  dependencies: [DaprStateSvc.Default, HttpClientSvc.Default, WebSocketSvc.Default],
}) {}
