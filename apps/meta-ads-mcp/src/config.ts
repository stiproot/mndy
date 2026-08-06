import { Config } from "effect";

/** Server-level configuration. Platform config lives with its adapter, in `meta-ads-core`. */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3004)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});
