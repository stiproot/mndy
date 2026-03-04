FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lockb ./
COPY src/mcp-core/package.json ./src/mcp-core/
COPY src/meta-ads-mcp/package.json ./src/meta-ads-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/mcp-core/ ./src/mcp-core/
COPY src/meta-ads-mcp/ ./src/meta-ads-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd src/mcp-core build

# Build meta-ads-mcp
RUN bun run --cwd src/meta-ads-mcp build

WORKDIR /app/src/meta-ads-mcp

EXPOSE 3004

CMD ["bun", "run", "start"]
