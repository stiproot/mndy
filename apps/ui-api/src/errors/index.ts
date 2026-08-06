import { Data } from "effect";

// Dapr Errors
export class DaprStateError extends Data.TaggedError("DaprStateError")<{
  readonly message: string;
  readonly storeName?: string;
  readonly key?: string;
  readonly cause?: unknown;
}> {}

export class DaprPubSubError extends Data.TaggedError("DaprPubSubError")<{
  readonly message: string;
  readonly pubsubName?: string;
  readonly topicName?: string;
  readonly cause?: unknown;
}> {}

// HTTP Errors
export class HttpRequestError extends Data.TaggedError("HttpRequestError")<{
  readonly message: string;
  readonly url: string;
  readonly method: string;
  readonly cause?: unknown;
}> {}

export class HttpResponseError extends Data.TaggedError("HttpResponseError")<{
  readonly message: string;
  readonly status: number;
  readonly url?: string;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly duration: string;
}> {}

// Auth Errors
export class OktaValidationError extends Data.TaggedError("OktaValidationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class OktaTokenExchangeError extends Data.TaggedError("OktaTokenExchangeError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class OktaTokenRefreshError extends Data.TaggedError("OktaTokenRefreshError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
  readonly reason?: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly message: string;
  readonly reason?: string;
}> {}

// AzDO Errors
export class AzdoApiError extends Data.TaggedError("AzdoApiError")<{
  readonly message: string;
  readonly workItemId?: string;
  readonly cause?: unknown;
}> {}

// Compression Errors
export class DecompressionError extends Data.TaggedError("DecompressionError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Handler Errors (used at boundary)
export class HandlerError extends Data.TaggedError("HandlerError")<{
  readonly message: string;
  readonly status: number;
  readonly cause?: unknown;
}> {}

// WebSocket Errors
export class WebSocketError extends Data.TaggedError("WebSocketError")<{
  readonly message: string;
  readonly userId?: string;
  readonly cause?: unknown;
}> {}

export class WebSocketConnectionError extends Data.TaggedError(
  "WebSocketConnectionError"
)<{
  readonly message: string;
  readonly reason: "auth_failed" | "connection_closed" | "timeout";
  readonly userId?: string;
}> {}

export class WebSocketSendError extends Data.TaggedError("WebSocketSendError")<{
  readonly message: string;
  readonly userId: string;
  readonly cause?: unknown;
}> {}

// Dapr Subscription Errors
export class DaprSubscriptionError extends Data.TaggedError(
  "DaprSubscriptionError"
)<{
  readonly message: string;
  readonly topic?: string;
  readonly cause?: unknown;
}> {}

// Chat Errors
export class ChatError extends Data.TaggedError("ChatError")<{
  readonly message: string;
  readonly conversationId?: string;
  readonly cause?: unknown;
}> {}

export class CcSvcError extends Data.TaggedError("CcSvcError")<{
  readonly message: string;
  readonly endpoint?: string;
  readonly cause?: unknown;
}> {}

// Label Errors
export class LabelError extends Data.TaggedError("LabelError")<{
  readonly message: string;
  readonly labelId?: string;
  readonly cause?: unknown;
}> {}
