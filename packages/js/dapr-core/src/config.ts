import { Config } from "effect";

/**
 * Dapr sidecar configuration using Effect Config module.
 * Environment variables are loaded with sensible defaults.
 */
export const DaprConfig = Config.all({
  /** Dapr sidecar host (default: localhost) */
  daprHost: Config.string("DAPR_HOST").pipe(Config.withDefault("localhost")),

  /** Dapr HTTP port (default: 3500) */
  daprHttpPort: Config.string("DAPR_HTTP_PORT").pipe(Config.withDefault("3500")),

  /** Dapr gRPC port (default: 50001) */
  daprGrpcPort: Config.string("DAPR_GRPC_PORT").pipe(Config.withDefault("50001")),
});

export type DaprConfigType = Config.Config.Success<typeof DaprConfig>;
