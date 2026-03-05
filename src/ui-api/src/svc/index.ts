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
export { WebSocketSvc } from "./websocket.svc";
export {
  DaprSubscriptionSvc,
  type DaprSubscriptionConfig,
} from "./dapr-subscription.svc";

// Import services for layer composition
import { HttpClientSvc } from "./http-client.svc";
import { DaprStateSvc } from "./dapr-state.svc";
import { DaprPubSubSvc } from "./dapr-pubsub.svc";
import { OktaAuthSvc } from "./okta-auth.svc";
import { AzdoClientSvc } from "./azdo-client.svc";
import { WebSocketSvc } from "./websocket.svc";
import { DaprSubscriptionSvc } from "./dapr-subscription.svc";

// AppLayer combines all service defaults for convenience
// This layer provides all dependencies needed to run handlers
export const AppLayer = Layer.mergeAll(
  HttpClientSvc.Default,
  DaprStateSvc.Default,
  DaprPubSubSvc.Default,
  OktaAuthSvc.Default,
  AzdoClientSvc.Default,
  WebSocketSvc.Default,
  DaprSubscriptionSvc.Default
);
