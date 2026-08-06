# Carried follow-ups

Status: Active — the parked items an otherwise-finished plan handed off.
Established: 2026-08-06

Items an otherwise-finished plan chose not to do, collected here rather than stranded in
an archived plan or spun out into a near-empty follow-up doc. Each names its origin, so the
context is one link away.

## Open

### Publish the analytics servers as an npx package

From [desktop-consumability](./desktop-consumability.md). Desktop install is now one command,
but it still needs git, bun and a clone. A published package would make the Desktop config
`npx -y @mndy/analytics-mcp` with no repo and no build step — materially easier for anyone
outside the team. Deferred because it is a real packaging and release effort; revisit when
this is handed to people who will not clone a monorepo.

### `azdoproxy-api`'s Dockerfile COPY cannot resolve

From [monorepo-maturity/02](./impl/monorepo-maturity/02-monorepo-restructure.md). Its compose
build context is the app directory, but the Dockerfile does `COPY ./src/azdoproxy-api/. .`
— a path that exists in neither the old nor the new layout relative to that context. It was
left untouched rather than "fixed" by guessing whether the intent was a root-context build
or a plain `COPY . .`; both are plausible and neither is verifiable without building the
image. Decide, then fix.

### Real lint coverage for the frontends

From [monorepo-maturity/02](./impl/monorepo-maturity/02-monorepo-restructure.md). `apps/vis` and
`apps/azdo` had `lint` scripts that had never worked (no eslint plugin installed); they were
removed rather than left as false coverage. `apps/ui` is the only frontend that actually
lints. Give the other two the same setup, or decide they are not worth linting and say so.

### `markdown-mcp` needs a real Effect rewrite (and some tools)

From [monorepo-maturity/03](./impl/monorepo-maturity/03-mcp-effect-refactor.md). Its
`markdown.service.ts` uses JS try/catch inside `Effect.gen` and `yield* Effect.fail` without
returning, so extraction was attempted and reverted — it needs rewriting, not relocating.
It also registers **no tools**: `tools/index.ts` is a TODO stub listing five intended tools.
Decide whether this server is wanted at all before investing in it; it is currently a
running process that exposes nothing.

### `dapr-mcp` logic still lives in the app

From [monorepo-maturity/03](./impl/monorepo-maturity/03-mcp-effect-refactor.md). It received the
shared runtime and the `presentation/` layer, but `data-cache.service.ts` and its 397-line
`types.ts` were not extracted to a package. Its tools are cache plumbing rather than a
reusable domain, so the payoff is lower — but the layout is now inconsistent with the four
analytics servers. Fold it into the same shape when next touched.

### The paid media report is still unbuilt

From [monorepo-maturity/05](./impl/monorepo-maturity/05-google-ads-mcp.md). Its data layer is
now complete on every platform — Google Ads was the last gap — but the report itself
(`docs/plans/google-ads-mcp-paid-media-report.md`) has not been written. Build it as a
cross-platform composition in `packages/js/analytics-core`, not as a tool on any single
platform's server: it reads Google Ads, Meta, GA4 and Shopify together, so putting it in
one server's app would both hide it from other consumers and give that server dependencies
on four platforms.

### `apps/azdo` pins codemirror 5 but uses the vue-codemirror 6 component

Found while fixing the image builds. `package.json` declares `codemirror@^5.65.0` alongside
`vue-codemirror@^6.1.1`, whose peer is `codemirror@6`. bun tolerates it by nesting both
versions; npm could not, which is what surfaced it. Worse, `BulkCreateAzdoWisView.vue` passes
`:options` — the CodeMirror **5** prop — to the vue-codemirror **6** component, which expects
`:extensions`, so the editor config is likely being ignored at runtime. Decide which major
version the app targets and align both the dependency and the component usage; not guessed
at here because either direction changes app behaviour.
