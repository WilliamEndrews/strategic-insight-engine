"""
SUSE - Gestão de Risco (risk_manager.py)

FASE 3 - Multi-ativos, Multitimeframe, Gestão de Risco, Alertas

Funcionalidades:
1. Cálculo de position sizing baseado em risco percentual da conta
2. Cálculo de stop loss / take profit em preço e pips
3. Risk-Reward Ratio
4. Controle de exposição máxima (múltiplas posições)
5. Recomendações automáticas de risco
"""

from datetime import datetime
import numpy as np


def calculate_position_size(account_balance, risk_percent, stop_loss_pips, pip_value_per_lot=10.0):
    """
    Calcula o tamanho ideal de posição (lotes) baseado no risco.

    Args:
        account_balance: saldo da conta em unidades monetárias
        risk_percent: percentual do saldo a arriscar (ex: 1.0 = 1%)
        stop_loss_pips: stop loss em pips
        pip_value_per_lot: valor de 1 pip para 1 lote padrão (default: $10 para EUR/USD)

    Returns:
        dict com lots recomendados, valor em risco, pip value
    """
    risk_amount = account_balance * (risk_percent / 100.0)

    if stop_loss_pips <= 0 or pip_value_per_lot <= 0:
        return {
            'recommended_lots': 0.0,
            'risk_amount': round(risk_amount, 2),
            'risk_percent': risk_percent,
            'pip_value': 0.0,
        }

    # lots = risk_amount / (stop_loss_pips * pip_value_per_lot)
    lots = risk_amount / (stop_loss_pips * pip_value_per_lot)

    # Arredondar para micro-lotes (0.01)
    lots = max(0.01, round(lots, 2))

    # Recalcular valor real em risco com o arredondamento
    actual_risk = lots * stop_loss_pips * pip_value_per_lot
    actual_risk_percent = (actual_risk / account_balance * 100) if account_balance > 0 else 0

    return {
        'recommended_lots': lots,
        'risk_amount': round(actual_risk, 2),
        'risk_percent': round(actual_risk_percent, 2),
        'pip_value': round(lots * pip_value_per_lot, 2),
    }


def calculate_sl_tp(entry_price, stop_loss_pips, take_profit_pips, direction='BUY', pip_size=0.0001):
    """
    Calcula preços de stop loss e take profit.

    Args:
        entry_price: preço de entrada
        stop_loss_pips: distância do SL em pips
        take_profit_pips: distância do TP em pips
        direction: 'BUY' ou 'SELL'
        pip_size: tamanho de 1 pip (0.0001 para pares FX principais, 0.01 para JPY)

    Returns:
        dict com preços de SL e TP, distâncias em percentual
    """
    sl_distance = stop_loss_pips * pip_size
    tp_distance = take_profit_pips * pip_size

    if direction == 'BUY':
        sl_price = entry_price - sl_distance
        tp_price = entry_price + tp_distance
    else:
        sl_price = entry_price + sl_distance
        tp_price = entry_price - tp_distance

    sl_percent = (sl_distance / entry_price * 100) if entry_price > 0 else 0
    tp_percent = (tp_distance / entry_price * 100) if entry_price > 0 else 0

    return {
        'stop_loss': {
            'price': round(sl_price, 5),
            'pips': stop_loss_pips,
            'distance_percent': round(sl_percent, 3),
        },
        'take_profit': {
            'price': round(tp_price, 5),
            'pips': take_profit_pips,
            'distance_percent': round(tp_percent, 3),
        },
    }


