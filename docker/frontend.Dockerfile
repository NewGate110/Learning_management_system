# ── Stage 1: Angular Build ─────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build -- --output-path=dist/college-lms

# ── Stage 2: Nginx Serve ────────────────────────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/dist/college-lms/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
