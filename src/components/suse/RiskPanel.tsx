/**
 * SUSE - RiskPanel Component
 * FASE 3: Calculadora de gestão de risco com position sizing, SL/TP e R:R.
 */

import { useState, useCallback } from 'react';
import {
  Shield, Calculator, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Loader2, DollarSign, Percent, Target
} from 'lucide-react';
import type { RiskAssessment } from '@/types/trading';
import { cn } from '@/lib/utils';

interface RiskPanelProps {
  className?: string;
}

export function RiskPanel({ className }: RiskPanelProps) {
  const [result, setResult] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    account_balance: 10000,
    risk_per_trade_percent: 1.0,
    max_risk_percent: 3.0,
    stop_loss_pips: 30,
    take_profit_pips: 60,
    pip_value: 10,
    current_positions: 0,
    open_risk_percent: 0,
    entry_price: 0,
    direction: 'BUY',
  });

  const assessRisk = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('http://localhost:4000/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: RiskAssessment = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao avaliar risco');
    } finally {
      setLoading(false);
    }
  }, [config]);

  const Field = ({ label, keyName, suffix }: { label: string; keyName: keyof typeof config; suffix?: string }) => (
    <div>
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={config[keyName] as number}
          onChange={(e) => setConfig({ ...config, [keyName]: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary pr-8"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );

  const r = result;

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Gestão de Risco</h3>
            <p className="text-xs text-muted-foreground">Position sizing e R:R</p>
          </div>
        </div>
        <button
          onClick={assessRisk}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
          Calcular
        </button>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/20">
        <Field label="Saldo Conta" keyName="account_balance" suffix="$" />
        <Field label="Risco/Trade" keyName="risk_per_trade_percent" suffix="%" />
        <Field label="Risco Máx" keyName="max_risk_percent" suffix="%" />
        <Field label="SL (pips)" keyName="stop_loss_pips" />
        <Field label="TP (pips)" keyName="take_profit_pips" />
        <Field label="Pip Value" keyName="pip_value" suffix="$" />
        <Field label="Posições Abertas" keyName="current_positions" />
        <Field label="Risco Aberto" keyName="open_risk_percent" suffix="%" />
      </div>

      {/* Direction selector */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="text-[10px] text-muted-foreground">Direção:</span>
        <button
          onClick={() => setConfig({ ...config, direction: 'BUY' })}
          className={cn('px-2 py-0.5 rounded text-[10px] font-medium transition',
            config.direction === 'BUY' ? 'bg-green-500/20 text-green-700' : 'bg-secondary text-muted-foreground')}
        >
          BUY
        </button>
        <button
          onClick={() => setConfig({ ...config, direction: 'SELL' })}
          className={cn('px-2 py-0.5 rounded text-[10px] font-medium transition',
            config.direction === 'SELL' ? 'bg-red-500/20 text-red-700' : 'bg-secondary text-muted-foreground')}
        >
          SELL
        </button>
        <div className="flex-1" />
        <Field label="Entry Price (opc.)" keyName="entry_price" />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {r && (
        <div className="p-4 space-y-3">
          {/* Position Size - destaque */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Tamanho Recomendado</p>
                <p className="text-xl font-bold text-primary">{r.position_size.recommended_lots} lotes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Risco</p>
              <p className="text-sm font-semibold text-red-600">${r.position_size.risk_amount}</p>
              <p className="text-[10px] text-muted-foreground">{r.position_size.risk_percent}%</p>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <Target className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Stop Loss</p>
                <p className="text-sm font-mono">{r.stop_loss.price.toFixed(5)}</p>
                <p className="text-[10px] text-muted-foreground">{r.stop_loss.pips} pips</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <Target className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Take Profit</p>
                <p className="text-sm font-mono">{r.take_profit.price.toFixed(5)}</p>
                <p className="text-[10px] text-muted-foreground">{r.take_profit.pips} pips</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              {r.risk_reward_ratio >= 1.5
                ? <TrendingUp className="w-4 h-4 text-green-500" />
                : <TrendingDown className="w-4 h-4 text-red-500" />}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">R:R Ratio</p>
                <p className={cn('text-sm font-bold',
                  r.risk_reward_ratio >= 2 ? 'text-green-600' :
                  r.risk_reward_ratio >= 1.5 ? 'text-yellow-600' : 'text-red-600')}>
                  {r.risk_reward_ratio}:1
                </p>
              </div>
            </div>
          </div>

          {/* Exposure */}
          <div className="p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Percent className="w-3 h-3" /> Exposição
              </span>
              <span className={cn('font-medium',
                r.exposure.available ? 'text-green-600' : 'text-red-600')}>
                {r.exposure.total_risk_percent}% / {r.exposure.max_allowed_percent}%
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full transition-all',
                  r.exposure.available ? 'bg-green-500' : 'bg-red-500')}
                style={{ width: `${Math.min(r.exposure.total_risk_percent / r.exposure.max_allowed_percent * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Posições: {r.exposure.current_positions}</span>
              <span className={r.exposure.available ? 'text-green-600' : 'text-red-600'}>
                {r.exposure.available ? 'Disponível' : 'Bloqueado'}
              </span>
            </div>
          </div>

          {/* Warnings */}
          {r.warnings.length > 0 && (
            <div className="space-y-1">
              {r.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {r.recommendations.length > 0 && (
            <div className="space-y-1">
              {r.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-green-600 bg-green-500/10 p-2 rounded">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!r && !loading && !error && (
        <div className="p-6 text-center">
          <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Configure os parâmetros e clique em Calcular.
          </p>
        </div>
      )}
    </div>
  );
}
