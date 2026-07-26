/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Componente IndicatorPanel
 * 
 * PROPÓSITO:
 * Exibe um resumo claro e escaneável de todos os indicadores técnicos.
 * Permite que traders avaliem rapidamente as condições do mercado
 * sem precisar mergulhar em gráficos complexos.
 * 
 * FILOSOFIA DE DESIGN:
 * - Compacto, mas informativo
 * - Interpretações codificadas por cores (BULLISH = verde, BEARISH = vermelho, NEUTRAL = cinza)
 * - Formatação consistente para valores numéricos
 * - Agrupamento lógico por tipo de indicador
 * 
 * INDICADORES EXIBIDOS:
 * - RSI (Relative Strength Index)
 * - EMAs (20, 50, 200)
 * - VWAP
 * - ATR
 * - Bandas de Bollinger
 * - Níveis de Fibonacci
 * - Análise de Volume
 * 
 * PROTEÇÕES IMPLEMENTADAS:
 * - Todos os acessos usam optional chaining (?.) para evitar crashes
 * - Fallbacks visuais ("N/A", "Não calculado") quando dados estão ausentes ou nulos
 * - Compatível com campos opcionais do backend (null/undefined)
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
  analysis?: TechnicalAnalysis; // Opcional para evitar undefined
  className?: string;
}

/**
 * Ícone correspondente à interpretação do indicador
 */
function InterpretationIcon({ interpretation }: { interpretation?: string }) {
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
 * Linha individual de indicador com proteção contra valores ausentes
 */
function IndicatorRow({
  label,
  value,
  interpretation,
  description,
}: {
  label: string;
  value?: number | string | null;
  interpretation?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description?: string;
}) {
  const displayValue = value !== null && value !== undefined
    ? (typeof value === 'number' ? value.toFixed(4) : value)
    : 'N/A';

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
          interpretation === 'NEUTRAL' && 'text-indicator-neutral',
          (value === null || value === undefined) && 'text-muted-foreground'
        )}>
          {displayValue}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export function IndicatorPanel({ analysis, className }: IndicatorPanelProps) {
  // Proteção inicial: se analysis não existir, mostra placeholder
  if (!analysis) {
    return (
      <div className={cn('glass-panel p-4 space-y-4', className)}>
        <div className="text-center text-muted-foreground py-8">
          Indicadores não disponíveis no momento
        </div>
      </div>
    );
  }

  const { rsi, ema, vwap, atr, bollingerBands, fibonacci, volumeAnalysis, trend } = analysis;

  // Interpretação geral das EMAs (com proteção)
  const emaInterpretation = 
    ema?.priceRelation?.aboveEMA200 ? 'BULLISH' :
    ema?.priceRelation?.aboveEMA20 ? 'NEUTRAL' : 'BEARISH';

  return (
    <div className={cn('glass-panel p-4 space-y-4', className)}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Indicadores Técnicos
          </h3>
        </div>
        
        {/* Badge de tendência do mercado */}
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          trend === 'BULLISH' && 'bg-indicator-bullish/20 text-indicator-bullish',
          trend === 'BEARISH' && 'bg-indicator-bearish/20 text-indicator-bearish',
          trend === 'LATERAL' && 'bg-indicator-neutral/20 text-indicator-neutral',
          trend === 'HIGH_VOLATILITY' && 'bg-confidence-medium/20 text-confidence-medium',
          !trend && 'bg-muted text-muted-foreground'
        )}>
          {trend || 'Tendência não determinada'}
        </span>
      </div>

      {/* Seção Momentum */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <Gauge className="w-3 h-3" />
          Momentum
        </div>
        <IndicatorRow
          label="RSI (14)"
          value={rsi?.value}
          interpretation={rsi?.interpretation}
          description={rsi?.description}
        />
        <IndicatorRow
          label="Volume Relativo"
          value={volumeAnalysis?.value !== null && volumeAnalysis?.value !== undefined 
            ? `${(Number(volumeAnalysis.value) * 100).toFixed(0)}%` 
            : 'N/A'}
          interpretation={volumeAnalysis?.interpretation}
          description={volumeAnalysis?.description}
        />
      </div>

      {/* Seção Tendência */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <TrendingUp className="w-3 h-3" />
          Tendência
        </div>
        <IndicatorRow
          label="EMA 20"
          value={ema?.ema20}
          interpretation={ema?.priceRelation?.aboveEMA20 ? 'BULLISH' : 'BEARISH'}
        />
        <IndicatorRow
          label="EMA 50"
          value={ema?.ema50}
          interpretation={ema?.priceRelation?.aboveEMA50 ? 'BULLISH' : 'BEARISH'}
        />
        <IndicatorRow
          label="EMA 200"
          value={ema?.ema200}
          interpretation={ema?.priceRelation?.aboveEMA200 ? 'BULLISH' : 'BEARISH'}
        />
        <IndicatorRow
          label="VWAP"
          value={vwap?.value}
          interpretation={vwap?.interpretation}
        />
      </div>

      {/* Seção Volatilidade */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <BarChart3 className="w-3 h-3" />
          Volatilidade
        </div>
        <IndicatorRow
          label="ATR (14)"
          value={atr?.value}
          interpretation={atr?.interpretation}
          description={atr?.description}
        />
        <IndicatorRow
          label="BB Superior"
          value={bollingerBands?.upper}
          interpretation="NEUTRAL"
        />
        <IndicatorRow
          label="BB Inferior"
          value={bollingerBands?.lower}
          interpretation="NEUTRAL"
        />
      </div>

      {/* Seção Fibonacci */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase mb-2">
          <Layers className="w-3 h-3" />
          Fibonacci
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-foreground/80">Nível Mais Próximo</span>
          <div className="text-right">
            <span className="font-mono text-sm font-medium text-primary">
              {fibonacci?.nearestLevel ?? 'N/A'}
            </span>
            <p className="text-xs text-muted-foreground">
              Distância: {fibonacci?.distanceToNearest !== undefined 
                ? (fibonacci.distanceToNearest * 10000).toFixed(1) + ' pips' 
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}