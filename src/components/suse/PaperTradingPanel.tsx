/**
 * SUSE - PaperTradingPanel Component
 * FASE 4: Conta virtual para paper trading com P&L em tempo real.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, X, RefreshCw, Loader2,
  AlertTriangle, DollarSign, Percent, Target, Award, Activity
} from 'lucide-react';
import type { PaperTradingAccount, PaperTradeResult } from '@/types/trading';
import { cn } from '@/lib/utils';

interface PaperTradingPanelProps {
  className?: string;
  currentPrice?: number;
  currentDecision?: string;
  currentConfidence?: number;
}

export function PaperTradingPanel({ className, currentPrice = 0, currentDecision = 'HOLD', currentConfidence = 0 }: PaperTradingPanelProps) {
  const [account, setAccount] = useState<PaperTradingAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [form, setForm] = useState({
    direction: 'BUY' as 'BUY' | 'SELL',
    volume_lots: 0.1,
    stop_loss_pips: 30,
    take_profit_pips: 60,
  });

  const fetchAccount = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/paper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STATUS', current_prices: currentPrice > 0 ? { EURUSD: currentPrice } : {} }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result: PaperTradeResult = await resp.json();
      if (result.account) setAccount(result.account);
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentPrice]);

  useEffect(() => {
    fetchAccount();
    const interval = setInterval(fetchAccount, 5000);
    return () => clearInterval(interval);
  }, [fetchAccount]);

  const openPosition = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('http://localhost:4000/paper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN',
          symbol: 'EURUSD',
          timeframe: 'M5',
          direction: form.direction,
          volume_lots: form.volume_lots,
          entry_price: currentPrice,
          stop_loss_pips: form.stop_loss_pips,
          take_profit_pips: form.take_profit_pips,
          confidence: currentConfidence,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result: PaperTradeResult = await resp.json();
      if (!result.success) throw new Error(result.message);
      setAccount(result.account);
      setShowOpenForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (id: string) => {
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:4000/paper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE', position_id: id, current_price: currentPrice }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result: PaperTradeResult = await resp.json();
      if (result.account) setAccount(result.account);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAccount = async () => {
    try {
      const resp = await fetch('http://localhost:4000/paper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result: PaperTradeResult = await resp.json();
      if (result.account) setAccount(result.account);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const a = account;
  const floatingPnl = a ? a.equity - a.balance : 0;

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Paper Trading</h3>
            <p className="text-xs text-muted-foreground">Conta virtual — sem risco real</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowOpenForm(!showOpenForm)}
            disabled={currentPrice <= 0}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Plus className="w-3 h-3" /> Abrir
          </button>
          <button
            onClick={resetAccount}
            className="p-1.5 rounded-lg hover:bg-secondary transition"
            title="Resetar conta"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Account summary */}
      {a && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/20">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
              <p className="text-sm font-mono font-semibold">${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Equity</p>
              <p className={cn('text-sm font-mono font-semibold', floatingPnl >= 0 ? 'text-green-600' : 'text-red-600')}>
                ${a.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Win Rate</p>
              <p className="text-sm font-semibold">{a.win_rate.toFixed(0)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">P&L Total</p>
              <p className={cn('text-sm font-mono font-semibold', a.total_pnl >= 0 ? 'text-green-600' : 'text-red-600')}>
                ${a.total_pnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open form */}
      {showOpenForm && (
        <div className="p-3 bg-secondary/10 border-b border-border/30 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Direção:</span>
            <button
              onClick={() => setForm({ ...form, direction: 'BUY' })}
              className={cn('px-2 py-0.5 rounded text-[10px] font-medium',
                form.direction === 'BUY' ? 'bg-green-500/20 text-green-700' : 'bg-secondary text-muted-foreground')}
            >
              BUY
            </button>
            <button
              onClick={() => setForm({ ...form, direction: 'SELL' })}
              className={cn('px-2 py-0.5 rounded text-[10px] font-medium',
                form.direction === 'SELL' ? 'bg-red-500/20 text-red-700' : 'bg-secondary text-muted-foreground')}
            >
              SELL
            </button>
            <span className="text-[10px] text-muted-foreground ml-2">@ {currentPrice.toFixed(5)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Lotes</label>
              <input
                type="number" step="0.01" min="0.01"
                value={form.volume_lots}
                onChange={e => setForm({ ...form, volume_lots: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">SL (pips)</label>
              <input
                type="number" step="1"
                value={form.stop_loss_pips}
                onChange={e => setForm({ ...form, stop_loss_pips: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">TP (pips)</label>
              <input
                type="number" step="1"
                value={form.take_profit_pips}
                onChange={e => setForm({ ...form, take_profit_pips: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openPosition}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Confirmar
            </button>
            <button
              onClick={() => setShowOpenForm(false)}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition"
            >
              Cancelar
            </button>
            {currentDecision !== 'HOLD' && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                IA sugere: <span className={cn('font-semibold',
                  currentDecision === 'BUY' ? 'text-green-600' :
                  currentDecision === 'SELL' ? 'text-red-600' : 'text-yellow-600')}>
                  {currentDecision} ({currentConfidence.toFixed(0)}%)
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Positions */}
      <div className="max-h-60 overflow-y-auto">
        {a && a.positions.length > 0 ? (
          <div className="divide-y divide-border/20">
            {a.positions.map(pos => (
              <div key={pos.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
                    pos.direction === 'BUY' ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600')}>
                    {pos.direction === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {pos.direction}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{pos.symbol} • {pos.volume_lots} lots</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Entry: {pos.entry_price.toFixed(5)} • SL: {pos.stop_loss.toFixed(5)} • TP: {pos.take_profit.toFixed(5)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={cn('text-xs font-mono font-semibold', pos.pnl >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {pos.pnl_pips >= 0 ? '+' : ''}{pos.pnl_pips.toFixed(1)} pips
                    </p>
                  </div>
                  <button
                    onClick={() => closePosition(pos.id)}
                    disabled={loading}
                    className="p-1 rounded hover:bg-destructive/10 transition"
                    title="Fechar posição"
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Wallet className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {a && a.total_positions > 0
                ? 'Nenhuma posição aberta. Histórico de trades disponível.'
                : 'Nenhuma posição. Clique em Abrir para iniciar paper trading.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {a && a.total_positions > 0 && (
        <div className="p-2 border-t border-border/30 bg-secondary/10 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{a.win_count}W / {a.loss_count}L</span>
          <span>PF: {a.profit_factor.toFixed(2)}</span>
          <span>{a.total_pips.toFixed(0)} pips</span>
        </div>
      )}
    </div>
  );
}
