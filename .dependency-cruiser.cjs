/**
 * Hexagonal-architecture boundary rules, enforced across every TypeScript package.
 *
 * The layout is the contract: `src/domain` (the pure core + its ports), `src/infrastructure`
 * (outbound adapters), `src/presentation` (inbound adapters), and `src/index.ts` (the sole
 * composition root that wires them). These rules make that contract machine-checked.
 *
 * mndy's own spin on it (see CLAUDE.md, "Where code lives"): the domain and its outbound
 * adapters live in `packages/js/<name>-core`, while `apps/<name>` holds only presentation
 * plus the composition root. So the app-side rules below matter as much as the domain ones
 * — an app growing a `domain/` directory is the smell this is meant to catch.
 *
 * Run per-package (`depcruise src` from a package dir) so it stays turbo-native and
 * cached; the config is discovered by walking up to the repo root. The path regexes are
 * anchored on `(^|/)src/<layer>/` so they fire inside whichever package is being cruised
 * and no-op in packages that have no layers yet.
 */

/** Workspace packages whose whole job is I/O — the domain must reach these only through a port. */
const IO_PACKAGES = "dapr-core|mcp-core";
/** External runtime/I-O libs the pure core must never import directly. */
const IO_LIBS = [
  "express",
  "cors",
  "@dapr/dapr",
  "@modelcontextprotocol/sdk",
  "@google-analytics/data",
  "facebook-nodejs-business-sdk",
  "@shopify/shopify-api",
  "@octokit/rest",
  "google-ads-api",
  "undici",
  "axios",
  "node-fetch",
].join("|");

module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment:
        "domain/ is the pure core: it must not import infrastructure/ or presentation/. " +
        "Depend on a port (an interface in domain/ports) and let the composition root inject the adapter.",
      severity: "error",
      from: { path: "(^|/)src/domain/" },
      to: { path: "(^|/)src/(infrastructure|presentation)/" },
    },
    {
      name: "domain-no-io-libs",
      comment:
        "domain/ must not import runtime/I-O dependencies. Model the boundary as a port; " +
        "the concrete driver lives in infrastructure/ and is wired at the composition root.",
      severity: "error",
      from: { path: "(^|/)src/domain/" },
      to: { path: `node_modules/(${IO_LIBS}|${IO_PACKAGES})(/|$)` },
    },
    {
      name: "presentation-not-infrastructure",
      comment:
        "presentation/ (MCP tools, HTTP routes) must not reach into infrastructure/ directly. " +
        "Take the port from the domain and let the composition root supply the adapter.",
      severity: "error",
      from: { path: "(^|/)src/presentation/" },
      to: { path: "(^|/)src/infrastructure/" },
    },
    {
      name: "infrastructure-not-presentation",
      comment:
        "infrastructure/ is an outbound adapter — it must never depend on an inbound one.",
      severity: "error",
      from: { path: "(^|/)src/infrastructure/" },
      to: { path: "(^|/)src/presentation/" },
    },
    {
      name: "no-circular",
      comment: "Circular imports make the layering unprovable and break tree-shaking.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      comment: "Unreachable module — delete it or wire it up.",
      severity: "warn",
      from: { orphan: true, pathNot: ["\\.d\\.ts$", "(^|/)src/index\\.ts$"] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".js", ".ts", ".d.ts"],
    },
  },
};
