# SUSE — Sistema Unificado de Suporte Estratégico

> **A IA sugere. Você decide.**

SUSE é um copiloto analítico para traders de mercados financeiros. Não executa ordens — apenas recomenda **BUY / SELL / HOLD** com confiança, explicações (SHAP), duração estimada, gestão de risco, alertas, histórico e paper trading.

**Filosofia**: human-in-the-loop, na dúvida → HOLD, explicabilidade acima de tudo.

---

## Arquitetura

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend    │────▶│   Backend (Node)  │────▶│  IA Engine (Py) │
│  React+Vite   │     │  Express :4000    │     │  Flask :5000    │
│  TailwindCSS  │     │  Proxy + CORS     │     │  RandomForest   │
│  shadcn/ui    │     │  Logs estruturados│     │  SHAP + Features│
└──────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │  MetaTrader 5 │
                                              │  (EA MQL5)    │
                                              └───────────────┘
```

### Stack

| Camada | Tecnologia | Porta |
|--------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui | 3001 (dev) / 80 (docker) |
| Backend | Node.js 20 + Express + TypeScript | 4000 |
| IA Engine | Python 3.11 + Flask + scikit-learn + SHAP | 5000 |
| Modelo | Random Forest (sklearn) com 14 features | — |
| Dados | MetaTrader 5 via EA (MQL5) → JSON | — |

---

## Quick Start

### Opção 1: Desenvolvimento Local

```bash
# 1. IA Engine (Python)
cd suse-ia
python -m venv ../venv
../venv/Scripts/activate          # Windows
# source ../venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
python ia_engine.py               # → http://localhost:5000

# 2. Backend (Node.js)
cd backend
npm install
npm run dev                       # → http://localhost:4000

# 3. Frontend (React)
cd ..
npm install
npm run dev                       # → http://localhost:3001
```

### Opção 2: Docker Compose

```bash
cd docker
docker-compose up -d              # Sobe 3 serviços
# Frontend: http://localhost
# Backend:  http://localhost:4000
# IA:       http://localhost:5000
docker-compose logs -f            # Ver logs
docker-compose down               # Parar
```

### Opção 3: PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Build do backend
cd backend && npm run build && cd ..

# Build do frontend
npm run build

# Iniciar todos os serviços
pm2 start ecosystem.config.js

# Comandos úteis
pm2 status                        # Ver status
pm2 logs                          # Ver logs de todos
pm2 logs suse-ia                  # Ver logs da IA
pm2 restart all                   # Reiniciar
pm2 stop all                      # Parar
pm2 startup                       # Auto-iniciar com sistema
pm2 save                          # Salvar lista
```

---

## Estrutura de Pastas

```
SUSE/
├── backend/
│   ├── src/
│   │   ├── app.ts                # Express server, todas as rotas
│   │   └── logger.ts             # Logger estruturado (JSON em prod)
│   ├── package.json
│   └── tsconfig.json
├── suse-ia/
│   ├── ia_engine.py              # Flask app, todas as rotas
│   ├── features.py               # Feature engineering (14 features)
│   ├── train_model.py            # Treinamento do modelo
│   ├── backtest.py               # Motor de backtesting e replay
│   ├── risk_manager.py           # Gestão de risco (position sizing, R:R)
│   ├── alerts.py                 # Sistema de alertas
│   ├── decision_history.py       # Histórico de decisões (JSONL)
│   ├── paper_trading.py          # Paper trading (conta virtual)
│   ├── structured_logger.py      # Logger estruturado (JSON em prod)
│   ├── requirements.txt
│   ├── model_rf_real.pkl         # Modelo treinado
│   ├── model_metadata.pkl        # Metadados do modelo
│   └── dataset/
│       ├── real_candles.jsonl    # Dataset de candles
│       └── decision_history.jsonl # Histórico de decisões
├── src/
│   ├── pages/Index.tsx           # Dashboard principal
│   ├── components/suse/          # Componentes do dashboard
│   │   ├── DecisionCard.tsx
│   │   ├── ConfidenceMeter.tsx
│   │   ├── MarketHeader.tsx
│   │   ├── IndicatorPanel.tsx
│   │   ├── ExplanationPanel.tsx
│   │   ├── ShapPanel.tsx
│   │   ├── BacktestPanel.tsx
│   │   ├── ReplayPanel.tsx
│   │   ├── RiskPanel.tsx
│   │   ├── AlertsPanel.tsx
│   │   ├── AssetSelector.tsx
│   │   ├── DecisionHistory.tsx
│   │   └── PaperTradingPanel.tsx
│   ├── types/trading.ts          # Tipos TypeScript
│   └── lib/mockData.ts           # Mock data para desenvolvimento
├── docker/
│   ├── ia-engine.Dockerfile
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
├── ecosystem.config.js           # Config PM2
├── .dockerignore
└── package.json
```

