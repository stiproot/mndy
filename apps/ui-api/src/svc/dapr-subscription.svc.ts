import { Effect, Schema } from "effect";
import { Configs } from "../config";
import { DaprSubscriptionError } from "../errors";
import { WebSocketSvc } from "./websocket.svc";
import { CloudEventSchema, OutboundMessage } from "../types";

export interface DaprSubscriptionConfig {
  pubsubname: string;
  topic: string;
  route: string;
}

export class DaprSubscriptionSvc extends Effect.Service<DaprSubscriptionSvc>()(
  "DaprSubscriptionSvc",
  {
    effect: Effect.gen(function* () {
      const webSocketSvc = yield* WebSocketSvc;

      return {
        // Handle incoming pub/sub message from Dapr
        handleClientUpdate: (
          cloudEvent: unknown
        ): Effect.Effect<void, DaprSubscriptionError> =>
          Effect.gen(function* () {
            // Parse and validate the CloudEvent
            const event = yield* Schema.decodeUnknown(CloudEventSchema)(
              cloudEvent
            ).pipe(
              Effect.mapError(
                (error) =>
                  new DaprSubscriptionError({
                    message: "Invalid CloudEvent format",
                    topic: Configs.CLIENT_UPDATE_TOPIC,
                    cause: error,
                  })
              )
            );

            const { user_id, message_type, payload, timestamp } = event.data;

            yield* Effect.logInfo("Received client update", {
              userId: user_id,
              messageType: message_type,
            });

            // Create outbound message
            const outboundMessage: OutboundMessage = {
              type: message_type,
              data: payload,
              timestamp: timestamp || new Date().toISOString(),
            };

            // Route to WebSocket client
            yield* webSocketSvc.sendToUser(user_id, outboundMessage).pipe(
              Effect.catchTag("WebSocketSendError", (error) => {
                return Effect.logWarning(
                  "Failed to send to WebSocket client",
                  {
                    userId: user_id,
                    error: error.message,
                  }
                );
              })
            );
          }).pipe(Effect.withSpan("DaprSubscriptionSvc.handleClientUpdate")),

        // Get subscription configuration for Dapr programmatic subscription
        getSubscriptionConfig: (): DaprSubscriptionConfig => ({
          pubsubname: Configs.DAPR_CLIENT_UPDATE_PUBSUB_NAME,
          topic: Configs.CLIENT_UPDATE_TOPIC,
          route: Configs.DAPR_SUBSCRIPTION_ROUTE,
        }),
      };
    }),
    dependencies: [WebSocketSvc.Default],
  }
) {}
