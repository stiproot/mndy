FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lock ./
COPY packages/js/mcp-core/package.json ./packages/js/mcp-core/
COPY apps/meta-ads-mcp/package.json ./apps/meta-ads-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/js/mcp-core/ ./packages/js/mcp-core/
COPY apps/meta-ads-mcp/ ./apps/meta-ads-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd packages/js/mcp-core build

# Build meta-ads-mcp
RUN bun run --cwd apps/meta-ads-mcp build

WORKDIR /app/apps/meta-ads-mcp

EXPOSE 3004

CMD ["bun", "run", "start"]
