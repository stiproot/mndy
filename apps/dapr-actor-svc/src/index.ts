import "dotenv/config";
import { DaprServer } from "@dapr/dapr";
import { Config, Effect } from "effect";
import {
  BrandInsightsActor,
  GA4DataActor,
  ShopifyDataActor,
} from "./actors/index.js";
import { ServerConfig } from "./config.js";

/**
 * dapr-actor-svc - Dedicated service for hosting Dapr actors.
 *
 * This service registers and hosts all shared actors (BrandInsightsActor, etc.)
 * with the Dapr runtime. Other services invoke actors through Dapr's actor API.
 */
const main = Effect.gen(function* () {
  const config = yield* Config.unwrap(ServerConfig);

  const server = new DaprServer({
    serverHost: "0.0.0.0",
    serverPort: String(config.port),
    clientOptions: {
      daprHost: config.daprHost,
      daprPort: config.daprHttpPort,
    },
  });

  // Register actors
  yield* Effect.promise(() => server.actor.registerActor(BrandInsightsActor));
  yield* Effect.promise(() => server.actor.registerActor(GA4DataActor));
  yield* Effect.promise(() => server.actor.registerActor(ShopifyDataActor));

  // Initialize actor routes (must be called before start)
  yield* Effect.promise(() => server.actor.init());

  // Start the server
  yield* Effect.promise(() => server.start());

  console.log(`[dapr-actor-svc] Running on port ${config.port}`);
  console.log(`[dapr-actor-svc] Dapr sidecar: ${config.daprHost}:${config.daprHttpPort}`);
  console.log(`[dapr-actor-svc] Registered actors: BrandInsightsActor, GA4DataActor, ShopifyDataActor`);
});

Effect.runPromise(main).catch((err) => {
  console.error("[dapr-actor-svc] Failed to start:", err);
  process.exit(1);
});
