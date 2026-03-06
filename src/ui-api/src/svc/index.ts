import { Layer } from "effect";

// Re-export all services
export { HttpClientSvc } from "./http-client.svc";
export {
  DaprStateSvc,
  type StateItem,
  type StateStoreMetadata,
} from "./dapr-state.svc";
export { DaprPubSubSvc } from "./dapr-pubsub.svc";
export {
  OktaAuthSvc,
  type TokenExchangeResponse,
  type UserData,
  type DevTokenResponse,
} from "./okta-auth.svc";
export { AzdoClientSvc } from "./azdo-client.svc";
export { WebSocketSvc, setWebSocketMessageHandler } from "./websocket.svc";
export {
  DaprSubscriptionSvc,
  type DaprSubscriptionConfig,
} from "./dapr-subscription.svc";
export {
  ChatSvc,
  type IChatMessage,
  type IChatConversation,
  type ChatRequest,
  type ChatResponse,
} from "./chat.svc";
export { LabelsSvc, type ILabel } from "./labels.svc";

// Import services for layer composition
import { HttpClientSvc } from "./http-client.svc";
import { DaprStateSvc } from "./dapr-state.svc";
import { DaprPubSubSvc } from "./dapr-pubsub.svc";
import { OktaAuthSvc } from "./okta-auth.svc";
import { AzdoClientSvc } from "./azdo-client.svc";
import { WebSocketSvc } from "./websocket.svc";
import { DaprSubscriptionSvc } from "./dapr-subscription.svc";
import { ChatSvc } from "./chat.svc";
import { LabelsSvc } from "./labels.svc";

// AppLayer combines all service defaults for convenience
// This layer provides all dependencies needed to run handlers
export const AppLayer = Layer.mergeAll(
  HttpClientSvc.Default,
  DaprStateSvc.Default,
  DaprPubSubSvc.Default,
  OktaAuthSvc.Default,
  AzdoClientSvc.Default,
  WebSocketSvc.Default,
  DaprSubscriptionSvc.Default,
  ChatSvc.Default,
  LabelsSvc.Default
);
