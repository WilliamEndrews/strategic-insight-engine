"""
SUSE - Sistema de Alertas (alerts.py)

FASE 3 - Multi-ativos, Multitimeframe, Gestão de Risco, Alertas

Funcionalidades:
1. Geração de alertas baseados em decisões da IA (confiança alta, sinais BUY/SELL)
2. Alertas de risco (exposição, drawdown, SL muito curto)
3. Alertas de sistema (conexão, dados, modelo)
4. Histórico de alertas em memória (últimos 100)
5. Filtros por nível, categoria e símbolo
"""

import uuid
from datetime import datetime
from collections import deque

# Histórico em memória (últimos 100 alertas)
_alerts_history = deque(maxlen=100)


def create_alert(level, category, title, message, symbol=None, timeframe=None, data=None):
    """Cria um alerta estruturado."""
    alert = {
        'id': str(uuid.uuid4())[:8],
        'level': level,
        'category': category,
        'title': title,
        'message': message,
        'symbol': symbol,
        'timeframe': timeframe,
        'timestamp': datetime.now().isoformat(),
        'acknowledged': False,
        'data': data or {},
    }
    _alerts_history.append(alert)
    return alert


def generate_ia_alerts(ia_result, symbol='UNKNOWN', timeframe='M5'):
    """
    Gera alertas baseados no resultado da IA.

    Args:
        ia_result: dict retornado por run_ia() com decision, confidence, warnings, etc.
        symbol: símbolo do ativo
        timeframe: timeframe analisado

    Returns:
        lista de alertas gerados
    """
    alerts = []
    decision = ia_result.get('decision', 'HOLD')
    confidence = ia_result.get('confidence', 0)
    warnings = ia_result.get('warnings', [])
    duration = ia_result.get('estimated_duration', {})

    # Alerta de sinal de alta confiança
    if decision in ('BUY', 'SELL') and confidence >= 75:
        level = 'SUCCESS'
        title = f'Sinal forte de {decision}'
        msg = f'{symbol} {timeframe}: IA recomenda {decision} com {confidence:.0f}% de confiança.'
        if duration:
            msg += f' Duração estimada: {duration.get("min", 0)}-{duration.get("max", 0)} min.'
        alerts.append(create_alert(level, 'SIGNAL', title, msg, symbol, timeframe, {
            'decision': decision,
            'confidence': confidence,
            'duration': duration,
        }))

    # Alerta de sinal moderado
    elif decision in ('BUY', 'SELL') and confidence >= 60:
        level = 'INFO'
        title = f'Sinal moderado de {decision}'
        msg = f'{symbol} {timeframe}: IA sugere {decision} com {confidence:.0f}% de confiança. Operar com cautela.'
        alerts.append(create_alert(level, 'SIGNAL', title, msg, symbol, timeframe, {
            'decision': decision,
            'confidence': confidence,
        }))

    # Alerta de baixa confiança
    if confidence < 50:
        alerts.append(create_alert(
            'WARNING', 'SIGNAL',
            'Baixa confiança na análise',
            f'{symbol} {timeframe}: Confiança de apenas {confidence:.0f}%. Recomenda-se aguardar.',
            symbol, timeframe, {'confidence': confidence}
        ))

    # Alertas de warnings da IA
    for w in warnings:
        if 'baixa confiança' in w.lower():
            continue  # já tratado acima
        alerts.append(create_alert(
            'WARNING', 'RISK',
            'Aviso de risco da IA',
            f'{symbol} {timeframe}: {w}',
            symbol, timeframe
        ))

    # Alerta de duração longa
    max_duration = duration.get('max', 0)
    if max_duration > 60:
        alerts.append(create_alert(
            'WARNING', 'RISK',
            'Duração estimada longa',
            f'{symbol} {timeframe}: Duração máxima estimada de {max_duration} min. Considere exposição temporal.',
            symbol, timeframe, {'max_duration': max_duration}
        ))

    return alerts


def generate_risk_alerts(risk_assessment, symbol='UNKNOWN'):
    """
    Gera alertas baseados na avaliação de risco.

    Args:
        risk_assessment: dict retornado por assess_risk()
        symbol: símbolo do ativo

    Returns:
        lista de alertas gerados
    """
    alerts = []
    exposure = risk_assessment.get('exposure', {})
    warnings = risk_assessment.get('warnings', [])
    rr = risk_assessment.get('risk_reward_ratio', 0)

    # Exposição excedida
    if not exposure.get('available', True):
        alerts.append(create_alert(
            'CRITICAL', 'RISK',
            'Exposição máxima excedida',
            f'{symbol}: Risco total de {exposure.get("total_risk_percent", 0):.1f}% excede o máximo de {exposure.get("max_allowed_percent", 0)}%. Não abrir novas posições.',
            symbol, data=exposure
        ))

    # R:R desfavorável
    if rr < 1.0 and rr > 0:
        alerts.append(create_alert(
            'CRITICAL', 'RISK',
            'Risk-Reward desfavorável',
            f'{symbol}: R:R de {rr:.2f}:1 é menor que 1:1. Operação não recomendada.',
            symbol, data={'rr': rr}
        ))

    # Warnings do risk manager
    for w in warnings:
        level = 'WARNING'
        if 'excede' in w.lower() or 'desfavorável' in w.lower():
            level = 'CRITICAL'
        alerts.append(create_alert(level, 'RISK', 'Aviso de gestão de risco', f'{symbol}: {w}', symbol))

    return alerts


def get_alerts(limit=50, level=None, category=None, symbol=None, unacknowledged_only=False):
    """
    Retorna alertas do histórico com filtros opcionais.

    Args:
        limit: número máximo de alertas
        level: filtrar por nível (INFO, WARNING, CRITICAL, SUCCESS)
        category: filtrar por categoria (SIGNAL, RISK, SYSTEM, PRICE)
        symbol: filtrar por símbolo
        unacknowledged_only: retornar apenas não reconhecidos

    Returns:
        lista de alertas filtrados
    """
    result = list(_alerts_history)
    result.reverse()  # mais recentes primeiro

    if level:
        result = [a for a in result if a['level'] == level]
    if category:
        result = [a for a in result if a['category'] == category]
    if symbol:
        result = [a for a in result if a.get('symbol') == symbol]
    if unacknowledged_only:
        result = [a for a in result if not a['acknowledged']]

    return result[:limit]


def acknowledge_alert(alert_id):
    """Marca um alerta como reconhecido."""
    for a in _alerts_history:
        if a['id'] == alert_id:
            a['acknowledged'] = True
            return True
    return False


def clear_alerts():
    """Limpa todo o histórico de alertas."""
    _alerts_history.clear()
    return True
