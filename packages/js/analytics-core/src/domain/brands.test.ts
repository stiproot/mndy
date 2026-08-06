import { describe, expect, it } from "vitest";
import {
  BrandNotFoundError,
  NoDefaultBrandError,
  resolveBrand,
  shopifyStoreMatches,
  type BrandRegistry,
} from "./brands.js";

const registry: BrandRegistry = {
  defaultBrand: "alpha",
  brands: {
    alpha: {
      label: "Alpha",
      ga4PropertyId: "111",
      metaAdAccountId: "act_111",
      shopifyStore: "alpha.myshopify.com",
    },
    beta: { label: "Beta", ga4PropertyId: "222" },
  },
};

describe("resolveBrand", () => {
  it("resolves an explicitly named brand", () => {
    const result = resolveBrand(registry, "beta");
    expect(result).toMatchObject({ key: "beta", brand: { label: "Beta" } });
  });

  it("falls back to defaultBrand when none is named", () => {
    const result = resolveBrand(registry);
    expect(result).toMatchObject({ key: "alpha" });
  });

  it("fails loudly for an unknown brand instead of picking one", () => {
    // Answering about brand A with brand B's numbers is the worst outcome available,
    // so an unresolvable name must stop rather than fall back.
    const result = resolveBrand(registry, "gamma");
    expect(result).toBeInstanceOf(BrandNotFoundError);
    expect((result as BrandNotFoundError).available).toEqual(["alpha", "beta"]);
  });

  it("fails when no brand is named and the registry declares no default", () => {
    const result = resolveBrand({ brands: registry.brands }, undefined);
    expect(result).toBeInstanceOf(NoDefaultBrandError);
  });
});

describe("shopifyStoreMatches", () => {
  const brand = registry.brands.alpha!;

  it("matches ignoring scheme, case and trailing slash", () => {
    expect(shopifyStoreMatches(brand, "https://Alpha.myshopify.com/")).toBe(true);
  });

  it("does not match a different store", () => {
    // Shopify has no per-call override, so this is the only guard against serving
    // brand A's question with brand B's store data.
    expect(shopifyStoreMatches(brand, "beta.myshopify.com")).toBe(false);
  });

  it("does not match when the brand declares no store", () => {
    expect(shopifyStoreMatches(registry.brands.beta!, "beta.myshopify.com")).toBe(false);
  });
});
