# SUSE - IA Engine (Python/Flask)
# Fase 5: Docker + PM2 + Logs Estruturados

FROM python:3.11-slim

LABEL maintainer="SUSE Team"
LABEL service="ia-engine"
LABEL version="2.0"

WORKDIR /app

# Dependências do sistema para scikit-learn e shap
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python primeiro (cache layer)
COPY suse-ia/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da IA
COPY suse-ia/ /app/

# Criar diretórios necessários
RUN mkdir -p /app/dataset /app/logs

# Variáveis de ambiente
ENV FLASK_APP=ia_engine.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/ia', timeout=5)" || exit 1

EXPOSE 5000

CMD ["python", "ia_engine.py"]
