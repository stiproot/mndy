FROM node:20-alpine as build
  WORKDIR /app
  COPY . .
  RUN npm install
  RUN npm run build
  COPY .env ./dist/

FROM nginx:alpine
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  COPY --from=build /app/dist /usr/share/nginx/html
  EXPOSE 8081
  CMD ["nginx", "-g", "daemon off;"]
