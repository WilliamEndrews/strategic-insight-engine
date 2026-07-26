"""
SUSE - Histórico de Decisões (decision_history.py)

FASE 4 - UX/UI, Histórico de Decisões, Paper Trading

Funcionalidades:
1. Log automático de cada decisão da IA com timestamp, símbolo, confiança
2. Recuperação do histórico com filtros e estatísticas
3. Persistência em arquivo JSONL
"""

import os
import json
import uuid
from datetime import datetime
from collections import deque

HISTORY_FILE = "dataset/decision_history.jsonl"
_history_cache = deque(maxlen=500)


def _ensure_cache_loaded():
    """Carrega histórico do arquivo para cache em memória na primeira chamada."""
    if _history_cache:
        return
    if not os.path.exists(HISTORY_FILE):
        return
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    _history_cache.append(json.loads(line))
    except Exception:
        pass


def log_decision(ia_result, symbol='UNKNOWN', timeframe='M5', price=0.0, trend='LATERAL'):
    """
    Registra uma decisão da IA no histórico.

    Args:
        ia_result: dict retornado por run_ia()
        symbol: símbolo analisado
        timeframe: timeframe
        price: preço atual
        trend: tendência detectada

    Returns:
        entry dict
    """
    _ensure_cache_loaded()

    shap_values = ia_result.get('shap_values', [])
    top_features = []
    if shap_values:
        sorted_shap = sorted(shap_values, key=lambda x: abs(x.get('contribution', 0)), reverse=True)
        top_features = sorted_shap[:5]

    entry = {
        'id': str(uuid.uuid4())[:8],
        'timestamp': ia_result.get('timestamp', datetime.now().isoformat()),
        'symbol': symbol,
        'timeframe': timeframe,
        'decision': ia_result.get('decision', 'HOLD'),
        'confidence': ia_result.get('confidence', 0),
        'probabilities': ia_result.get('probabilities', {'buy': 0, 'sell': 0, 'hold': 1}),
        'price': price,
        'trend': trend,
        'warnings': ia_result.get('warnings', []),
        'estimated_duration': ia_result.get('estimated_duration', {'min': 0, 'max': 0, 'confidence': 0}),
        'top_features': top_features,
    }

    _history_cache.append(entry)

    # Persistir
    try:
        os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
        with open(HISTORY_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"⚠️ Erro ao salvar histórico: {e}")

    return entry


def get_history(limit=50, symbol=None, decision=None, min_confidence=0):
    """
    Retorna histórico de decisões com filtros e estatísticas.

    Args:
        limit: número máximo de entradas
        symbol: filtrar por símbolo
        decision: filtrar por decisão (BUY/SELL/HOLD)
        min_confidence: confiança mínima

    Returns:
        dict com entries, total e stats
    """
    _ensure_cache_loaded()

    entries = list(_history_cache)
    entries.reverse()  # mais recentes primeiro

    if symbol:
        entries = [e for e in entries if e.get('symbol') == symbol]
    if decision:
        entries = [e for e in entries if e.get('decision', '').upper() == decision.upper()]
    if min_confidence > 0:
        entries = [e for e in entries if e.get('confidence', 0) >= min_confidence]

    total = len(entries)
    entries = entries[:limit]

    # Estatísticas
    all_entries = list(_history_cache)
    buy_count = sum(1 for e in all_entries if e.get('decision', '').upper() == 'BUY')
    sell_count = sum(1 for e in all_entries if e.get('decision', '').upper() == 'SELL')
    hold_count = sum(1 for e in all_entries if e.get('decision', '').upper() == 'HOLD')
    avg_conf = sum(e.get('confidence', 0) for e in all_entries) / max(len(all_entries), 1)
    high_conf = sum(1 for e in all_entries if e.get('confidence', 0) >= 70)

    return {
        'entries': entries,
        'total': total,
        'stats': {
            'total_decisions': len(all_entries),
            'buy_count': buy_count,
            'sell_count': sell_count,
            'hold_count': hold_count,
            'avg_confidence': round(avg_conf, 1),
            'high_confidence_count': high_conf,
        },
    }


def clear_history():
    """Limpa todo o histórico."""
    _history_cache.clear()
    try:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
    except Exception:
        pass
    return True
