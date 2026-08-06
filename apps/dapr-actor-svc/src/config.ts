import { Config } from "effect";

/**
 * Server configuration using Effect Config module.
 */
export const ServerConfig = Config.all({
  /** Server port (default: 3007) */
  port: Config.integer("PORT").pipe(Config.withDefault(3007)),

  /** Log level (default: info) */
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),

  /** Dapr sidecar host (default: localhost) */
  daprHost: Config.string("DAPR_HOST").pipe(Config.withDefault("localhost")),

  /** Dapr HTTP port (default: 3500) */
  daprHttpPort: Config.string("DAPR_HTTP_PORT").pipe(Config.withDefault("3500")),
});

export type ServerConfigType = Config.Config.Success<typeof ServerConfig>;
