FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lockb ./
COPY src/mcp-core/package.json ./src/mcp-core/
COPY src/shopify-mcp/package.json ./src/shopify-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/mcp-core/ ./src/mcp-core/
COPY src/shopify-mcp/ ./src/shopify-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd src/mcp-core build

# Build shopify-mcp
RUN bun run --cwd src/shopify-mcp build

WORKDIR /app/src/shopify-mcp

EXPOSE 3005

CMD ["bun", "run", "start"]