def assess_risk(config):
    """
    Avaliação completa de risco para uma operação.

    Args:
        config: dict com:
            - account_balance: saldo da conta
            - risk_per_trade_percent: % de risco por trade
            - max_risk_percent: % máximo de risco total permitido
            - stop_loss_pips: SL em pips
            - take_profit_pips: TP em pips
            - pip_value: valor de 1 pip por lote
            - current_positions: número de posições abertas (opcional)
            - open_risk_percent: % de risco já comprometido (opcional)
            - entry_price: preço de entrada (opcional, usa último close)
            - direction: 'BUY' ou 'SELL' (opcional, default BUY)

    Returns:
        RiskAssessment completo
    """
    balance = float(config.get('account_balance', 10000))
    risk_pct = float(config.get('risk_per_trade_percent', 1.0))
    max_risk_pct = float(config.get('max_risk_percent', 3.0))
    sl_pips = float(config.get('stop_loss_pips', 30))
    tp_pips = float(config.get('take_profit_pips', 60))
    pip_value = float(config.get('pip_value', 10.0))
    current_positions = int(config.get('current_positions', 0))
    open_risk_pct = float(config.get('open_risk_percent', 0))
    entry_price = float(config.get('entry_price', 0))
    direction = config.get('direction', 'BUY').upper()
    pip_size = float(config.get('pip_size', 0.0001))

    # Position sizing
    pos = calculate_position_size(balance, risk_pct, sl_pips, pip_value)

    # SL/TP
    if entry_price > 0:
        sl_tp = calculate_sl_tp(entry_price, sl_pips, tp_pips, direction, pip_size)
    else:
        sl_tp = {
            'stop_loss': {'price': 0, 'pips': sl_pips, 'distance_percent': 0},
            'take_profit': {'price': 0, 'pips': tp_pips, 'distance_percent': 0},
        }

    # Risk-Reward Ratio
    rr_ratio = tp_pips / sl_pips if sl_pips > 0 else 0

    # Exposição
    total_risk = open_risk_pct + pos['risk_percent']
    available = total_risk < max_risk_pct

    # Warnings
    warnings = []
    if pos['risk_percent'] > risk_pct:
        warnings.append(f"Risco real ({pos['risk_percent']}%) difere do alvo ({risk_pct}%) devido ao arredondamento de lotes")
    if total_risk > max_risk_pct:
        warnings.append(f"Exposição total ({total_risk:.2f}%) excede o máximo permitido ({max_risk_pct}%)")
    if rr_ratio < 1.5:
        warnings.append(f"Risk-Reward Ratio ({rr_ratio:.2f}) abaixo do recomendado (mínimo 1.5)")
    if sl_pips < 10:
        warnings.append("Stop loss muito curto (< 10 pips) — risco de stop prematuro por spread/noise")
    if tp_pips > 200:
        warnings.append("Take profit muito distante (> 200 pips) — considere parcial")

    # Recommendations
    recommendations = []
    if rr_ratio >= 2.0:
        recommendations.append(f"Excelente R:R de {rr_ratio:.1f}:1 — operação favorável")
    elif rr_ratio >= 1.5:
        recommendations.append(f"R:R aceitável de {rr_ratio:.1f}:1")
    else:
        recommendations.append("Aumente o take profit ou reduza o stop loss para R:R ≥ 1.5")

    if available and not warnings:
        recommendations.append("Exposição dentro dos limites — operação autorizada")
    elif not available:
        recommendations.append("Reduza posições abertas antes de entrar nova operação")

    if pos['recommended_lots'] <= 0.01:
        recommendations.append("Tamanho mínimo de posição — considere conta com mais capital")

    return {
        'position_size': pos,
        'stop_loss': sl_tp['stop_loss'],
        'take_profit': sl_tp['take_profit'],
        'risk_reward_ratio': round(rr_ratio, 2),
        'max_loss': pos['risk_amount'],
        'max_loss_percent': pos['risk_percent'],
        'exposure': {
            'current_positions': current_positions,
            'total_risk_percent': round(total_risk, 2),
            'max_allowed_percent': max_risk_pct,
            'available': available,
        },
        'warnings': warnings,
        'recommendations': recommendations,
        'timestamp': datetime.now().isoformat(),
    }
