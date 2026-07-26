"""
SUSE - Motor de Backtesting e Replay (backtest.py)

VERSÃO 2.0 - FASE 2
Data: 23/07/2026

Funcionalidades:
1. Backtesting: simula decisões da IA em dados históricos, calcula métricas de performance
2. Replay: percorre candles históricos passo-a-passo, retornando decisão da IA em cada ponto
"""

import json
import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from collections import Counter

from features import (
    extract_features,
    estimate_duration,
    calculate_atr,
    FEATURE_ORDER,
)

MODEL_PATH = "model_rf_real.pkl"
DATASET_PATH = "dataset/real_candles.jsonl"


def _load_model():
    """Carrega modelo treinado."""
    if not os.path.exists(MODEL_PATH):
        return None, {}
    with open(MODEL_PATH, "rb") as f:
        payload = pickle.load(f)
    if isinstance(payload, dict) and 'model' in payload:
        return payload['model'], payload
    return payload, {}


def _load_all_candles():
    """Carrega todos os pacotes de candles do dataset."""
    entries = []
    if not os.path.exists(DATASET_PATH):
        return entries
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                candles = entry.get("candles")
                if candles and len(candles) >= 21:
                    entries.append(candles)
            except json.JSONDecodeError:
                continue
    return entries


def _get_closes(candles):
    if isinstance(candles[0], dict):
        return np.array([c['close'] for c in candles])
    return candles['close'].values


