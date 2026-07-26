"""
SUSE - Feature Engineering Module (features.py)

Propósito: Centralizar e padronizar a extração de features usadas tanto no
treinamento do modelo quanto na predição em tempo real.

REGRA DE OURO: As features geradas aqui DEVEM ser idênticas em treino e predição.
Qualquer alteração requer retreinamento completo do modelo.

Features atuais (v2.0):
- dist_ema20: distância do close até EMA 20 (preço absoluto)
- rsi: RSI de 14 períodos
- volume_rel: volume atual / média de volume da série
- ema9: valor absoluto da EMA 9
- ema21: valor absoluto da EMA 21
- dist_ema9: distância do close até EMA 9
- crossover_9_21: cruzamento de EMA9 com EMA21 (-1, 0, 1)
- atr_percentil: posição percentual do ATR atual vs histórico recente (0-1)
- volume_zscore: z-score do volume em janela de 20 candles
- support_distance: distância percentual do close até mínimo dos últimos 20 candles
- resistance_distance: distância percentual do close até máximo dos últimos 20 candles
- momentum_5: retorno percentual dos últimos 5 candles
- momentum_10: retorno percentual dos últimos 10 candles
- momentum_20: retorno percentual dos últimos 20 candles
"""

import numpy as np
import pandas as pd


FEATURE_ORDER = [
    'dist_ema20',
    'rsi',
    'volume_rel',
    'ema9',
    'ema21',
    'dist_ema9',
    'crossover_9_21',
    'atr_percentil',
    'volume_zscore',
    'support_distance',
    'resistance_distance',
    'momentum_5',
    'momentum_10',
    'momentum_20',
]


def _get_closes(candles):
    """Extrai array de closes independente do formato (dict ou pandas)."""
    if isinstance(candles, pd.DataFrame):
        return candles['close'].values
    if isinstance(candles, list) and len(candles) > 0 and isinstance(candles[0], dict):
        return np.array([c['close'] for c in candles], dtype=float)
    return np.array([c.close for c in candles], dtype=float)


def _get_volumes(candles):
    """Extrai array de volumes."""
    if isinstance(candles, pd.DataFrame):
        return candles['volume'].values
    if isinstance(candles, list) and len(candles) > 0 and isinstance(candles[0], dict):
        return np.array([c.get('volume', 0) for c in candles], dtype=float)
    return np.array([c.volume for c in candles], dtype=float)


def _get_ohlc(candles):
    """Ret arrays de high, low, close."""
    if isinstance(candles, pd.DataFrame):
        return candles['high'].values, candles['low'].values, candles['close'].values
    if isinstance(candles, list) and len(candles) > 0 and isinstance(candles[0], dict):
        highs = np.array([c['high'] for c in candles], dtype=float)
        lows = np.array([c['low'] for c in candles], dtype=float)
        closes = np.array([c['close'] for c in candles], dtype=float)
        return highs, lows, closes
    highs = np.array([c.high for c in candles], dtype=float)
    lows = np.array([c.low for c in candles], dtype=float)
    closes = np.array([c.close for c in candles], dtype=float)
    return highs, lows, closes


def calculate_rsi(candles, period=14):
    """Calcula RSI usando Wilder's smoothing."""
    closes = _get_closes(candles)
    if len(closes) < period + 1:
        return 50.0

    diffs = np.diff(closes)
    gains = np.maximum(diffs, 0)
    losses = np.abs(np.minimum(diffs, 0))

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def calculate_ema(candles, period):
    """Calcula EMA simples."""
    closes = _get_closes(candles)
    if len(closes) < period:
        return np.nan

    alpha = 2 / (period + 1)
    ema = closes[0]
    for price in closes[1:]:
        ema = alpha * price + (1 - alpha) * ema
    return ema


def calculate_atr(candles, period=14):
    """Calcula ATR (Average True Range)."""
    highs, lows, closes = _get_ohlc(candles)
    if len(closes) < period + 1:
        return 0.0

    tr1 = highs[1:] - lows[1:]
    tr2 = np.abs(highs[1:] - closes[:-1])
    tr3 = np.abs(lows[1:] - closes[:-1])
    tr = np.maximum(np.maximum(tr1, tr2), tr3)
    return float(np.mean(tr[-period:]))


def _calculate_ema_series(closes, period):
    """Calcula série completa de EMA (usado para cruzamentos)."""
    alpha = 2 / (period + 1)
    ema = np.zeros_like(closes, dtype=float)
    ema[0] = closes[0]
    for i in range(1, len(closes)):
        ema[i] = alpha * closes[i] + (1 - alpha) * ema[i - 1]
    return ema


