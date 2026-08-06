FROM oven/bun:1-alpine AS build
  WORKDIR /app
  COPY . .
  RUN bun install
  RUN bun run build
  # No `COPY .env ./dist/` — the bundler reads .env at build time from the context.
  # Copying it into dist/ would serve the config publicly, and fails outright when
  # .env is absent (it is gitignored), which is why this image never built.

FROM nginx:alpine
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  COPY --from=build /app/dist /usr/share/nginx/html
  EXPOSE 8081
  CMD ["nginx", "-g", "daemon off;"]
