/**
 * SUSE - BacktestPanel Component
 * FASE 2: Exibe resultados de backtesting com métricas e equity curve.
 */

import { useState, useCallback } from 'react';
import {
  History, Play, Loader2, TrendingUp, TrendingDown,
  Target, Activity, DollarSign, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import type { BacktestResult, BacktestSummary } from '@/types/trading';
import { cn } from '@/lib/utils';

interface BacktestPanelProps {
  className?: string;
}

export function BacktestPanel({ className }: BacktestPanelProps) {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrades, setShowTrades] = useState(false);
  const [config, setConfig] = useState({
    initial_capital: 10000,
    stop_loss_pips: 30,
    take_profit_pips: 60,
    step: 10,
  });

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('http://localhost:4000/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: BacktestResult = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao executar backtest');
    } finally {
      setLoading(false);
    }
  }, [config]);

  const s = result?.summary;

  const MetricCard = ({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: string; color: string;
  }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
      <Icon className={cn('w-4 h-4', color)} />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn('text-sm font-semibold', color)}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Backtesting</h3>
            <p className="text-xs text-muted-foreground">Teste a IA em dados históricos</p>
          </div>
        </div>
        <button
          onClick={runBacktest}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {loading ? 'Executando...' : 'Executar'}
        </button>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/20">
        <div>
          <label className="text-[10px] text-muted-foreground">Capital Inicial</label>
          <input
            type="number"
            value={config.initial_capital}
            onChange={(e) => setConfig({ ...config, initial_capital: Number(e.target.value) })}
            className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Stop Loss (pips)</label>
          <input
            type="number"
            value={config.stop_loss_pips}
            onChange={(e) => setConfig({ ...config, stop_loss_pips: Number(e.target.value) })}
            className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Take Profit (pips)</label>
          <input
            type="number"
            value={config.take_profit_pips}
            onChange={(e) => setConfig({ ...config, take_profit_pips: Number(e.target.value) })}
            className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Step (candles)</label>
          <input
            type="number"
            value={config.step}
            onChange={(e) => setConfig({ ...config, step: Number(e.target.value) })}
            className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {s && (
        <div className="p-4 space-y-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <MetricCard
              icon={DollarSign}
              label="Capital Final"
              value={`$${s.final_capital.toLocaleString()}`}
              color={s.total_return_pct >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricCard
              icon={s.total_return_pct >= 0 ? TrendingUp : TrendingDown}
              label="Retorno"
              value={`${s.total_return_pct >= 0 ? '+' : ''}${s.total_return_pct}%`}
              color={s.total_return_pct >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricCard
              icon={Target}
              label="Win Rate"
              value={`${s.win_rate}%`}
              color={s.win_rate >= 50 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricCard
              icon={Activity}
              label="Trades"
              value={`${s.total_trades} (${s.wins}W/${s.losses}L)`}
              color="text-blue-600"
            />
            <MetricCard
              icon={TrendingUp}
              label="Profit Factor"
              value={s.profit_factor.toFixed(2)}
              color={s.profit_factor >= 1.5 ? 'text-green-600' : 'text-yellow-600'}
            />
            <MetricCard
              icon={AlertTriangle}
              label="Max Drawdown"
              value={`${s.max_drawdown_pct}%`}
              color={s.max_drawdown_pct > 20 ? 'text-red-600' : 'text-yellow-600'}
            />
          </div>

          {/* Equity curve (simple SVG) */}
          {result && result.equity_curve.length > 1 && (
            <EquityCurve points={result.equity_curve} />
          )}

          {/* Decision distribution */}
          {s.decision_distribution && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Decisões:</span>
              {Object.entries(s.decision_distribution).map(([k, v]) => (
                <span key={k} className={cn(
                  'px-2 py-0.5 rounded font-medium',
                  k === 'BUY' && 'bg-green-500/15 text-green-700',
                  k === 'SELL' && 'bg-red-500/15 text-red-700',
                  k === 'HOLD' && 'bg-yellow-500/15 text-yellow-700',
                )}>
                  {k}: {v}
                </span>
              ))}
            </div>
          )}

          {/* Trades list */}
          {result && result.trades.length > 0 && (
            <div>
              <button
                onClick={() => setShowTrades(!showTrades)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition"
              >
                {showTrades ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Ver {result.trades.length} trades
              </button>
              {showTrades && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border/30">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
                      <tr>
                        <th className="text-left p-1.5 font-medium">#</th>
                        <th className="text-left p-1.5 font-medium">Tipo</th>
                        <th className="text-right p-1.5 font-medium">PnL</th>
                        <th className="text-left p-1.5 font-medium">Resultado</th>
                        <th className="text-left p-1.5 font-medium">Confiança</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((t, i) => (
                        <tr key={i} className="border-t border-border/20">
                          <td className="p-1.5 text-muted-foreground">{i + 1}</td>
                          <td className={cn('p-1.5 font-medium', t.type === 'BUY' ? 'text-green-600' : 'text-red-600')}>
                            {t.type}
                          </td>
                          <td className={cn('p-1.5 text-right font-mono', t.pnl_pips >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {t.pnl_pips >= 0 ? '+' : ''}{t.pnl_pips.toFixed(1)}
                          </td>
                          <td className="p-1.5">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              t.result === 'WIN' ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'
                            )}>
                              {t.result}
                            </span>
                          </td>
                          <td className="p-1.5 text-muted-foreground">{t.confidence.toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!s && !loading && !error && (
        <div className="p-6 text-center">
          <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Configure os parâmetros e clique em Executar para testar a IA.
          </p>
        </div>
      )}
    </div>
  );
}

/* Mini equity curve chart (SVG, no external deps) */
function EquityCurve({ points }: { points: { capital: number; index: number }[] }) {
  if (points.length < 2) return null;

  const capitals = points.map(p => p.capital);
  const minCap = Math.min(...capitals);
  const maxCap = Math.max(...capitals);
  const range = maxCap - minCap || 1;
  const width = 100;
  const height = 30;

  const pathData = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.capital - minCap) / range) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  const isProfit = capitals[capitals.length - 1] >= capitals[0];

  return (
    <div className="rounded-lg bg-secondary/30 p-3">
      <p className="text-[10px] text-muted-foreground mb-1">Equity Curve</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
        <path
          d={pathData}
          fill="none"
          stroke={isProfit ? '#16a34a' : '#dc2626'}
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
