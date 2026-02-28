FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lockb ./
COPY src/cc-core/package.json ./src/cc-core/
COPY src/cc-svc/package.json ./src/cc-svc/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/cc-core/ ./src/cc-core/
COPY src/cc-svc/ ./src/cc-svc/

# Build cc-core first (dependency)
RUN bun run --cwd src/cc-core build

# Build cc-svc
RUN bun run --cwd src/cc-svc build

WORKDIR /app/src/cc-svc

EXPOSE 3002

CMD ["bun", "run", "start"]
