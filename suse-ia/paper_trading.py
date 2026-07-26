"""
SUSE - Paper Trading (paper_trading.py)

FASE 4 - UX/UI, Histórico de Decisões, Paper Trading

Funcionalidades:
1. Conta virtual com saldo configurável
2. Abrir/fechar posições manuais ou baseadas na IA
3. Cálculo de P&L em tempo real (mark-to-market)
4. Estatísticas: win rate, profit factor, total pips
5. Reset da conta
"""

import uuid
from datetime import datetime

# Estado global da conta virtual
_account = {
    'balance': 10000.0,
    'initial_balance': 10000.0,
    'positions': [],  # lista de PaperPosition
    'closed_positions': [],
    'pip_value_per_lot': 10.0,  # $10 por pip por lote (EUR/USD)
    'pip_size': 0.0001,
}

# Histórico de trades fechados para estatísticas
_trade_history = []


def _get_pip_size(symbol):
    """Retorna o tamanho do pip para o símbolo."""
    if 'JPY' in symbol:
        return 0.01
    if 'BTC' in symbol:
        return 1.0
    if 'ETH' in symbol:
        return 0.1
    return 0.0001


def _get_pip_value(symbol, lots):
    """Retorna o valor monetário de 1 pip para o símbolo e volume."""
    pip_size = _get_pip_size(symbol)
    # Para FX: 1 pip = pip_size * lot_size * 100000 (contrato padrão)
    # Simplificado: $10 por pip por lote para pares principais
    if 'JPY' in symbol:
        return lots * 9.1  # aproximado para JPY
    if 'BTC' in symbol:
        return lots * 1.0
    if 'ETH' in symbol:
        return lots * 1.0
    return lots * 10.0


def _calc_pnl(position, current_price):
    """Calcula P&L de uma posição aberta."""
    pip_size = _get_pip_size(position['symbol'])
    if position['direction'] == 'BUY':
        pips = (current_price - position['entry_price']) / pip_size
    else:
        pips = (position['entry_price'] - current_price) / pip_size
    pnl = pips * _get_pip_value(position['symbol'], position['volume_lots'])
    return round(pnl, 2), round(pips, 1)


def _pips_between(price1, price2, symbol):
    """Distância em pips entre dois preços."""
    pip_size = _get_pip_size(symbol)
    return round(abs(price1 - price2) / pip_size, 1)


def get_account(current_prices=None):
    """
    Retorna o estado atual da conta com P&L mark-to-market.

    Args:
        current_prices: dict {symbol: price} opcional para calcular equity

    Returns:
        PaperTradingAccount
    """
    current_prices = current_prices or {}
    positions = _account['positions']
    closed = _account['closed_positions']

    # Calcular equity (balance + P&L flutuante)
    floating_pnl = 0.0
    for pos in positions:
        price = current_prices.get(pos['symbol'], pos['entry_price'])
        pnl, _ = _calc_pnl(pos, price)
        floating_pnl += pnl

    equity = _account['balance'] + floating_pnl
    margin_used = sum(p['volume_lots'] * 1000 for p in positions)  # margem simplificada
    free_margin = equity - margin_used

    # Estatísticas de trades fechados
    win_count = sum(1 for t in closed if t['pnl'] > 0)
    loss_count = sum(1 for t in closed if t['pnl'] < 0)
    total_trades = win_count + loss_count
    win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0

    total_pnl = sum(t['pnl'] for t in closed)
    total_pips = sum(t['pnl_pips'] for t in closed)

    gross_profit = sum(t['pnl'] for t in closed if t['pnl'] > 0)
    gross_loss = abs(sum(t['pnl'] for t in closed if t['pnl'] < 0))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else (999.0 if gross_profit > 0 else 0)

    largest_win = max((t['pnl'] for t in closed), default=0)
    largest_loss = min((t['pnl'] for t in closed), default=0)

    # Atualizar P&L das posições abertas para exibição
    display_positions = []
    for pos in positions:
        price = current_prices.get(pos['symbol'], pos['entry_price'])
        pnl, pnl_pips = _calc_pnl(pos, price)
        pips_to_sl = _pips_between(price, pos['stop_loss'], pos['symbol'])
        pips_to_tp = _pips_between(price, pos['take_profit'], pos['symbol'])
        display_positions.append({
            **pos,
            'pnl': pnl,
            'pnl_pips': pnl_pips,
            'pips_to_sl': round(pips_to_sl, 1),
            'pips_to_tp': round(pips_to_tp, 1),
        })

    return {
        'balance': round(_account['balance'], 2),
        'equity': round(equity, 2),
        'margin_used': round(margin_used, 2),
        'free_margin': round(free_margin, 2),
        'open_positions': len(positions),
        'total_positions': len(positions) + len(closed),
        'win_count': win_count,
        'loss_count': loss_count,
        'win_rate': round(win_rate, 1),
        'total_pnl': round(total_pnl, 2),
        'total_pips': round(total_pips, 1),
        'largest_win': round(largest_win, 2),
        'largest_loss': round(largest_loss, 2),
        'profit_factor': round(profit_factor, 2),
        'positions': display_positions,
    }


