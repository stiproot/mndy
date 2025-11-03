import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr";
import { HttpClient } from "./http-client";
require("dotenv").config();

const communicationProtocol = (process.env.DAPR_PROTOCOL === "grpc")
    ? CommunicationProtocolEnum.GRPC
    : CommunicationProtocolEnum.HTTP

const daprHost = process.env.DAPR_HOST ?? "localhost"

let daprPort: string | undefined;
switch (communicationProtocol) {
    case CommunicationProtocolEnum.HTTP: {
        daprPort = process.env.DAPR_HTTP_PORT
        break
    }
    case CommunicationProtocolEnum.GRPC: {
        daprPort = process.env.DAPR_GRPC_PORT
        break
    }
    default: {
        daprPort = "3500";
    }
}

const daprClient = new DaprClient({ daprHost, daprPort, communicationProtocol });
const httpClient = new HttpClient(`http://${daprHost}:${daprPort}/`);

export async function getState(stateStoreName: string, key: string, options = {}) {
    const data = await daprClient.state.get(stateStoreName, key, options);
    return data;
}

export async function saveState(stateStoreName: string, state: any, options = {}) {
    await daprClient.state.save(stateStoreName, state, options);
    console.log("State saved: ", state);
}

export async function deleteState(stateStoreName: string, key: string, options = {}) {
    await daprClient.state.delete(stateStoreName, key);
    console.log("State deleted: ", key);
}

export async function queryState(stateStoreName: string, query: any, options = {}) {
    const data = await daprClient.state.query(stateStoreName, query);
    return data;
}

export async function getActorState(actorType: string, actorId: string, actorMethod: string) {
    const route = `v1.0/actors/${actorType}/${actorId}/method/${actorMethod}`;
    const res = await httpClient.post(route, {})
    return res;
}
