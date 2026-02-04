/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * IndicatorPanel Component
 * 
 * PURPOSE:
 * Displays a summary of all technical indicators in a clean,
 * scannable format. Traders can quickly assess market conditions
 * without diving into complex charts.
 * 
 * DESIGN PHILOSOPHY:
 * - Compact but informative
 * - Color-coded interpretations (bullish/bearish/neutral)
 * - Consistent formatting for numerical values
 * - Grouped by indicator type for logical organization
 * 
 * INDICATORS SHOWN:
 * - RSI (Relative Strength Index)
 * - EMAs (20, 50, 200)
 * - VWAP
 * - ATR
 * - Bollinger Bands
 * - Fibonacci Levels
 */

import { cn } from '@/lib/utils';
import type { TechnicalAnalysis } from '@/types/trading';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Gauge,
  Layers
} from 'lucide-react';

interface IndicatorPanelProps {
  analysis: TechnicalAnalysis;
  className?: string;
}

/**
 * Icon mapping for indicator interpretations.
 */
function InterpretationIcon({ interpretation }: { interpretation: string }) {
  switch (interpretation) {
    case 'BULLISH':
      return <TrendingUp className="w-3.5 h-3.5 text-indicator-bullish" />;
    case 'BEARISH':
      return <TrendingDown className="w-3.5 h-3.5 text-indicator-bearish" />;
    default:
      return <Minus className="w-3.5 h-3.5 text-indicator-neutral" />;
  }
}

/**
 * Individual indicator row component.
 */
function IndicatorRow({
  label,
  value,
  interpretation,
  description,
}: {
  label: string;
  value: string | number;
  interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2">
        <InterpretationIcon interpretation={interpretation} />
        <span className="text-sm text-foreground/80">{label}</span>
      </div>
      <div className="text-right">
        <span className={cn(
          'font-mono text-sm font-medium',
          interpretation === 'BULLISH' && 'text-indicator-bullish',
          interpretation === 'BEARISH' && 'text-indicator-bearish',
          interpretation === 'NEUTRAL' && 'text-indicator-neutral'
        )}>
          {typeof value === 'number' ? value.toFixed(4) : value}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export function IndicatorPanel({ analysis, className }: IndicatorPanelProps) {
  const { rsi, ema, vwap, atr, bollingerBands, fibonacci, volumeAnalysis, trend } = analysis;

  // Determine EMA relationship interpretation
  const emaInterpretation = 
    ema.priceRelation.aboveEMA200 ? 'BULLISH' : 
    ema.priceRelation.aboveEMA20 ? 'NEUTRAL' : 'BEARISH';

  return (
    <div className={cn('glass-panel p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Indicadores Técnicos
          </h3>
        </div>
        
        {/* Market trend badge */}
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          trend === 'BULLISH' && 'bg-indicator-bullish/20 text-indicator-bullish',
          trend === 'BEARISH' && 'bg-indicator-bearish/20 text-indicator-bearish',
          trend === 'LATERAL' && 'bg-indicator-neutral/20 text-indicator-neutral',
          trend === 'HIGH_VOLATILITY' && 'bg-confidence-medium/20 text-confidence-medium'
        )}>
          {trend === 'BULLISH' && 'Tendência de Alta'}
          {trend === 'BEARISH' && 'Tendência de Baixa'}
          {trend === 'LATERAL' && 'Mercado Lateral'}
          {trend === 'HIGH_VOLATILITY' && 'Alta Volatilidade'}
        </span>
      </div>

      {/* Momentum Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <Gauge className="w-3 h-3" />
          Momentum
        </div>
        <IndicatorRow
          label="RSI (14)"
          value={rsi.value}
          interpretation={rsi.interpretation}
          description={rsi.description}
        />
        <IndicatorRow
          label="Volume Relativo"
          value={`${(volumeAnalysis.value as number * 100).toFixed(0)}%`}
          interpretation={volumeAnalysis.interpretation}
          description={volumeAnalysis.description}
        />
      </div>

      {/* Trend Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <TrendingUp className="w-3 h-3" />
          Tendência
        </div>
        <IndicatorRow
          label="EMA 20"
          value={ema.ema20}
          interpretation={ema.priceRelation.aboveEMA20 ? 'BULLISH' : 'BEARISH'}
        />
        <IndicatorRow
          label="EMA 50"
          value={ema.ema50}
          interpretation={ema.priceRelation.aboveEMA50 ? 'BULLISH' : 'BEARISH'}
        />
        <IndicatorRow
          label="EMA 200"
          value={ema.ema200}
          interpretation={ema.priceRelation.aboveEMA200 ? 'BULLISH' : 'BEARISH'}
        />
        <IndicatorRow
          label="VWAP"
          value={vwap.value}
          interpretation={vwap.interpretation}
        />
      </div>

      {/* Volatility Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <BarChart3 className="w-3 h-3" />
          Volatilidade
        </div>
        <IndicatorRow
          label="ATR (14)"
          value={atr.value}
          interpretation={atr.interpretation}
          description={atr.description}
        />
        <IndicatorRow
          label="BB Superior"
          value={bollingerBands.upper}
          interpretation="NEUTRAL"
        />
        <IndicatorRow
          label="BB Inferior"
          value={bollingerBands.lower}
          interpretation="NEUTRAL"
        />
      </div>

      {/* Fibonacci Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <Layers className="w-3 h-3" />
          Fibonacci
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-foreground/80">Nível Mais Próximo</span>
          <div className="text-right">
            <span className="font-mono text-sm font-medium text-primary">
              {fibonacci.nearestLevel}
            </span>
            <p className="text-xs text-muted-foreground">
              Distância: {(fibonacci.distanceToNearest * 10000).toFixed(1)} pips
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