---

## API Reference

### Backend (Node.js) — Porta 4000

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| POST | `/analyze` | Rota legada (EA MQL5) — valida payload |
| POST | `/ia` | **Principal** — envia candles, recebe análise completa |
| POST | `/backtest` | Executa backtesting no dataset histórico |
| POST | `/replay` | Replay passo-a-passo |
| POST | `/risk` | Avaliação de risco (position sizing, SL/TP, R:R) |
| GET | `/alerts` | Lista alertas com filtros (level, category, symbol) |
| POST | `/alerts/acknowledge` | Marca alerta como reconhecido |
| POST | `/alerts/clear` | Limpa todos os alertas |
| GET | `/history` | Histórico de decisões com filtros e stats |
| POST | `/history/clear` | Limpa histórico de decisões |
| POST | `/paper-trade` | Gerencia paper trading (OPEN/CLOSE/RESET/STATUS) |

### Exemplo: POST /ia

**Request:**
```json
{
  "candles": [
    { "timestamp": 1234567890, "open": 1.0850, "high": 1.0855, "low": 1.0848, "close": 1.0852, "volume": 500, "symbol": "EURUSD" }
  ]
}
```

**Response:**
```json
{
  "aiDecision": {
    "decision": "BUY",
    "confidence": 72.5,
    "probabilities": { "buy": 0.725, "sell": 0.15, "hold": 0.125 },
    "explanations": ["RSI atual: 55.32", "EMA9: 1.0851 | EMA21: 1.0849"],
    "warnings": [],
    "estimated_duration": { "min": 10, "max": 35, "confidence": 0.65 },
    "shap_values": [{ "feature": "rsi", "contribution": 0.123 }]
  }
}
```

---

## Funcionalidades por Fase

### Fase 1 — IA Core ✅
- Feature engineering unificado (14 features)
- Random Forest com labeler por score e thresholds dinâmicos
- SHAP para explicabilidade
- Duração estimada baseada em ATR/volatilidade

### Fase 2 — Backtesting & Replay ✅
- Backtesting com SL/TP e spread
- Métricas: win rate, profit factor, drawdown, Sharpe
- Equity curve em SVG
- Replay passo-a-passo com play/pause/step

### Fase 3 — Gestão de Risco, Alertas, Multi-Ativos ✅
- Position sizing, R:R, exposição máxima
- Alertas automáticos com acknowledge
- Multi-asset: scanner de 7 ativos com 7 timeframes

### Fase 4 — Histórico & Paper Trading ✅
- Histórico de decisões com timeline e estatísticas
- Paper trading com conta virtual ($10.000)
- P&L mark-to-market, win rate, profit factor

### Fase 5 — DevOps & Documentação ✅
- Docker: 3 Dockerfiles + docker-compose.yml
- PM2: ecosystem.config.js
- Logs estruturados em JSON (Python + Node.js)
- Health checks em ambos os serviços
- Variáveis de ambiente para configuração
- README completo

---

## Configuração

### Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | 4000 | Porta do backend Node.js |
| `IA_HOST` | localhost | Host da IA Flask |
| `IA_PORT` | 5000 | Porta da IA Flask |
| `NODE_ENV` | development | Ambiente (production = logs JSON) |
| `FLASK_ENV` | development | Ambiente Flask (production = logs JSON) |
| `LOG_LEVEL` | debug/info | Nível de log |

### Treinar o Modelo

```bash
cd suse-ia
python train_model.py
```

---

## Logs Estruturados

Em produção, os logs são emitidos em JSON:

```json
{"timestamp":"2026-07-25T20:00:00.000Z","level":"INFO","logger":"ia_engine","message":"Predicao concluida","decision":"BUY","confidence":72.5,"elapsed_ms":45.3}
```

Em desenvolvimento, logs são coloridos no console.

---

## Aviso

⚠️ O SUSE é uma ferramenta de suporte à decisão. Não garante lucro e não substitui análise profissional. Toda decisão final é de responsabilidade exclusiva do trader.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
