# SUSE - Backend (Node.js/Express)
# Fase 5: Docker + PM2 + Logs Estruturados

FROM node:20-slim

LABEL maintainer="SUSE Team"
LABEL service="backend"
LABEL version="2.0"

WORKDIR /app

# Copiar package.json e instalar dependências (cache layer)
COPY backend/package.json backend/package-lock.json* /app/
RUN npm install --production

# Copiar código fonte e compilar
COPY backend/tsconfig.json /app/
COPY backend/src/ /app/src/
RUN npm run build

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=4000
ENV IA_HOST=ia-engine
ENV IA_PORT=5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "const http = require('http'); const r = http.get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); r.on('error', () => process.exit(1))" || exit 1

EXPOSE 4000

CMD ["node", "dist/app.js"]
