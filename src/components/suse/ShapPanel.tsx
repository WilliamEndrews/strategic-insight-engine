/**
 * SUSE - SHAP Values Panel
 * 
 * PROPÓSITO:
 * Exibe as contribuições das features mais importantes para a decisão da IA.
 * Implementa XAI (Explainable AI) de forma transparente para o trader.
 * 
 * FILOSOFIA:
 * - Todo trader deve entender POR QUE a IA decidiu
 * - Contribuições positivas favorecem a decisão final
 * - Contribuições negativas atuam contra a decisão final
 * - Barras horizontais facilitam a interpretação rápida
 */

import { cn } from '@/lib/utils';
import { BrainCircuit, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ShapValue {
  feature: string;
  contribution: number;
}

interface ShapPanelProps {
  shapValues?: ShapValue[];
  className?: string;
}

export function ShapPanel({ shapValues, className }: ShapPanelProps) {
  if (!shapValues || shapValues.length === 0) {
    return null;
  }

  const maxAbs = Math.max(...shapValues.map((s) => Math.abs(s.contribution)), 0.001);

  const formatFeatureName = (name: string) => {
    const map: Record<string, string> = {
      dist_ema20: 'Distância EMA20',
      rsi: 'RSI (14)',
      volume_rel: 'Volume Relativo',
      ema9: 'EMA 9',
      ema21: 'EMA 21',
      dist_ema9: 'Distância EMA9',
      crossover_9_21: 'Cruzamento EMA9/21',
      atr_percentil: 'Percentil ATR',
      volume_zscore: 'Volume Z-Score',
      support_distance: 'Dist. Suporte',
      resistance_distance: 'Dist. Resistência',
      momentum_5: 'Momentum 5b',
      momentum_10: 'Momentum 10b',
      momentum_20: 'Momentum 20b',
    };
    return map[name] || name;
  };

  return (
    <div className={cn('glass-panel p-4 space-y-4', className)}>
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Explicabilidade (SHAP)
        </h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Contribuição de cada feature na decisão final da IA. Valores positivos favorecem a decisão;
        negativos contrariam.
      </p>

      <div className="space-y-3">
        {shapValues.map((item, index) => {
          const isPositive = item.contribution >= 0;
          const widthPct = Math.min((Math.abs(item.contribution) / maxAbs) * 100, 100);

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80 font-medium">
                  {formatFeatureName(item.feature)}
                </span>
                <span
                  className={cn(
                    'font-mono font-medium',
                    isPositive ? 'text-signal-buy' : 'text-signal-sell'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {item.contribution.toFixed(3)}
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isPositive ? 'bg-signal-buy' : 'bg-signal-sell'
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-signal-buy" />
          <span>Favorece</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-signal-sell" />
          <span>Contraria</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-3 h-3 text-muted-foreground" />
          <span>Neutro</span>
        </div>
      </div>
    </div>
  );
}
