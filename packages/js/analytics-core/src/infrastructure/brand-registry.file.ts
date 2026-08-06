/**
 * Filesystem adapter for the brand registry.
 *
 * The lookup order is the contract documented in the `brands` skill; it lives here because
 * "where the file is" is an infrastructure concern the domain must not know about.
 */

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Data, Effect, Option, Schema } from "effect";
import { BrandRegistrySchema, type BrandRegistry } from "../domain/brands.js";

export class BrandRegistryNotFoundError extends Data.TaggedError(
  "BrandRegistryNotFoundError",
)<{
  readonly searched: readonly string[];
}> {
  get message(): string {
    return (
      `No brand registry found. Looked in: ${this.searched.join(", ")}. ` +
      "Copy mndy-brands.example.json (shipped with the `brands` skill) to one of these."
    );
  }
}

export class BrandRegistryInvalidError extends Data.TaggedError(
  "BrandRegistryInvalidError",
)<{
  readonly path: string;
  readonly detail: string;
}> {
  get message(): string {
    return `Brand registry at ${this.path} is not valid: ${this.detail}`;
  }
}

/**
 * Candidate paths, in the documented precedence order:
 * `MNDY_BRANDS_FILE`, then `./mndy-brands.json`, then `~/.mndy/brands.json`.
 */
export const registrySearchPaths = (
  env: Readonly<Record<string, string | undefined>> = process.env,
  cwd: string = process.cwd(),
): readonly string[] => {
  const explicit = env.MNDY_BRANDS_FILE;
  return [
    ...(explicit ? [explicit] : []),
    join(cwd, "mndy-brands.json"),
    join(homedir(), ".mndy", "brands.json"),
  ];
};

const decodeRegistry = Schema.decodeUnknown(BrandRegistrySchema);

/** Read a file, treating "not there" as an empty Option rather than a failure. */
const readIfPresent = (path: string): Effect.Effect<Option.Option<string>> =>
  Effect.tryPromise({
    try: () => readFile(path, "utf8"),
    catch: () => new Error("unreadable"),
  }).pipe(
    Effect.map((contents) => Option.some(contents)),
    Effect.catchAll(() => Effect.succeed(Option.none<string>())),
  );

/** Parse and validate one registry file's contents. */
const parseRegistry = (
  path: string,
  contents: string,
): Effect.Effect<BrandRegistry, BrandRegistryInvalidError> =>
  Effect.try({
    try: () => JSON.parse(contents) as unknown,
    catch: (cause) =>
      new BrandRegistryInvalidError({
        path,
        detail: cause instanceof Error ? cause.message : "not valid JSON",
      }),
  }).pipe(
    Effect.flatMap((parsed) =>
      decodeRegistry(parsed).pipe(
        Effect.mapError(
          (cause) => new BrandRegistryInvalidError({ path, detail: String(cause) }),
        ),
      ),
    ),
  );

/**
 * Load the first registry that exists, validated against the schema.
 *
 * A file that exists but is malformed FAILS rather than falling through to the next
 * candidate: silently skipping a broken registry would answer with a different brand's
 * numbers than the user configured, which is precisely the failure mode the registry exists
 * to prevent.
 */
export const loadBrandRegistry = (
  paths: readonly string[] = registrySearchPaths(),
): Effect.Effect<BrandRegistry, BrandRegistryNotFoundError | BrandRegistryInvalidError> =>
  Effect.reduce(
    paths,
    Option.none<BrandRegistry>(),
    (found, path) =>
      Option.isSome(found)
        ? Effect.succeed(found)
        : readIfPresent(path).pipe(
            Effect.flatMap(
              Option.match({
                onNone: () => Effect.succeed(Option.none<BrandRegistry>()),
                onSome: (contents) =>
                  parseRegistry(path, contents).pipe(Effect.map(Option.some)),
              }),
            ),
          ),
  ).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.fail(new BrandRegistryNotFoundError({ searched: paths })),
        onSome: (registry) => Effect.succeed(registry),
      }),
    ),
  );
