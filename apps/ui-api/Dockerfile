FROM oven/bun:1-alpine AS build
  WORKDIR /app
  COPY package.json .
  RUN bun install

  COPY tsconfig.json .
  COPY . .
  RUN bun run build

FROM oven/bun:1-alpine AS runtime
  WORKDIR /app
  COPY nscacert.pem /app/nscacert.pem
  ENV NODE_EXTRA_CA_CERTS=/app/nscacert.pem

  RUN apk add --no-cache nginx

  COPY --from=build /app .
  COPY nginx.conf /etc/nginx/http.d/default.conf

  EXPOSE 3002

  # pm2 is gone: its config was `instances: 1` with autorestart and a memory cap, which is
  # exactly what the container runtime already provides (`restart:` policy + memory limits)
  # — a whole node process manager to duplicate Docker. Restart behaviour is preserved by
  # `restart: unless-stopped` on the compose service.
  CMD ["sh", "-c", "nginx -g 'daemon off;' & bun dist/index.js"]
