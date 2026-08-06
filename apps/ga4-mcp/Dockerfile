FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lock ./
COPY packages/js/mcp-core/package.json ./packages/js/mcp-core/
COPY apps/ga4-mcp/package.json ./apps/ga4-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/js/mcp-core/ ./packages/js/mcp-core/
COPY apps/ga4-mcp/ ./apps/ga4-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd packages/js/mcp-core build

# Build ga4-mcp
RUN bun run --cwd apps/ga4-mcp build

WORKDIR /app/apps/ga4-mcp

EXPOSE 3003

CMD ["bun", "run", "start"]
