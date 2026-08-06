FROM oven/bun:1-alpine AS build

WORKDIR /app

# Build context is this app directory, so the workspace lockfile is not reachable.
COPY package.json ./

RUN bun install

COPY . .

RUN bun run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8082

CMD ["nginx", "-g", "daemon off;"]
