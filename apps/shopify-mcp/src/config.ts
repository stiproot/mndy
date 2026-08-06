import { Config } from "effect";

/** Server-level configuration. Platform config lives with its adapter, in `shopify-core`. */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3005)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});
