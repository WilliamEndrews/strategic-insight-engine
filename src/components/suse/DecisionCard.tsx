/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Componente DecisionCard
 * 
 * PROPÓSITO:
 * Exibe de forma proeminente a recomendação da IA (BUY / SELL / HOLD),
 * com confiança, explicações e duração estimada.
 * 
 * VERSÃO 1.24 - CORES CORRIGIDAS
 * Data: 06/04/2026
 * 
 * Alterações:
 * - Número da porcentagem voltou a ter cor azul ciano quando alta
 * - Barra de confiança agora segue as cores da decisão (verde=BUY, vermelho=SELL, cinza=HOLD)
 * - Proteção contra valores inválidos mantida
 */

import { cn } from '@/lib/utils';
import type { TradingDecision } from '@/types/trading';
import { TrendingUp, TrendingDown, Pause, AlertTriangle, Clock } from 'lucide-react';

interface DecisionCardProps {
  decision: TradingDecision;
  confidence: number;           // Já vem entre 0 e 100 da IA
  timestamp: string;
  estimatedDuration?: {
    min: number;
    max: number;
    confidence: number;
  };
  className?: string;
}

/**
 * Mapeia as decisões para propriedades visuais
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
    barColor: 'bg-green-500',           // Barra verde para BUY
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
    barColor: 'bg-red-500',             // Barra vermelha para SELL
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
    barColor: 'bg-gray-500',            // Barra cinza para HOLD
  },
};

export function DecisionCard({
  decision,
  confidence,
  timestamp,
  estimatedDuration,
  className,
}: DecisionCardProps) {
  const config = decisionConfig[decision];

  // Proteção definitiva contra valores inválidos
  const safeConfidence = Math.min(100, Math.max(0, Math.round(confidence || 0)));

  const Icon = config.icon;
  const showLowConfidenceWarning = safeConfidence < 50;

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
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />

      <div className="relative z-10">
        {/* Cabeçalho da decisão */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', config.bgClass, 'bg-opacity-50')}>
              <Icon className={cn('w-10 h-10', config.textClass)} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={cn('text-4xl font-bold tracking-tight', config.textClass)}>
                {config.label}
              </h2>
              <p className="text-muted-foreground text-base mt-1">{config.sublabel}</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Atualizado às</p>
            <p className="text-base font-mono text-foreground/90 font-medium">
              {new Date(timestamp).toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Medidor de Confiança - CORES CORRIGIDAS */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Nível de Confiança</span>
            <span className="text-3xl font-mono font-bold text-cyan-400">   {/* ← Azul ciano restaurado */}
              {safeConfidence}%
            </span>
          </div>

          {/* Barra de confiança - agora segue a cor da decisão */}
          <div className="h-4 bg-muted rounded-full overflow-hidden shadow-inner">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                config.barColor   // ← Usa a cor definida no config (verde/vermelho/cinza)
              )}
              style={{ width: `${safeConfidence}%` }}
            />
          </div>
        </div>

        {/* Duração Estimada */}
        {estimatedDuration && (
          <div className="mt-6 p-4 bg-background/60 backdrop-blur-sm rounded-lg border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">
                Duração Estimada da Operação
              </h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {estimatedDuration.min}–{estimatedDuration.max}
              </span>
              <span className="text-base text-muted-foreground">minutos</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Confiança na estimativa: {estimatedDuration.confidence.toFixed(0)}%
            </p>
          </div>
        )}

        {/* Alerta de baixa confiança */}
        {showLowConfidenceWarning && (
          <div className="mt-6 flex items-center gap-3 text-red-600 bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              Confiança baixa — considere aguardar um setup mais claro
            </span>
          </div>
        )}
      </div>
    </div>
  );
}