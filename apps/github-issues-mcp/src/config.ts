import { Config } from "effect";

/** Server-level configuration. Platform config lives with its adapter, in `github-core`. */
export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3009)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});
