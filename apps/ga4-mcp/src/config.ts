import { Config } from "effect";

/** Server-level configuration. Platform config lives with its adapter, in `ga4-core`. */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3003)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});
