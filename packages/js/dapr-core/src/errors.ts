import { Data } from "effect";

/**
 * Error when invoking a Dapr actor method fails
 */
export class DaprActorError extends Data.TaggedError("DaprActorError")<{
  readonly message: string;
  readonly actorType?: string;
  readonly actorId?: string;
  readonly method?: string;
  readonly statusCode?: number;
  readonly cause?: unknown;
}> {}

/**
 * Error when a Dapr request times out
 */
export class DaprTimeoutError extends Data.TaggedError("DaprTimeoutError")<{
  readonly message: string;
  readonly duration: string;
  readonly actorType?: string;
  readonly actorId?: string;
}> {}

/**
 * Error when connecting to the Dapr sidecar fails
 */
export class DaprConnectionError extends Data.TaggedError("DaprConnectionError")<{
  readonly message: string;
  readonly host: string;
  readonly port: string;
  readonly cause?: unknown;
}> {}

/**
 * Error when state store operations fail
 */
export class DaprStateError extends Data.TaggedError("DaprStateError")<{
  readonly message: string;
  readonly storeName?: string;
  readonly key?: string;
  readonly statusCode?: number;
  readonly cause?: unknown;
}> {}

/**
 * Union type of all Dapr errors for exhaustive error handling
 */
export type DaprError = DaprActorError | DaprTimeoutError | DaprConnectionError | DaprStateError;
