/**
 * The brand registry: which account each platform should target for a given brand.
 *
 * A brand is a set of *account identifiers*, not credentials. One running server serves
 * every brand its credentials can reach, because targeting is a per-call parameter rather
 * than server state — see `.claude/rules/marketing-analytics.md`. This module models the
 * registry and resolves a brand from it; reading the file is `infrastructure`'s job.
 */

import { Data, Schema } from "effect";

/** One brand's account identifiers across the platforms. */
export const BrandSchema = Schema.Struct({
  label: Schema.String.annotations({ description: "Human-readable brand name" }),
  ga4PropertyId: Schema.optional(Schema.String).annotations({
    description: "GA4 property ID, passed as propertyId on ga4_* calls",
  }),
  metaAdAccountId: Schema.optional(Schema.String).annotations({
    description: "Meta ad account ID (act_…), passed as adAccountId on meta_* calls",
  }),
  googleAdsCustomerId: Schema.optional(Schema.String).annotations({
    description: "Google Ads customer ID, passed as customerId on google_ads_* calls",
  }),
  shopifyStore: Schema.optional(Schema.String).annotations({
    description:
      "Shopify store domain. Informational only — Shopify auth is bound to one store " +
      "per running server, so this is checked against the server, never passed to it.",
  }),
  timezone: Schema.optional(Schema.String),
  currency: Schema.optional(Schema.String),
});

export type Brand = Schema.Schema.Type<typeof BrandSchema>;

export const BrandRegistrySchema = Schema.Struct({
  defaultBrand: Schema.optional(Schema.String),
  brands: Schema.Record({ key: Schema.String, value: BrandSchema }),
});

export type BrandRegistry = Schema.Schema.Type<typeof BrandRegistrySchema>;

export class BrandNotFoundError extends Data.TaggedError("BrandNotFoundError")<{
  readonly requested: string;
  readonly available: readonly string[];
}> {
  get message(): string {
    return `No brand '${this.requested}' in the registry. Available: ${
      this.available.length > 0 ? this.available.join(", ") : "(none)"
    }`;
  }
}

export class NoDefaultBrandError extends Data.TaggedError("NoDefaultBrandError")<{
  readonly available: readonly string[];
}> {
  get message(): string {
    return `The registry declares no defaultBrand. Name one explicitly: ${this.available.join(", ")}`;
  }
}

export interface ResolvedBrand {
  readonly key: string;
  readonly brand: Brand;
}

/**
 * Resolve a brand key against the registry, falling back to `defaultBrand`.
 *
 * Fails loudly rather than silently picking the first brand: answering a question about
 * brand A with brand B's numbers is the single worst thing this system can do, so an
 * ambiguous request must stop rather than guess.
 */
export const resolveBrand = (
  registry: BrandRegistry,
  requested?: string,
): ResolvedBrand | BrandNotFoundError | NoDefaultBrandError => {
  const available = Object.keys(registry.brands);
  const key = requested ?? registry.defaultBrand;

  if (key === undefined) return new NoDefaultBrandError({ available });

  const brand = registry.brands[key];
  if (brand === undefined) return new BrandNotFoundError({ requested: key, available });

  return { key, brand };
};

/**
 * Whether a brand's Shopify store matches the store a running server is bound to.
 *
 * Shopify is the one platform with no per-call override, so this check is the only thing
 * standing between a brand switch and a wrong answer.
 */
export const shopifyStoreMatches = (brand: Brand, serverStore: string): boolean => {
  if (brand.shopifyStore === undefined) return false;
  return normalizeStoreDomain(brand.shopifyStore) === normalizeStoreDomain(serverStore);
};

const normalizeStoreDomain = (store: string): string =>
  store
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

/** The port through which the domain obtains a registry, without knowing where it lives. */
export interface BrandRegistryPort {
  readonly load: () => Promise<BrandRegistry>;
}