def open_position(params):
    """
    Abre uma nova posição virtual.

    Args:
        params: dict com symbol, direction, volume_lots, entry_price,
                stop_loss_pips, take_profit_pips, confidence, timeframe

    Returns:
        PaperTradeResult
    """
    symbol = params.get('symbol', 'EURUSD')
    direction = params.get('direction', 'BUY').upper()
    volume = float(params.get('volume_lots', 0.1))
    entry_price = float(params.get('entry_price', 0))
    sl_pips = float(params.get('stop_loss_pips', 30))
    tp_pips = float(params.get('take_profit_pips', 60))
    confidence = float(params.get('confidence', 0))
    timeframe = params.get('timeframe', 'M5')

    if entry_price <= 0:
        return {
            'success': False,
            'message': 'Preço de entrada não fornecido',
            'account': get_account(),
        }

    pip_size = _get_pip_size(symbol)
    sl_distance = sl_pips * pip_size
    tp_distance = tp_pips * pip_size

    if direction == 'BUY':
        sl_price = entry_price - sl_distance
        tp_price = entry_price + tp_distance
    else:
        sl_price = entry_price + sl_distance
        tp_price = entry_price - tp_distance

    position = {
        'id': str(uuid.uuid4())[:8],
        'symbol': symbol,
        'timeframe': timeframe,
        'direction': direction,
        'entry_price': round(entry_price, 5),
        'exit_price': None,
        'volume_lots': volume,
        'stop_loss': round(sl_price, 5),
        'take_profit': round(tp_price, 5),
        'open_time': datetime.now().isoformat(),
        'close_time': None,
        'status': 'OPEN',
        'pnl': 0,
        'pnl_pips': 0,
        'pips_to_sl': sl_pips,
        'pips_to_tp': tp_pips,
        'confidence_at_open': confidence,
        'close_reason': None,
    }

    _account['positions'].append(position)

    return {
        'success': True,
        'message': f'Posição {direction} {symbol} aberta a {entry_price:.5f}',
        'account': get_account(),
        'position': position,
    }


def close_position(params):
    """
    Fecha uma posição existente.

    Args:
        params: dict com position_id, current_price, reason (opcional)

    Returns:
        PaperTradeResult
    """
    position_id = params.get('position_id')
    current_price = float(params.get('current_price', 0))
    reason = params.get('reason', 'MANUAL')

    if not position_id:
        return {'success': False, 'message': 'ID da posição não fornecido', 'account': get_account()}

    if current_price <= 0:
        return {'success': False, 'message': 'Preço atual não fornecido', 'account': get_account()}

    pos = None
    for i, p in enumerate(_account['positions']):
        if p['id'] == position_id:
            pos = _account['positions'].pop(i)
            break

    if not pos:
        return {'success': False, 'message': 'Posição não encontrada', 'account': get_account()}

    pnl, pnl_pips = _calc_pnl(pos, current_price)

    # Atualizar saldo
    _account['balance'] += pnl

    closed = {
        **pos,
        'exit_price': round(current_price, 5),
        'close_time': datetime.now().isoformat(),
        'status': 'STOPPED' if reason == 'STOP_LOSS' else 'TARGET_HIT' if reason == 'TAKE_PROFIT' else 'CLOSED',
        'pnl': pnl,
        'pnl_pips': pnl_pips,
        'close_reason': reason,
    }

    _account['closed_positions'].append(closed)

    return {
        'success': True,
        'message': f'Posição fechada: P&L ${pnl:.2f} ({pnl_pips:.1f} pips)',
        'account': get_account(),
        'position': closed,
    }


def update_sl_tp(params):
    """
    Atualiza stop loss e take profit de uma posição aberta.

    Args:
        params: dict com position_id, stop_loss_pips, take_profit_pips, current_price

    Returns:
        PaperTradeResult
    """
    position_id = params.get('position_id')
    sl_pips = params.get('stop_loss_pips')
    tp_pips = params.get('take_profit_pips')

    if not position_id:
        return {'success': False, 'message': 'ID da posição não fornecido', 'account': get_account()}

    for p in _account['positions']:
        if p['id'] == position_id:
            pip_size = _get_pip_size(p['symbol'])
            if sl_pips is not None:
                sl_dist = float(sl_pips) * pip_size
                if p['direction'] == 'BUY':
                    p['stop_loss'] = round(p['entry_price'] - sl_dist, 5)
                else:
                    p['stop_loss'] = round(p['entry_price'] + sl_dist, 5)
            if tp_pips is not None:
                tp_dist = float(tp_pips) * pip_size
                if p['direction'] == 'BUY':
                    p['take_profit'] = round(p['entry_price'] + tp_dist, 5)
                else:
                    p['take_profit'] = round(p['entry_price'] - tp_dist, 5)
            return {
                'success': True,
                'message': 'SL/TP atualizado',
                'account': get_account(),
                'position': p,
            }

    return {'success': False, 'message': 'Posição não encontrada', 'account': get_account()}


def reset_account(initial_balance=10000.0):
    """Reseta a conta para o saldo inicial."""
    _account['balance'] = initial_balance
    _account['initial_balance'] = initial_balance
    _account['positions'] = []
    _account['closed_positions'] = []
    return {
        'success': True,
        'message': f'Conta resetada para ${initial_balance:,.2f}',
        'account': get_account(),
    }


def handle_paper_trade(params):
    """
    Roteador principal para ações de paper trading.

    Args:
        params: dict com 'action' e parâmetros específicos

    Returns:
        PaperTradeResult
    """
    action = params.get('action', '').upper()

    if action == 'OPEN':
        return open_position(params)
    elif action == 'CLOSE':
        return close_position(params)
    elif action == 'UPDATE_SL_TP':
        return update_sl_tp(params)
    elif action == 'RESET':
        return reset_account(float(params.get('initial_balance', 10000)))
    elif action == 'STATUS':
        return {'success': True, 'message': 'OK', 'account': get_account(params.get('current_prices'))}
    else:
        return {'success': False, 'message': f'Ação desconhecida: {action}', 'account': get_account()}
