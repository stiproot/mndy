/**
 * One runtime per server process, shared by every tool call.
 *
 * The pattern this replaces looked reasonable and was not:
 *
 *   (args) => Effect.runPromise(toolEffect(args).pipe(Effect.provide(Service.Default)))
 *
 * `Effect.provide` builds the layer as part of *executing* that effect, and `runPromise`
 * creates a fresh runtime each time — so every single tool invocation constructed a brand
 * new platform client (a new `BetaAnalyticsDataClient`, a new Octokit, a new Shopify
 * session), discarding connection pools and re-reading credentials on every request.
 *
 * `ManagedRuntime` builds the layer ONCE at the composition root. Tool handlers then run
 * against that live runtime, so the client is created at startup and reused. It also gives
 * the process a real shutdown path: `dispose()` runs every layer finalizer, which
 * `runPromise` never did.
 */

import { Effect, Layer, ManagedRuntime } from "effect";

/**
 * Runs a tool's effect against the server's shared runtime.
 *
 * The effect must have handled its own errors — a tool returns an error *result* to the
 * agent rather than failing, so the error channel is `never` by the time it gets here.
 */
export interface ToolRunner<R> {
  <A>(effect: Effect.Effect<A, never, R>): Promise<A>;
}

export interface ServerRuntime<R> {
  /** Pass this to each `register*Tool` call. */
  readonly run: ToolRunner<R>;
  /** Run an effect during startup, before the HTTP server is listening. */
  readonly runStartup: <A, E>(effect: Effect.Effect<A, E, R>) => Promise<A>;
  /** Release every layer finalizer. Call on SIGINT/SIGTERM. */
  readonly dispose: () => Promise<void>;
}

/**
 * Build the server's runtime from its composed layer.
 *
 * Call this once, in `src/index.ts`. Nothing else in the app should reference a Layer.
 */
export const createServerRuntime = <R, E>(
  layer: Layer.Layer<R, E, never>,
): ServerRuntime<R> => {
  const runtime = ManagedRuntime.make(layer);

  return {
    run: (effect) => runtime.runPromise(effect),
    runStartup: (effect) => runtime.runPromise(effect),
    dispose: () => runtime.dispose(),
  };
};
