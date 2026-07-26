/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Componente ConfidenceMeter
 * 
 * PROPÓSITO:
 * Exibe a distribuição de probabilidades para decisões BUY/SELL/HOLD.
 * Ajuda os traders a entenderem não apenas o que a IA recomenda,
 * mas o quão certa ela está em cada opção.
 * 
 * FILOSOFIA DE DESIGN:
 * - Representação visual das probabilidades
 * - Cores codificadas para leitura rápida
 * - Barras animadas para engajamento
 * - Valores numéricos precisos para traders data-driven
 * 
 * CORREÇÃO DEFINITIVA (2026-03-16):
 * Normaliza automaticamente confiança (0.85 ou 85) para porcentagem.
 * Cap rígido em 100% para nunca ultrapassar.
 * Nunca mais vai mostrar 9300% ou barra quebrada.
 */

import { cn } from '@/lib/utils';

interface ConfidenceMeterProps {
  probabilities: {
    buy: number;
    sell: number;
    hold: number;
  };
  /** 
   * Nível geral de confiança da IA (pode vir como 0.85 ou 85).
   * O componente normaliza automaticamente para porcentagem.
   */
  confidence?: number;
  className?: string;
}

/**
 * Configuração para cada tipo de probabilidade.
 */
const probabilityConfig = {
  buy: {
    label: 'COMPRAR',
    bgClass: 'bg-signal-buy',
    mutedClass: 'bg-signal-buy-muted',
  },
  sell: {
    label: 'VENDER',
    bgClass: 'bg-signal-sell',
    mutedClass: 'bg-signal-sell-muted',
  },
  hold: {
    label: 'AGUARDAR',
    bgClass: 'bg-signal-hold',
    mutedClass: 'bg-signal-hold-muted',
  },
};

export function ConfidenceMeter({ probabilities, confidence, className }: ConfidenceMeterProps) {
  // NORMALIZAÇÃO DEFINITIVA + CAP DE 100%
  // Se vier 0.85 → 85%; se vier 85 → 85%; nunca ultrapassa 100%
  const confidencePercent = confidence != null
    ? Math.min(100, Math.round(confidence > 1 ? confidence : confidence * 100))
    : 0;

  console.log('[ConfidenceMeter DEBUG] Valor recebido da IA:', confidence, '→ Exibido:', confidencePercent + '%');

  return (
    <div className={cn('glass-panel p-4 space-y-4', className)}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Distribuição de Probabilidades
      </h3>

      {/* Nível geral de confiança da IA (principal) */}
      {confidence != null && (
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-primary">
            {confidencePercent}%
          </div>
          <div className="text-sm text-muted-foreground">
            Nível de Confiança Geral da IA
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(Object.keys(probabilityConfig) as Array<keyof typeof probabilityConfig>).map((key) => {
          const config = probabilityConfig[key];
          let value = probabilities[key] || 0;

          // Normaliza probabilidades (caso venham como 30 em vez de 0.3)
          if (value > 1) value = value / 100;

          const percent = Math.round(value * 100);

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/80">{config.label}</span>
                <span className="font-mono font-medium text-foreground">
                  {percent}%
                </span>
              </div>
              <div className={cn('h-2 rounded-full overflow-hidden', config.mutedClass)}>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    config.bgClass
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra visual de distribuição */}
      <div className="pt-2">
        <div className="h-4 rounded-lg overflow-hidden flex">
          <div
            className="bg-signal-buy transition-all duration-700"
            style={{ width: `${probabilities.buy * 100}%` }}
          />
          <div
            className="bg-signal-sell transition-all duration-700"
            style={{ width: `${probabilities.sell * 100}%` }}
          />
          <div
            className="bg-signal-hold transition-all duration-700"
            style={{ width: `${probabilities.hold * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}