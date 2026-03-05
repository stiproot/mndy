import { Config } from "effect";
import { CommunicationProtocolEnum } from "@dapr/dapr";

// Dapr configuration
export const DaprConfig = Config.all({
  daprHost: Config.string("DAPR_HOST").pipe(Config.withDefault("localhost")),
  daprHttpPort: Config.string("DAPR_HTTP_PORT").pipe(Config.withDefault("3500")),
  daprGrpcPort: Config.string("DAPR_GRPC_PORT").pipe(Config.withDefault("50001")),
  daprProtocol: Config.string("DAPR_PROTOCOL").pipe(
    Config.withDefault("http"),
    Config.map((p): CommunicationProtocolEnum =>
      p === "grpc" ? CommunicationProtocolEnum.GRPC : CommunicationProtocolEnum.HTTP
    )
  ),
});

// Okta configuration
// When IGNORE_AUTH=true, Okta credentials are optional (dev mode)
export const OktaConfig = Config.all({
  issuer: Config.string("OKTA_ISSUER").pipe(Config.withDefault("")),
  tokenUri: Config.string("OKTA_TOKEN_URI").pipe(Config.withDefault("")),
  clientId: Config.string("OKTA_CLIENT_ID").pipe(Config.withDefault("")),
  clientSecret: Config.string("OKTA_CLIENT_SECRET").pipe(Config.withDefault("")),
  redirectBaseUrl: Config.string("REDIRECT_BASE_URL").pipe(Config.withDefault("")),
  ignoreAuth: Config.string("IGNORE_AUTH").pipe(
    Config.withDefault("false"),
    Config.map((v) => v === "true")
  ),
});

// Computed redirect URI from base URL
export const OktaRedirectUri = OktaConfig.pipe(
  Config.map((config) => `${config.redirectBaseUrl}/authorization-code/callback`)
);

// Azure DevOps configuration
export const AzdoConfig = Config.all({
  organization: Config.string("AZDO_ORGANIZATION"),
  project: Config.string("AZDO_PROJECT"),
  apiKey: Config.string("AZDO_API_KEY"),
});

// Server configuration
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3001)),
  nodeEnv: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
});

// WebSocket configuration
export const WebSocketConfig = Config.all({
  wsPath: Config.string("WS_PATH").pipe(Config.withDefault("/ws")),
  heartbeatIntervalMs: Config.integer("WS_HEARTBEAT_INTERVAL_MS").pipe(
    Config.withDefault(30000)
  ),
  connectionTimeoutMs: Config.integer("WS_CONNECTION_TIMEOUT_MS").pipe(
    Config.withDefault(60000)
  ),
});

// Constants (moved from consts.ts)
export const Configs = {
  DAPR_PROJS_STATE_STORE_NAME: "statestore-projs",
  DAPR_AZDO_STATE_STORE_NAME: "statestore-azdo",
  DAPR_USRS_STATE_STORE_NAME: "statestore-usrs",
  DAPR_PROCS_STATE_STORE_NAME: "statestore-procs",
  DAPR_STRUCTS_STATE_STORE_NAME: "statestore-structs",
  DAPR_PUBSUB_NAME: "pubsub",
  DAPR_CMD_WORKFLOW_PUBSUB_NAME: "pubsub-cmd-workflow",
  DAPR_CMD_RECEIPT_PUBSUB_NAME: "pubsub-cmd-receipt",
  GATHER_TOPIC: "MNDY_CMD_GATHER",
  STRUCTURE_TOPIC: "MNDY_CMD_STRUCTURE",
  AZDO_PROXY_TOPIC: "MNDY_CMD_AZDO_PROXY",
  WORKFLOW_TOPIC: "MNDY_CMD_WORKFLOW",
  GATHER_RECEIPT_TOPIC: "MNDY_CMD_GATHER_RECEIPT",
  STRUCTURE_RECEIPT_TOPIC: "MNDY_CMD_STRUCTURE_RECEIPT",
  AZDO_PROXY_RECEIPT_TOPIC: "MNDY_CMD_AZDO_PROXY_RECEIPT",
  // WebSocket / Subscription
  CLIENT_UPDATE_TOPIC: "MNDY_CLIENT_UPDATE",
  DAPR_CLIENT_UPDATE_PUBSUB_NAME: "pubsub-client-update",
  DAPR_SUBSCRIPTION_ROUTE: "/dapr/subscribe/client-update",
} as const;

export enum CmdTypes {
  GATHER_PROJECT_UNITS_OF_WORK = "GATHER_PROJECT_UNITS_OF_WORK",
  BUILD_UNIT_OF_WORK_TREE = "BUILD_UNIT_OF_WORK_TREE",
  CLONE_UNIT_OF_WORK = "CLONE_UNIT_OF_WORK",
  BULK_CREATE_UNITS_OF_WORK = "BULK_CREATE_UNITS_OF_WORK",
  CREATE_DASHBOARD = "CREATE_DASHBOARD",
  PERSIST_TO_STORE = "PERSIST_TO_STORE",
  UPDATE_UNIT_OF_WORK = "UPDATE_UNIT_OF_WORK",
  UPDATE_UNIT_OF_WORK_HIERARCHY = "UPDATE_UNIT_OF_WORK_HIERARCHY",
  BUILD_WORKFLOW = "BUILD_WORKFLOW",
}

export const PartitionKeys = {
  PROJS: "projs",
} as const;
