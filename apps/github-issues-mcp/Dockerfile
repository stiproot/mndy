FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lock ./
COPY packages/js/mcp-core/package.json ./packages/js/mcp-core/
COPY apps/github-issues-mcp/package.json ./apps/github-issues-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/js/mcp-core/ ./packages/js/mcp-core/
COPY apps/github-issues-mcp/ ./apps/github-issues-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd packages/js/mcp-core build

# Build github-issues-mcp
RUN bun run --cwd apps/github-issues-mcp build

WORKDIR /app/apps/github-issues-mcp

EXPOSE 3001

CMD ["bun", "run", "start"]
