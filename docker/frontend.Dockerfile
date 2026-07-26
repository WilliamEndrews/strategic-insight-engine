# SUSE - Frontend (React/Vite build + nginx)
# Fase 5: Docker + PM2 + Logs Estruturados

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* bun.lockb* /app/
RUN npm install

COPY . /app/
RUN npm run build

# Stage 2: Serve com nginx
FROM nginx:alpine

LABEL maintainer="SUSE Team"
LABEL service="frontend"
LABEL version="2.0"

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do nginx - proxy para backend
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para backend Node.js
    location /api/ {
        proxy_pass http://backend:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
