# =============================================
# STAGE 1: Build Angular
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar fuentes y compilar
COPY . .
RUN pnpm run build --configuration production

# =============================================
# STAGE 2: Nginx
# =============================================
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist/billing-platform-frontend/browser /usr/share/nginx/html

# Configuración nginx para Angular SPA + proxy al backend
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api {\n\
        proxy_pass http://billing_backend:8081;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_connect_timeout 60s;\n\
        proxy_read_timeout 60s;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80