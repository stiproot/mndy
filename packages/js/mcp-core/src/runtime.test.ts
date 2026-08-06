import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { createServerRuntime } from "./runtime.js";

let constructions = 0;

/**
 * A stand-in for a platform client, counting how many times it is constructed.
 * Constructing it exactly once per process is the whole point of the shared runtime.
 */
class CountingClient extends Effect.Service<CountingClient>()("CountingClient", {
  effect: Effect.sync(() => {
    constructions += 1;
    return { id: constructions };
  }),
}) {}

const useClient = Effect.gen(function* () {
  const client = yield* CountingClient;
  return client.id;
});

describe("createServerRuntime", () => {
  it("builds the service layer once, however many tools call it", async () => {
    constructions = 0;
    const runtime = createServerRuntime(CountingClient.Default);

    const ids: number[] = [];
    for (let i = 0; i < 5; i++) ids.push(await runtime.run(useClient));

    expect(constructions).toBe(1);
    // Every call saw the SAME instance, not five equivalent ones.
    expect(ids).toEqual([1, 1, 1, 1, 1]);

    await runtime.dispose();
  });

  it("documents the regression it exists to prevent", async () => {
    // This is what every tool handler used to do. Kept as an executable record of WHY the
    // runtime exists: the same five calls rebuild the client five times, discarding
    // connection pools and re-running auth on every single request.
    constructions = 0;

    for (let i = 0; i < 5; i++) {
      await Effect.runPromise(useClient.pipe(Effect.provide(CountingClient.Default)));
    }

    expect(constructions).toBe(5);
  });

  it("runs layer finalizers on dispose, which runPromise never did", async () => {
    let released = false;
    const layer = Layer.scopedDiscard(
      Effect.addFinalizer(() => Effect.sync(() => void (released = true))),
    );

    const runtime = createServerRuntime(layer);
    await runtime.run(Effect.succeed("ok"));
    expect(released).toBe(false);

    await runtime.dispose();
    expect(released).toBe(true);
  });
});
