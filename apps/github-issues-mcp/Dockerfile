# syntax=docker/dockerfile:1.7-labs
FROM oven/bun:1

WORKDIR /app

# ALL workspace manifests, paths preserved. --frozen-lockfile validates the lockfile
# against the whole workspace set, so a subset makes it reject the lockfile as changed.
COPY --parents package.json bun.lock apps/*/package.json packages/js/*/package.json scripts/package.json ./

# ...but install only this image's slice. Without --filter, bun installs every
# workspace's dependencies — Quasar, Vue and the rest of the monorepo — into an MCP
# image that needs none of it.
RUN bun install --frozen-lockfile --filter './apps/github-issues-mcp' --filter './packages/js/*'

# Copy source code
COPY packages/js/mcp-core/ ./packages/js/mcp-core/
COPY packages/js/analytics-core/ ./packages/js/analytics-core/
COPY packages/js/github-core/ ./packages/js/github-core/
COPY apps/github-issues-mcp/ ./apps/github-issues-mcp/

# Build workspace packages first, dependencies before dependents
RUN bun run --cwd packages/js/mcp-core build
RUN bun run --cwd packages/js/analytics-core build
RUN bun run --cwd packages/js/github-core build

# Build github-issues-mcp
RUN bun run --cwd apps/github-issues-mcp build

WORKDIR /app/apps/github-issues-mcp

EXPOSE 3001

CMD ["bun", "run", "start"]
