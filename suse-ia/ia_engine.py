"""
SUSE - Módulo de Inteligência Artificial (ia_engine.py)

VERSÃO 2.0 - FEATURE ENGINEERING UNIFICADO + SHAP + DURAÇÃO REAL
Data: 23/07/2026
"""

import os
import json
import pickle
import warnings
import time
from datetime import datetime

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify

from structured_logger import get_logger

from features import (
    extract_features,
    calculate_rsi,
    calculate_ema,
    calculate_atr,
    estimate_duration,
    FEATURE_ORDER,
)
from backtest import run_backtest, run_replay
from risk_manager import assess_risk
from alerts import generate_ia_alerts, generate_risk_alerts, get_alerts, acknowledge_alert, clear_alerts
from decision_history import log_decision, get_history, clear_history
from paper_trading import handle_paper_trade

MODEL_PATH = "model_rf_real.pkl"
log = get_logger('ia_engine')

# Carregamento lazy de SHAP para não quebrar se não estiver instalado
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    warnings.warn("SHAP não instalado. Explicações por feature não estarão disponíveis. Run: pip install shap")


# -----------------------------
# COLETA DE DADOS
# -----------------------------

def save_real_candles(candles):
    try:
        dataset_dir = "dataset"
        os.makedirs(dataset_dir, exist_ok=True)
        file_path = os.path.join(dataset_dir, "real_candles.jsonl")

        entry = {
            "timestamp": datetime.now().isoformat(),
            "symbol": candles[0].get("symbol", "UNKNOWN") if candles else "UNKNOWN",
            "num_candles": len(candles),
            "candles": candles
        }

        with open(file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

        log.info('Candles salvos no dataset', extra={'num_candles': len(candles), 'symbol': entry['symbol']})
    except Exception as e:
        log.error('Erro ao salvar candles', extra={'error': str(e)})


# -----------------------------
# CARREGAMENTO DO MODELO
# -----------------------------

_model_cache = None
_model_metadata = None
_shap_explainer = None


def load_model_and_metadata():
    """Carrega modelo e metadados com cache."""
    global _model_cache, _model_metadata, _shap_explainer

    if _model_cache is not None:
        return _model_cache, _model_metadata

    if not os.path.exists(MODEL_PATH):
        return None, None

    with open(MODEL_PATH, "rb") as f:
        payload = pickle.load(f)

    # Compatibilidade com modelos antigos salvos diretamente
    if isinstance(payload, dict) and 'model' in payload:
        model = payload['model']
        metadata = payload
    else:
        model = payload
        metadata = {}

    _model_cache = model
    _model_metadata = metadata

    if SHAP_AVAILABLE:
        try:
            _shap_explainer = shap.TreeExplainer(model)
        except Exception as e:
            print(f"⚠️ Não foi possível criar TreeExplainer: {e}")
            _shap_explainer = None

    return model, metadata


# -----------------------------
# SHAP
# -----------------------------

def compute_shap_explanation(feats_df, model, explainer):
    """
    Calcula contribuições SHAP para a classe predita.
    Retorna lista ordenada com top features e seus impactos.
    """
    if not SHAP_AVAILABLE or explainer is None:
        return []

    try:
        # shap_values pode ser lista de arrays (multiclasse) ou array 2D (binário)
        shap_values = explainer.shap_values(feats_df)

        if isinstance(shap_values, list):
            # Multiclasse: lista de arrays numpy shape (n_samples, n_features)
            predicted_class_index = int(np.where(model.classes_ == model.predict(feats_df)[0])[0][0])
            shap_row = shap_values[predicted_class_index][0]
        else:
            # Binário ou regressão: array shape (n_samples, n_features)
            shap_row = shap_values[0]

        # Garantir que shap_row é array 1D
        shap_row = np.asarray(shap_row).ravel()

        contributions = []
        for feat, val in zip(FEATURE_ORDER, shap_row):
            contributions.append({
                'feature': feat,
                'contribution': round(float(val), 4)
            })

        # Ordenar por valor absoluto e pegar top 5
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        return contributions[:5]
    except Exception as e:
        print(f"⚠️ Erro ao calcular SHAP: {e}")
        return []


# -----------------------------
# EXPLICAÇÕES NATURAIS
# -----------------------------

def build_explanations(candles, feats_df, decision, shap_contributions):
    """Monta lista de explicações legíveis para o trader."""
    explanations = []

    rsi = calculate_rsi(candles)
    ema9 = calculate_ema(candles, 9)
    ema21 = calculate_ema(candles, 21)
    atr = calculate_atr(candles, 14)
    close = candles[-1].get('close', 0)
    atr_pct = atr / close * 100 if close > 0 else 0.0

    explanations.append(f"RSI atual: {rsi:.2f}")
    explanations.append(f"EMA9: {ema9:.4f} | EMA21: {ema21:.4f}")
    explanations.append(f"ATR(14): {atr:.5f} ({atr_pct:.3f}%)")
    explanations.append(f"Crossover EMA9/EMA21: {int(feats_df['crossover_9_21'].iloc[0])}")
    explanations.append(f"Volume z-score: {feats_df['volume_zscore'].iloc[0]:.2f}")

    # Adicionar as top contribuições SHAP como explicação técnica
    if shap_contributions:
        top = shap_contributions[0]
        direction = "aumentou" if top['contribution'] > 0 else "reduziu"
        explanations.append(
            f"Feature mais influente: {top['feature']} ({direction} confiança em {abs(top['contribution']):.3f})"
        )

    return explanations


# -----------------------------
# FUNÇÃO PRINCIPAL DA IA
# -----------------------------

def run_ia(candles):
    save_real_candles(candles)

    if len(candles) < 21:
        raise ValueError("Necessário pelo menos 21 candles para análise válida.")

    feats_df = extract_features(candles)
    if feats_df is None:
        raise ValueError("Falha na extração de features.")

    model, metadata = load_model_and_metadata()

    if model is not None:
        log.info('Modelo carregado', extra={'model_path': MODEL_PATH})

        try:
            # Reordenar features de acordo com treinamento (caso haja metadados)
            expected_features = metadata.get('feature_order', FEATURE_ORDER) if metadata else FEATURE_ORDER
            feats_df = feats_df[expected_features]

            decision = model.predict(feats_df)[0]
            probs = model.predict_proba(feats_df)[0]

            classes = model.classes_
            prob_dict = {}
            for i, cls in enumerate(classes):
                prob_dict[str(cls).lower()] = float(probs[i])

            for key in ['buy', 'hold', 'sell']:
                if key not in prob_dict:
                    prob_dict[key] = 0.0
            confidence = max(prob_dict.values()) * 100

            # SHAP
            shap_contributions = compute_shap_explanation(feats_df, model, _shap_explainer)
        except Exception as e:
            log.warning('Erro na predição - possivel incompatibilidade de features', extra={'error': str(e), 'hint': 'Rode train_model.py'})
            decision = "HOLD"
            confidence = 50.0
            prob_dict = {'buy': 0.0, 'hold': 1.0, 'sell': 0.0}
            shap_contributions = []
    else:
        log.warning('Modelo nao encontrado - fallback HOLD', extra={'model_path': MODEL_PATH})
        decision = "HOLD"
        confidence = 50.0
        prob_dict = {'buy': 0.0, 'hold': 1.0, 'sell': 0.0}
        shap_contributions = []

    explanations = build_explanations(candles, feats_df, decision, shap_contributions)
    duration = estimate_duration(candles)

    warnings_list = []
    if confidence < 60:
        warnings_list.append("Baixa confiança - operação não recomendada")
    if duration['max'] > 60:
        warnings_list.append("Duração estimada longa - considere exposição temporal")

    return {
        'decision': decision,
        'confidence': round(confidence, 2),
        'probabilities': prob_dict,
        'explanations': explanations,
        'warnings': warnings_list,
        'timestamp': pd.Timestamp.now().isoformat(),
        'estimated_duration': duration,
        'shap_values': shap_contributions,
    }


# -----------------------------
# API FLASK
# -----------------------------

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_route():
    return jsonify({'status': 'ok', 'service': 'ia-engine', 'version': '2.0'})

@app.route('/ia', methods=['POST'])
def ia_route():
    t0 = time.time()
    try:
        data = request.get_json()
        candles = data['candles']
        result = run_ia(candles)
        # Gerar alertas automaticamente baseados na análise
        symbol = candles[0].get('symbol', 'UNKNOWN') if candles else 'UNKNOWN'
        generate_ia_alerts(result, symbol=symbol, timeframe='M5')
        # Registrar no histórico de decisões
        last_close = candles[-1].get('close', 0) if candles else 0
        log_decision(result, symbol=symbol, timeframe='M5', price=last_close)
        elapsed = time.time() - t0
        log.info('Predicao concluida', extra={
            'decision': result.get('decision'),
            'confidence': result.get('confidence'),
            'symbol': symbol,
            'elapsed_ms': round(elapsed * 1000, 1),
        })
        return jsonify(result)
    except Exception as e:
        log.error('Erro interno na IA', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


@app.route('/backtest', methods=['POST'])
def backtest_route():
    try:
        import time
        t0 = time.time()
        data = request.get_json() or {}
        result = run_backtest(
            initial_capital=float(data.get('initial_capital', 10000.0)),
            window_size=int(data.get('window_size', 120)),
            step=int(data.get('step', 10)),
            stop_loss_pips=float(data.get('stop_loss_pips', 30)),
            take_profit_pips=float(data.get('take_profit_pips', 60)),
            spread_pips=float(data.get('spread_pips', 2)),
        )
        elapsed = time.time() - t0
        log.info('Backtest concluido', extra={'elapsed_s': round(elapsed, 1), 'trades': result.get('total_trades', 0)})
        return jsonify(result)
    except Exception as e:
        log.error('Erro no backtest', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


@app.route('/replay', methods=['POST'])
def replay_route():
    try:
        import time
        t0 = time.time()
        data = request.get_json() or {}
        result = run_replay(
            start_index=int(data.get('start_index', 0)),
            count=int(data.get('count', 50)),
            window_size=int(data.get('window_size', 120)),
        )
        elapsed = time.time() - t0
        log.info('Replay concluido', extra={'elapsed_s': round(elapsed, 1), 'steps': result.get('total_steps', 0)})
        return jsonify(result)
    except Exception as e:
        log.error('Erro no replay', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


@app.route('/risk', methods=['POST'])
def risk_route():
    try:
        data = request.get_json() or {}
        result = assess_risk(data)
        return jsonify(result)
    except Exception as e:
        log.error('Erro na avaliacao de risco', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


@app.route('/alerts', methods=['GET'])
def alerts_get_route():
    try:
        limit = int(request.args.get('limit', 50))
        level = request.args.get('level')
        category = request.args.get('category')
        symbol = request.args.get('symbol')
        unack = request.args.get('unacknowledged', 'false').lower() == 'true'
        alerts = get_alerts(limit=limit, level=level, category=category, symbol=symbol, unacknowledged_only=unack)
        return jsonify({'alerts': alerts, 'total': len(alerts)})
    except Exception as e:
        log.error('Erro ao buscar alertas', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


@app.route('/alerts/acknowledge', methods=['POST'])
def alerts_ack_route():
    try:
        data = request.get_json() or {}
        alert_id = data.get('id')
        if not alert_id:
            return jsonify({'error': 'ID do alerta não fornecido'}), 400
        success = acknowledge_alert(alert_id)
        if success:
            return jsonify({'success': True, 'id': alert_id})
        return jsonify({'error': 'Alerta não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/alerts/clear', methods=['POST'])
def alerts_clear_route():
    try:
        clear_alerts()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/history', methods=['GET'])
def history_route():
    try:
        limit = int(request.args.get('limit', 50))
        symbol = request.args.get('symbol')
        decision = request.args.get('decision')
        min_conf = float(request.args.get('min_confidence', 0))
        result = get_history(limit=limit, symbol=symbol, decision=decision, min_confidence=min_conf)
        return jsonify(result)
    except Exception as e:
        log.error('Erro ao buscar historico', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


@app.route('/history/clear', methods=['POST'])
def history_clear_route():
    try:
        clear_history()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/paper-trade', methods=['POST'])
def paper_trade_route():
    try:
        data = request.get_json() or {}
        result = handle_paper_trade(data)
        return jsonify(result)
    except Exception as e:
        log.error('Erro no paper trading', extra={'error': str(e)})
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    log.info('Iniciando servidor Flask da IA SUSE', extra={'host': '0.0.0.0', 'port': 5000})
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)