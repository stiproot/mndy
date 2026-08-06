FROM oven/bun:1

WORKDIR /app

# Copy workspace root files for workspace dependency resolution
COPY package.json bun.lock ./
COPY packages/js/cc-core/package.json ./packages/js/cc-core/
COPY apps/cc-svc/package.json ./apps/cc-svc/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/js/cc-core/ ./packages/js/cc-core/
COPY apps/cc-svc/ ./apps/cc-svc/

# Build cc-core first (dependency)
RUN bun run --cwd packages/js/cc-core build

# Build cc-svc
RUN bun run --cwd apps/cc-svc build

WORKDIR /app/apps/cc-svc

EXPOSE 3002

CMD ["bun", "run", "start"]
