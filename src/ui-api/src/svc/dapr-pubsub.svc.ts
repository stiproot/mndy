import { Effect } from "effect";
import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr";
import { DaprConfig, Configs } from "../config";
import { DaprPubSubError } from "../errors";

export class DaprPubSubSvc extends Effect.Service<DaprPubSubSvc>()("DaprPubSubSvc", {
  effect: Effect.gen(function* () {
    const config = yield* DaprConfig;

    const daprPort =
      config.daprProtocol === CommunicationProtocolEnum.GRPC
        ? config.daprGrpcPort
        : config.daprHttpPort;

    const daprClient = new DaprClient({
      daprHost: config.daprHost,
      daprPort,
      communicationProtocol: config.daprProtocol,
    });

    return {
      publish: <T extends object>(
        topicName: string,
        data: T,
        pubsubName: string = Configs.DAPR_PUBSUB_NAME
      ): Effect.Effect<void, DaprPubSubError> =>
        Effect.tryPromise({
          try: () => daprClient.pubsub.publish(pubsubName, topicName, data as object),
          catch: (error) =>
            new DaprPubSubError({
              message: "Failed to publish message",
              pubsubName,
              topicName,
              cause: error,
            }),
        }).pipe(
          Effect.tap(() =>
            Effect.logInfo("Message published", { pubsubName, topicName })
          ),
          Effect.withSpan("DaprPubSubSvc.publish", {
            attributes: { pubsubName, topicName },
          })
        ),
    };
  }),
}) {}