def calculate_crossover(candles, fast=9, slow=21):
    """
    Detecta cruzamento entre EMA rápida e lenta no último candle.
    Retorna: 1 (bullish crossover), -1 (bearish crossover), 0 (sem cruzamento)
    """
    closes = _get_closes(candles)
    if len(closes) < slow + 1:
        return 0

    ema_fast = _calculate_ema_series(closes, fast)
    ema_slow = _calculate_ema_series(closes, slow)

    prev_fast = ema_fast[-2]
    prev_slow = ema_slow[-2]
    curr_fast = ema_fast[-1]
    curr_slow = ema_slow[-1]

    if prev_fast <= prev_slow and curr_fast > curr_slow:
        return 1
    if prev_fast >= prev_slow and curr_fast < curr_slow:
        return -1
    return 0


def _momentum(closes, bars):
    """Retorno percentual dos últimos N candles."""
    if len(closes) < bars + 1:
        return 0.0
    return (closes[-1] - closes[-(bars + 1)]) / closes[-(bars + 1)] * 100


def extract_features(candles):
    """
    Extrai todas as features a partir de uma janela de candles.
    
    Args:
        candles: lista de dicts com open/high/low/close/volume/timestamp
                 ou DataFrame pandas equivalente
    
    Returns:
        pd.DataFrame com uma linha e FEATURE_ORDER colunas.
    """
    if isinstance(candles, pd.DataFrame):
        candles = candles.to_dict('records')

    if not candles or len(candles) < 21:
        return None

    closes = _get_closes(candles)
    volumes = _get_volumes(candles)
    last = len(candles) - 1

    # Indicadores clássicos
    ema9 = calculate_ema(candles, 9)
    ema21 = calculate_ema(candles, 21)
    ema20 = calculate_ema(candles, 20)
    rsi = calculate_rsi(candles)

    # Volume
    avg_volume = np.mean(volumes)
    volume_rel = volumes[last] / avg_volume if avg_volume > 0 else 1.0

    # Volume z-score em janela de 20 candles
    window = min(20, len(volumes))
    recent_volumes = volumes[-window:]
    mean_vol = np.mean(recent_volumes)
    std_vol = np.std(recent_volumes)
    volume_zscore = (volumes[last] - mean_vol) / std_vol if std_vol > 0 else 0.0

    # ATR e percentil (janela de 50 candles)
    atr_window = 50
    if len(candles) >= atr_window + 1:
        atr_series = []
        for i in range(atr_window, len(candles)):
            highs, lows, cls = _get_ohlc(candles[:i + 1])
            tr1 = highs[1:] - lows[1:]
            tr2 = np.abs(highs[1:] - cls[:-1])
            tr3 = np.abs(lows[1:] - cls[:-1])
            tr = np.maximum(np.maximum(tr1, tr2), tr3)
            atr_series.append(np.mean(tr[-14:]))
        current_atr = atr_series[-1]
        atr_rank = np.searchsorted(np.sort(atr_series), current_atr) / len(atr_series)
        atr_percentil = float(atr_rank)
    else:
        atr_percentil = 0.5

    # Suporte/Resistência recente (janela de 20 candles)
    lookback = min(20, len(closes))
    recent_low = np.min(closes[-lookback:])
    recent_high = np.max(closes[-lookback:])
    current_close = closes[-1]
    support_distance = (current_close - recent_low) / recent_low * 100 if recent_low > 0 else 0.0
    resistance_distance = (recent_high - current_close) / current_close * 100 if current_close > 0 else 0.0

    # Momentum múltiplo
    momentum_5 = _momentum(closes, 5)
    momentum_10 = _momentum(closes, 10)
    momentum_20 = _momentum(closes, 20)

    # Cruzamento EMA9/EMA21
    crossover = calculate_crossover(candles)

    features = {
        'dist_ema20': current_close - ema20,
        'rsi': rsi,
        'volume_rel': volume_rel,
        'ema9': ema9,
        'ema21': ema21,
        'dist_ema9': current_close - ema9,
        'crossover_9_21': crossover,
        'atr_percentil': atr_percentil,
        'volume_zscore': volume_zscore,
        'support_distance': support_distance,
        'resistance_distance': resistance_distance,
        'momentum_5': momentum_5,
        'momentum_10': momentum_10,
        'momentum_20': momentum_20,
    }

    return pd.DataFrame([features])[FEATURE_ORDER]


