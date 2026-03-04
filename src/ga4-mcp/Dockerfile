FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lockb ./
COPY src/mcp-core/package.json ./src/mcp-core/
COPY src/ga4-mcp/package.json ./src/ga4-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/mcp-core/ ./src/mcp-core/
COPY src/ga4-mcp/ ./src/ga4-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd src/mcp-core build

# Build ga4-mcp
RUN bun run --cwd src/ga4-mcp build

WORKDIR /app/src/ga4-mcp

EXPOSE 3003

CMD ["bun", "run", "start"]
