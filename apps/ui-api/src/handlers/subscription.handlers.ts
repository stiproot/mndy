import { Effect } from "effect";
import { Request, Response } from "express";
import { DaprSubscriptionSvc, AppLayer } from "../svc";

// Handle Dapr subscription callback for client updates
export const handleClientUpdateSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  const cloudEvent = req.body;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Received Dapr subscription callback", {
      id: cloudEvent?.id,
      topic: cloudEvent?.topic,
    });

    const subscriptionSvc = yield* DaprSubscriptionSvc;
    yield* subscriptionSvc.handleClientUpdate(cloudEvent);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then(() => {
      // Dapr expects specific response format:
      // - 200 with SUCCESS: message processed successfully
      // - 200 with DROP: message should be dropped (not retried)
      // - 404: message should be dropped
      // - 500+: message should be retried
      res.status(200).json({ status: "SUCCESS" });
    })
    .catch((error: unknown) => {
      console.error("Subscription handler error:", error);
      // Return 200 with DROP to acknowledge without retry
      // Log error for investigation but don't block the queue
      res.status(200).json({ status: "DROP" });
    });
};

// Dapr programmatic subscription discovery endpoint
// Dapr calls GET /dapr/subscribe to discover subscriptions
export const getDaprSubscriptions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const effect = Effect.gen(function* () {
    const subscriptionSvc = yield* DaprSubscriptionSvc;
    return [subscriptionSvc.getSubscriptionConfig()];
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((subscriptions) => {
      res.status(200).json(subscriptions);
    })
    .catch((error: unknown) => {
      console.error("Failed to get subscriptions:", error);
      res.status(500).json({ error: "Failed to get subscriptions" });
    });
};
