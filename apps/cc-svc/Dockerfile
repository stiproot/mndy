# syntax=docker/dockerfile:1.7-labs
FROM oven/bun:1

WORKDIR /app

# ALL workspace manifests, paths preserved. --frozen-lockfile validates the lockfile
# against the whole workspace set, so a subset makes it reject the lockfile as changed.
COPY --parents package.json bun.lock apps/*/package.json packages/js/*/package.json scripts/package.json ./

# ...but install only this image's slice. Without --filter, bun installs every
# workspace's dependencies — Quasar, Vue and the rest of the monorepo — into an MCP
# image that needs none of it.
RUN bun install --frozen-lockfile --filter './apps/cc-svc' --filter './packages/js/*'

# Copy source code
COPY packages/js/cc-core/ ./packages/js/cc-core/
COPY apps/cc-svc/ ./apps/cc-svc/

# Build workspace packages first, dependencies before dependents
RUN bun run --cwd packages/js/cc-core build

# Build cc-svc
RUN bun run --cwd apps/cc-svc build

WORKDIR /app/apps/cc-svc

EXPOSE 3002

CMD ["bun", "run", "start"]
