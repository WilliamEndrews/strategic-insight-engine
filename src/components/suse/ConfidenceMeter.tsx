/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * ConfidenceMeter Component
 * 
 * PURPOSE:
 * Displays the probability distribution for BUY/SELL/HOLD decisions.
 * Helps traders understand not just what the AI recommends,
 * but how certain it is about each option.
 * 
 * DESIGN PHILOSOPHY:
 * - Visual representation of probabilities
 * - Color-coded for quick scanning
 * - Animated bars for engagement
 * - Precise numerical values for data-driven traders
 */

import { cn } from '@/lib/utils';

interface ConfidenceMeterProps {
  probabilities: {
    buy: number;
    sell: number;
    hold: number;
  };
  className?: string;
}

/**
 * Configuration for each probability type.
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

export function ConfidenceMeter({ probabilities, className }: ConfidenceMeterProps) {
  return (
    <div className={cn('glass-panel p-4 space-y-4', className)}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Distribuição de Probabilidades
      </h3>

      <div className="space-y-3">
        {(Object.keys(probabilityConfig) as Array<keyof typeof probabilityConfig>).map((key) => {
          const config = probabilityConfig[key];
          const value = probabilities[key];
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

      {/* Visual distribution bar */}
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