def run_backtest(initial_capital=10000.0, window_size=120, step=10,
                 stop_loss_pips=30, take_profit_pips=60, spread_pips=2):
    """
    Executa backtesting simulando trades com base nas decisões da IA.

    Args:
        initial_capital: capital inicial em unidades monetárias
        window_size: tamanho da janela de candles para cada predição
        step: passo entre predições (em candles)
        stop_loss_pips: stop loss em pips
        take_profit_pips: take profit em pips
        spread_pips: spread simulado em pips

    Returns:
        dict com métricas de performance, equity curve e lista de trades
    """
    model, metadata = _load_model()
    if model is None:
        return {'error': 'Modelo não encontrado. Rode train_model.py primeiro.'}

    all_candles = _load_all_candles()
    if not all_candles:
        return {'error': 'Dataset vazio. Colete dados primeiro.'}

    # Concatenar todos os candles em uma série contínua
    full_candles = []
    for batch in all_candles:
        full_candles.extend(batch)

    if len(full_candles) < window_size + 10:
        return {'error': f'Dados insuficientes: {len(full_candles)} candles. Mínimo: {window_size + 10}.'}

    expected_features = metadata.get('feature_order', FEATURE_ORDER)

    trades = []
    equity_curve = []
    capital = initial_capital
    position = None  # {'type': 'BUY'|'SELL', 'entry_price': float, 'entry_index': int, 'stop': float, 'target': float}

    pip_value = 0.0001  # Para EUR/USD; ajustar conforme ativo

    closes = _get_closes(full_candles)

    for i in range(window_size, len(full_candles) - 5, step):
        window = full_candles[i - window_size:i]

        feats_df = extract_features(window)
        if feats_df is None:
            continue

        try:
            feats_df = feats_df[expected_features]
            decision = model.predict(feats_df)[0]
            probs = model.predict_proba(feats_df)[0]
            classes = model.classes_
            prob_dict = {str(cls).lower(): float(probs[j]) for j, cls in enumerate(classes)}
            confidence = max(prob_dict.values()) * 100 if prob_dict else 0.0
        except Exception:
            continue

        current_price = closes[i] if i < len(closes) else closes[-1]

        # Verificar se posição aberta deve ser fechada (SL/TP)
        if position is not None:
            high_i = full_candles[i].get('high', current_price) if isinstance(full_candles[i], dict) else current_price
            low_i = full_candles[i].get('low', current_price) if isinstance(full_candles[i], dict) else current_price

            if position['type'] == 'BUY':
                if low_i <= position['stop']:
                    pnl = (position['stop'] - position['entry_price']) / pip_value
                    capital += pnl
                    trades.append({
                        'type': 'BUY', 'entry': position['entry_price'],
                        'exit': position['stop'], 'pnl_pips': pnl,
                        'result': 'LOSS', 'reason': 'STOP_LOSS',
                        'entry_index': position['entry_index'], 'exit_index': i,
                        'confidence': position['confidence'],
                    })
                    position = None
                elif high_i >= position['target']:
                    pnl = (position['target'] - position['entry_price']) / pip_value
                    capital += pnl
                    trades.append({
                        'type': 'BUY', 'entry': position['entry_price'],
                        'exit': position['target'], 'pnl_pips': pnl,
                        'result': 'WIN', 'reason': 'TAKE_PROFIT',
                        'entry_index': position['entry_index'], 'exit_index': i,
                        'confidence': position['confidence'],
                    })
                    position = None

            elif position['type'] == 'SELL':
                if high_i >= position['stop']:
                    pnl = (position['entry_price'] - position['stop']) / pip_value
                    capital += pnl
                    trades.append({
                        'type': 'SELL', 'entry': position['entry_price'],
                        'exit': position['stop'], 'pnl_pips': pnl,
                        'result': 'LOSS', 'reason': 'STOP_LOSS',
                        'entry_index': position['entry_index'], 'exit_index': i,
                        'confidence': position['confidence'],
                    })
                    position = None
                elif low_i <= position['target']:
                    pnl = (position['entry_price'] - position['target']) / pip_value
                    capital += pnl
                    trades.append({
                        'type': 'SELL', 'entry': position['entry_price'],
                        'exit': position['target'], 'pnl_pips': pnl,
                        'result': 'WIN', 'reason': 'TAKE_PROFIT',
                        'entry_index': position['entry_index'], 'exit_index': i,
                        'confidence': position['confidence'],
                    })
                    position = None

        # Abrir nova posição se não houver posição aberta e decisão for BUY/SELL
        if position is None and decision in ('BUY', 'SELL') and confidence >= 55:
            spread_cost = spread_pips * pip_value

            if decision == 'BUY':
                entry = current_price + spread_cost
                stop = entry - stop_loss_pips * pip_value
                target = entry + take_profit_pips * pip_value
            else:
                entry = current_price - spread_cost
                stop = entry + stop_loss_pips * pip_value
                target = entry - take_profit_pips * pip_value

            position = {
                'type': decision,
                'entry_price': entry,
                'entry_index': i,
                'stop': stop,
                'target': target,
                'confidence': confidence,
            }

        equity_curve.append({
            'index': i,
            'capital': round(capital, 2),
            'price': float(current_price),
            'decision': decision,
            'confidence': round(confidence, 1),
            'has_position': position is not None,
        })

    # Fechar posição aberta no final
    if position is not None:
        last_price = closes[-1]
        if position['type'] == 'BUY':
            pnl = (last_price - position['entry_price']) / pip_value
        else:
            pnl = (position['entry_price'] - last_price) / pip_value
        capital += pnl
        trades.append({
            'type': position['type'], 'entry': position['entry_price'],
            'exit': float(last_price), 'pnl_pips': pnl,
            'result': 'WIN' if pnl > 0 else 'LOSS', 'reason': 'END_OF_DATA',
            'entry_index': position['entry_index'], 'exit_index': len(full_candles) - 1,
            'confidence': position['confidence'],
        })
        position = None

    # Calcular métricas
    total_trades = len(trades)
    wins = [t for t in trades if t['result'] == 'WIN']
    losses = [t for t in trades if t['result'] == 'LOSS']
    win_rate = (len(wins) / total_trades * 100) if total_trades > 0 else 0.0

    total_pnl = sum(t['pnl_pips'] for t in trades)
    avg_win = np.mean([t['pnl_pips'] for t in wins]) if wins else 0.0
    avg_loss = np.mean([t['pnl_pips'] for t in losses]) if losses else 0.0
    profit_factor = (sum(t['pnl_pips'] for t in wins) / abs(sum(t['pnl_pips'] for t in losses))) if losses else float('inf')

    # Max drawdown
    equity_values = [e['capital'] for e in equity_curve]
    peak = equity_values[0] if equity_values else initial_capital
    max_dd = 0.0
    for ev in equity_values:
        if ev > peak:
            peak = ev
        dd = (peak - ev) / peak * 100 if peak > 0 else 0.0
        if dd > max_dd:
            max_dd = dd

    # Sharpe ratio simplificado (por trade)
    pnls = [t['pnl_pips'] for t in trades]
    sharpe = (np.mean(pnls) / np.std(pnls)) if len(pnls) > 1 and np.std(pnls) > 0 else 0.0

    # Decisões contadas
    decision_counts = Counter(e['decision'] for e in equity_curve)

    return {
        'summary': {
            'initial_capital': initial_capital,
            'final_capital': round(capital, 2),
            'total_return_pips': round(total_pnl, 1),
            'total_return_pct': round((capital - initial_capital) / initial_capital * 100, 2),
            'total_trades': total_trades,
            'wins': len(wins),
            'losses': len(losses),
            'win_rate': round(win_rate, 1),
            'avg_win_pips': round(avg_win, 1),
            'avg_loss_pips': round(avg_loss, 1),
            'profit_factor': round(profit_factor, 2) if profit_factor != float('inf') else 999.99,
            'max_drawdown_pct': round(max_dd, 2),
            'sharpe_ratio': round(sharpe, 2),
            'total_candles': len(full_candles),
            'total_predictions': len(equity_curve),
            'decision_distribution': dict(decision_counts),
        },
        'equity_curve': equity_curve,
        'trades': trades,
        'config': {
            'window_size': window_size,
            'step': step,
            'stop_loss_pips': stop_loss_pips,
            'take_profit_pips': take_profit_pips,
            'spread_pips': spread_pips,
        },
        'timestamp': datetime.now().isoformat(),
    }


