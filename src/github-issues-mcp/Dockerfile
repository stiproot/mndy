FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lockb ./
COPY src/mcp-core/package.json ./src/mcp-core/
COPY src/github-issues-mcp/package.json ./src/github-issues-mcp/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/mcp-core/ ./src/mcp-core/
COPY src/github-issues-mcp/ ./src/github-issues-mcp/

# Build mcp-core first (dependency)
RUN bun run --cwd src/mcp-core build

# Build github-issues-mcp
RUN bun run --cwd src/github-issues-mcp build

WORKDIR /app/src/github-issues-mcp

EXPOSE 3001

CMD ["bun", "run", "start"]
