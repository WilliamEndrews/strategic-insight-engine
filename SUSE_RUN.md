# SUSE v2.0 - Guia de Execução (Fase 1)

Este guia cobre os passos para executar o SUSE após as mudanças da Fase 1.

## Pré-requisitos

- Python 3.10+ instalado
- Node.js + bun/npm
- Ambiente virtual Python (recomendado) na pasta `venv/`

## 1. Instalar dependências Python

No PowerShell ou CMD (como Administrador, se necessário):

```bash
cd c:\Projetos\projetoSUSE\SUSE
python -m venv venv
venv\Scripts\activate.bat
pip install -r suse-ia\requirements.txt
```

## 2. Treinar o modelo (OBRIGATÓRIO após Fase 1)

As features do modelo mudaram (de 7 para 14). O modelo antigo `model_rf_real.pkl` **não é compatível** sem retreinamento.

Execute:

```bash
venv\Scripts\activate.bat
cd suse-ia
python train_model.py
```

Ou clique duplo em:

```
run_training.bat
```

Isso gera:
- `suse-ia/model_rf_real.pkl` (novo modelo)
- `suse-ia/model_metadata.pkl` (metadados do treino)

### Atenção sobre dados

O `dataset/real_candles.jsonl` atual tem poucas amostras. Para um modelo robusto, colete mais dados reais via MetaTrader 5 (`collect_real_data.py`) ou deixe o EA rodar por mais tempo para popular o dataset.

## 3. Iniciar a IA Flask

```bash
venv\Scripts\activate.bat
cd suse-ia
python ia_engine.py
```

Ou clique duplo em:

```
run_ia.bat
```

A IA estará disponível em `http://localhost:5000/ia`.

## 4. Iniciar o backend Node.js

Em outro terminal:

```bash
cd c:\Projetos\projetoSUSE\SUSE\backend
bun install   # ou npm install
bun run dev   # ou npm run dev
```

O backend estará em `http://localhost:4000`.

## 5. Iniciar o frontend React

Em outro terminal:

```bash
cd c:\Projetos\projetoSUSE\SUSE
bun install   # ou npm install
bun run dev   # ou npm run dev
```

O dashboard estará em `http://localhost:5173` (ou porta indicada).

## 6. Verificar funcionamento

Acesse o dashboard. Você deve ver:
- Decisão da IA (BUY/SELL/HOLD)
- Confiança e probabilidades
- Duração estimada (baseada em ATR)
- Painel SHAP com as top 5 features contribuintes

## Solução de problemas

### "Erro na predição (possível incompatibilidade de features)"
- Rode `python train_model.py` para gerar um modelo compatível.

### "SHAP não instalado"
- Execute `pip install shap`.

### "Dataset muito pequeno"
- Colete mais candles reais. O labeler por score precisa de variedade para gerar BUY/SELL/HOLD equilibrados.
