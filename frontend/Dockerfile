# Fase 1: Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build:prod

# Fase 2: Serve con Nginx
FROM nginx:alpine

# Puliamo la cartella html di default
RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/nginx.conf

# Copia i file compilati (basato sul successo precedente, usiamo /app/dist)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