def run_replay(start_index=0, count=50, window_size=120):
    """
    Executa replay passo-a-passo: em cada candle, roda a IA e retorna a decisão.

    Args:
        start_index: índice inicial no array de candles
        count: número de passos (candles) a percorrer
        window_size: tamanho da janela de candles para cada predição

    Returns:
        dict com lista de steps, cada um contendo decisão, confiança, features e preço
    """
    model, metadata = _load_model()
    if model is None:
        return {'error': 'Modelo não encontrado. Rode train_model.py primeiro.'}

    all_candles = _load_all_candles()
    if not all_candles:
        return {'error': 'Dataset vazio.'}

    full_candles = []
    for batch in all_candles:
        full_candles.extend(batch)

    if len(full_candles) < window_size + start_index + count:
        return {'error': f'Dados insuficientes para replay a partir do índice {start_index}.'}

    expected_features = metadata.get('feature_order', FEATURE_ORDER)
    closes = _get_closes(full_candles)

    steps = []
    for offset in range(count):
        i = start_index + offset
        end_idx = i + window_size
        if end_idx > len(full_candles):
            break

        window = full_candles[i:end_idx]
        feats_df = extract_features(window)
        if feats_df is None:
            continue

        try:
            feats_df = feats_df[expected_features]
            decision = model.predict(feats_df)[0]
            probs = model.predict_proba(feats_df)[0]
            classes = model.classes_
            prob_dict = {str(cls).lower(): float(probs[j]) for j, cls in enumerate(classes)}
            confidence = max(prob_dict.values()) * 100 if prob_dict else 0.0
        except Exception as e:
            decision = 'HOLD'
            confidence = 0.0
            prob_dict = {'buy': 0.0, 'hold': 1.0, 'sell': 0.0}

        current_price = closes[end_idx - 1] if end_idx - 1 < len(closes) else closes[-1]

        # Duração estimada
        duration = estimate_duration(window)

        # Features resumidas para display
        feature_values = {}
        for col in expected_features[:5]:  # top 5 features
            feature_values[col] = round(float(feats_df[col].iloc[0]), 4)

        steps.append({
            'step': offset,
            'candle_index': end_idx - 1,
            'price': float(current_price),
            'decision': str(decision),
            'confidence': round(confidence, 1),
            'probabilities': prob_dict,
            'estimated_duration': duration,
            'top_features': feature_values,
        })

    return {
        'steps': steps,
        'total_steps': len(steps),
        'start_index': start_index,
        'window_size': window_size,
        'total_candles': len(full_candles),
        'timestamp': datetime.now().isoformat(),
    }
