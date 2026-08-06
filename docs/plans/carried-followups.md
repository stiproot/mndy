# Carried follow-ups

Status: Active — the parked items an otherwise-finished plan handed off.
Established: 2026-08-06

Items an otherwise-finished plan chose not to do, collected here rather than stranded in
an archived plan or spun out into a near-empty follow-up doc. Each names its origin, so the
context is one link away.

## Open

### Rotate the Azure DevOps PAT

From [monorepo-maturity/02](./monorepo-maturity/02-monorepo-restructure.md). `src/.core.env`
was tracked in git and holds a `BASE64_AZDO_PAT`. The ignore rule is fixed and the file is
untracked now, but **the credential is still in git history**. Rotate it. Purging history is
a separate decision — for a repo with a remote and a merged PR, rotation is the cheaper and
more reliable fix.

### Frontend Docker images cannot build

From [monorepo-maturity/02](./monorepo-maturity/02-monorepo-restructure.md). `apps/ui`,
`apps/vis` and `apps/azdo` build with their own directory as the compose context, but their
Dockerfiles `COPY bun.lockb ./` — a file that is neither in that context nor in the repo
(bun 1.3 writes `bun.lock`). Either switch them to root-context builds like the MCP images,
or drop the lockfile COPY. Not guessed at during the restructure because nothing in `make
lint` exercises image builds, so there was no signal to verify a fix against.

### `azdoproxy-api`'s Dockerfile COPY cannot resolve

From [monorepo-maturity/02](./monorepo-maturity/02-monorepo-restructure.md). Its compose
build context is the app directory, but the Dockerfile does `COPY ./src/azdoproxy-api/. .`
— a path that exists in neither the old nor the new layout relative to that context. It was
left untouched rather than "fixed" by guessing whether the intent was a root-context build
or a plain `COPY . .`; both are plausible and neither is verifiable without building the
image. Decide, then fix.

### Real lint coverage for the frontends

From [monorepo-maturity/02](./monorepo-maturity/02-monorepo-restructure.md). `apps/vis` and
`apps/azdo` had `lint` scripts that had never worked (no eslint plugin installed); they were
removed rather than left as false coverage. `apps/ui` is the only frontend that actually
lints. Give the other two the same setup, or decide they are not worth linting and say so.

### Python workers do not declare their framework dependency

From [monorepo-maturity/02](./monorepo-maturity/02-monorepo-restructure.md). Each worker's
`pyproject.toml` carries `[tool.uv.sources] mndy-framework = { workspace = true }` but does
**not** list `mndy-framework` in `dependencies`, so `uv sync` never installs it and
`import mndy_framework` fails in a fresh environment. It works today only because
`packages/py/mndy-framework/install.sh` is run by hand. Add the dependency so the workspace
is self-sufficient, or document the manual step as deliberate.

### `markdown-mcp` needs a real Effect rewrite (and some tools)

From [monorepo-maturity/03](./monorepo-maturity/03-mcp-effect-refactor.md). Its
`markdown.service.ts` uses JS try/catch inside `Effect.gen` and `yield* Effect.fail` without
returning, so extraction was attempted and reverted — it needs rewriting, not relocating.
It also registers **no tools**: `tools/index.ts` is a TODO stub listing five intended tools.
Decide whether this server is wanted at all before investing in it; it is currently a
running process that exposes nothing.

### `dapr-mcp` logic still lives in the app

From [monorepo-maturity/03](./monorepo-maturity/03-mcp-effect-refactor.md). It received the
shared runtime and the `presentation/` layer, but `data-cache.service.ts` and its 397-line
`types.ts` were not extracted to a package. Its tools are cache plumbing rather than a
reusable domain, so the payoff is lower — but the layout is now inconsistent with the four
analytics servers. Fold it into the same shape when next touched.

### `ui-api` does not compile

From [monorepo-maturity/02](./monorepo-maturity/02-monorepo-restructure.md). `turbo build`
is red on `apps/ui-api` — Effect type errors in `src/handlers/chat.handlers.ts`, predating
and unrelated to the restructure. Owned by [`effect-ui-api.md`](./effect-ui-api.md); noted
here because it is what stands between the repo and a green `bun run build`.
