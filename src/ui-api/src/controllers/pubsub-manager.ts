import { DaprClient } from "@dapr/dapr";
import { Configs } from "./consts";

const daprHost = process.env.DAPR_HOST || "http://localhost";
const daprPort = process.env.DAPR_HTTP_PORT || "3500";

const client = new DaprClient({ daprHost, daprPort });

export async function publishPubSubMsg(pubSubTopicName: string, data: any) {
  await client.pubsub.publish(Configs.DAPR_PUBSUB_NAME, pubSubTopicName, data);
}