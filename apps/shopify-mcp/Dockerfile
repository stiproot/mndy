FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lock ./
COPY packages/js/mcp-core/package.json ./packages/js/mcp-core/
COPY apps/shopify-mcp/package.json ./apps/shopify-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/js/mcp-core/ ./packages/js/mcp-core/
COPY apps/shopify-mcp/ ./apps/shopify-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd packages/js/mcp-core build

# Build shopify-mcp
RUN bun run --cwd apps/shopify-mcp build

WORKDIR /app/apps/shopify-mcp

EXPOSE 3005

CMD ["bun", "run", "start"]
