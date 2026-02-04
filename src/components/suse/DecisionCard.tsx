/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * DecisionCard Component
 * 
 * PURPOSE:
 * This is the most critical UI element in the SUSE system.
 * It displays the AI's current trading recommendation prominently.
 * 
 * DESIGN PHILOSOPHY:
 * - Maximum visibility for the decision
 * - Clear color coding (Green=BUY, Red=SELL, Gray=HOLD)
 * - Confidence indicator always visible
 * - Subtle animations to draw attention without distraction
 * 
 * The trader should be able to understand the recommendation
 * at a glance, even from a distance.
 */

import { cn } from '@/lib/utils';
import type { TradingDecision } from '@/types/trading';
import { TrendingUp, TrendingDown, Pause, AlertTriangle } from 'lucide-react';

interface DecisionCardProps {
  /** The AI's recommended action: BUY, SELL, or HOLD */
  decision: TradingDecision;
  /** Confidence level from 0.0 to 1.0 */
  confidence: number;
  /** ISO timestamp of the decision */
  timestamp: string;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Maps trading decisions to their visual properties.
 * Centralizes the styling logic for consistency.
 */
const decisionConfig = {
  BUY: {
    label: 'COMPRAR',
    sublabel: 'Oportunidade de Entrada',
    icon: TrendingUp,
    bgClass: 'bg-signal-buy-muted',
    textClass: 'text-signal-buy',
    borderClass: 'border-signal-buy/40',
    glowClass: 'shadow-glow-buy',
    pulseClass: 'pulse-buy',
  },
  SELL: {
    label: 'VENDER',
    sublabel: 'Oportunidade de Saída',
    icon: TrendingDown,
    bgClass: 'bg-signal-sell-muted',
    textClass: 'text-signal-sell',
    borderClass: 'border-signal-sell/40',
    glowClass: 'shadow-glow-sell',
    pulseClass: 'pulse-sell',
  },
  HOLD: {
    label: 'AGUARDAR',
    sublabel: 'Sem Sinal Claro',
    icon: Pause,
    bgClass: 'bg-signal-hold-muted',
    textClass: 'text-signal-hold',
    borderClass: 'border-signal-hold/40',
    glowClass: 'shadow-glow-hold',
    pulseClass: '',
  },
};

/**
 * Determines confidence level category for color coding.
 */
function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Formats timestamp to human-readable format.
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function DecisionCard({
  decision,
  confidence,
  timestamp,
  className,
}: DecisionCardProps) {
  const config = decisionConfig[decision];
  const Icon = config.icon;
  const confidenceLevel = getConfidenceLevel(confidence);
  const confidencePercent = Math.round(confidence * 100);

  // Low confidence warning
  const showLowConfidenceWarning = confidence < 0.5;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300',
        config.bgClass,
        config.borderClass,
        config.glowClass,
        config.pulseClass,
        className
      )}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />

      {/* Content */}
      <div className="relative z-10">
        {/* Decision header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-lg', config.bgClass, 'bg-opacity-50')}>
              <Icon className={cn('w-8 h-8', config.textClass)} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={cn('text-3xl font-bold tracking-tight', config.textClass)}>
                {config.label}
              </h2>
              <p className="text-muted-foreground text-sm">{config.sublabel}</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Atualizado</p>
            <p className="text-sm font-mono text-foreground/80">{formatTimestamp(timestamp)}</p>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nível de Confiança</span>
            <span
              className={cn(
                'text-lg font-bold font-mono',
                confidenceLevel === 'high' && 'text-confidence-high',
                confidenceLevel === 'medium' && 'text-confidence-medium',
                confidenceLevel === 'low' && 'text-confidence-low'
              )}
            >
              {confidencePercent}%
            </span>
          </div>

          {/* Confidence bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                confidenceLevel === 'high' && 'bg-confidence-high',
                confidenceLevel === 'medium' && 'bg-confidence-medium',
                confidenceLevel === 'low' && 'bg-confidence-low'
              )}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Low confidence warning */}
        {showLowConfidenceWarning && (
          <div className="mt-4 flex items-center gap-2 text-confidence-low bg-confidence-low/10 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              Confiança baixa - considere aguardar melhor setup
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