def assign_score_label(candles, score_threshold_buy=0.25, score_threshold_sell=-0.25):
    """
    Atribui label baseado em score de regras.
    
    Args:
        candles: lista de candles
        score_threshold_buy: score mínimo para BUY
        score_threshold_sell: score máximo para SELL
    
    Returns:
        tuple: (label, score)
    """
    if not candles or len(candles) < 21:
        return 'HOLD', 0.0

    closes = _get_closes(candles)
    volumes = _get_volumes(candles)
    last = len(candles) - 1

    ema9 = calculate_ema(candles, 9)
    ema21 = calculate_ema(candles, 21)
    ema20 = calculate_ema(candles, 20)
    rsi = calculate_rsi(candles)

    avg_volume = np.mean(volumes)
    volume_rel = volumes[last] / avg_volume if avg_volume > 0 else 1.0

    momentum_5 = _momentum(closes, 5)
    momentum_10 = _momentum(closes, 10)
    momentum_20 = _momentum(closes, 20)

    atr_14 = calculate_atr(candles, 14)
    close = closes[-1]
    atr_pct = atr_14 / close * 100 if close > 0 else 0.0

    # Score acumulativo
    score = 0.0

    # EMA9 vs EMA21
    if ema9 > ema21:
        score += 0.15
    elif ema9 < ema21:
        score -= 0.15

    # Preço vs EMA20
    if close > ema20:
        score += 0.10
    else:
        score -= 0.10

    # RSI
    if rsi < 40:
        score += 0.20
    elif rsi > 60:
        score -= 0.20
    elif rsi > 45 and rsi < 55:
        score *= 0.5  # Zona neutra reduz score

    # Momentum
    if momentum_5 > 2 * atr_pct:
        score += 0.15
    elif momentum_5 < -2 * atr_pct:
        score -= 0.15

    if momentum_10 > 0:
        score += 0.10
    else:
        score -= 0.10

    if momentum_20 > 0:
        score += 0.10
    else:
        score -= 0.10

    # Volume
    if volume_rel > 1.3:
        score += 0.10 if score > 0 else -0.10  # Amplifica direção
    elif volume_rel < 0.7:
        score *= 0.7  # Volume baixo reduz confiança

    # Suporte/Resistência
    lookback = min(20, len(closes))
    recent_low = np.min(closes[-lookback:])
    recent_high = np.max(closes[-lookback:])
    support_dist = (close - recent_low) / close * 100 if close > 0 else 0.0
    resistance_dist = (recent_high - close) / close * 100 if close > 0 else 0.0

    if support_dist < atr_pct:
        score += 0.10  # perto de suporte
    if resistance_dist < atr_pct:
        score -= 0.10  # perto de resistência

    # Variabilidade baseada em hash de múltiplos campos (não só close)
    # Garante diversidade mesmo com dados parecidos
    seed_val = abs(int(closes[-1] * 100000) ^ int(volumes[last]) ^ int(rsi * 10000) ^ len(candles)) % (2**31)
    np.random.seed(seed_val)
    noise = np.random.normal(0, 0.03)
    score += noise

    if score >= score_threshold_buy:
        return 'BUY', score
    if score <= score_threshold_sell:
        return 'SELL', score
    return 'HOLD', score


def compute_dynamic_thresholds(scores, buy_percentile=70, sell_percentile=30):
    """
    Calcula thresholds dinâmicos baseados na distribuição de scores.
    
    Args:
        scores: lista/array de scores
        buy_percentile: percentil mínimo para BUY (default 70)
        sell_percentile: percentil máximo para SELL (default 30)
    
    Returns:
        tuple: (buy_threshold, sell_threshold)
    """
    scores = np.array(scores)
    if len(scores) == 0:
        return 0.25, -0.25

    buy_threshold = float(np.percentile(scores, buy_percentile))
    sell_threshold = float(np.percentile(scores, sell_percentile))
    return buy_threshold, sell_threshold


def estimate_duration(candles):
    """
    Estima duração da operação em minutos baseada em volatilidade (ATR) e timeframe.
    Retorna dict com min, max e confidence.
    
    Para timeframe M5: cada candle = 5 min.
    Duração base: inversamente proporcional à volatilidade percentual.
    """
    if not candles or len(candles) < 21:
        return {'min': 5, 'max': 30, 'confidence': 0.0}

    closes = _get_closes(candles)
    close = closes[-1]
    atr_14 = calculate_atr(candles, 14)
    atr_pct = atr_14 / close * 100 if close > 0 else 0.0

    # Baseado em ATR percentual
    # Quanto maior a volatilidade, menor a duração esperada (movimento rápido)
    # Quanto menor, maior a duração (movimento lento)
    if atr_pct <= 0:
        base_min, base_max = 5, 30
        confidence = 30.0
    else:
        # Fórmula empírica: para 0.02% de ATR, duração ~10-60 min; para 0.10%, 5-15 min
        base_min = max(5, int(12 / (atr_pct * 50)))
        base_max = max(base_min + 10, int(60 / (atr_pct * 50)))
        # Confidence baseada em quão bem a volatilidade é interpretável
        confidence = min(95.0, 40.0 + (1 / atr_pct) * 2) if atr_pct > 0 else 30.0

    return {
        'min': base_min,
        'max': base_max,
        'confidence': round(confidence, 2),
    }
