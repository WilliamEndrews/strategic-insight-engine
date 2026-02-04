/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * ExplanationPanel Component
 * 
 * PURPOSE:
 * This component is CRITICAL for trust and transparency.
 * It displays the AI's reasoning for its decision.
 * 
 * DESIGN PHILOSOPHY:
 * - Every decision must be explainable
 * - Traders need to understand WHY, not just WHAT
 * - Clear visual distinction between confirmations and warnings
 * - Educational value for improving trading skills
 * 
 * HUMAN-IN-THE-LOOP:
 * This panel empowers traders to validate or override
 * the AI's recommendation based on their own analysis.
 */

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface ExplanationPanelProps {
  /** List of reasons supporting the decision */
  explanations: string[];
  /** List of potential concerns or caveats */
  warnings: string[];
  className?: string;
}

export function ExplanationPanel({
  explanations,
  warnings,
  className,
}: ExplanationPanelProps) {
  return (
    <div className={cn('glass-panel p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Análise da Decisão
        </h3>
      </div>

      {/* Explanations - Reasons for the decision */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-signal-buy" />
          Confirmações
        </h4>
        <ul className="space-y-1.5">
          {explanations.map((explanation, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-foreground/90 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-signal-buy mt-0.5">✓</span>
              <span>{explanation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Warnings - Potential concerns */}
      {warnings.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-confidence-medium" />
            Alertas
          </h4>
          <ul className="space-y-1.5">
            {warnings.map((warning, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-foreground/80 animate-fade-in-up"
                style={{ animationDelay: `${(explanations.length + index) * 50}ms` }}
              >
                <span className="text-confidence-medium mt-0.5">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50 italic">
        A IA sugere, você decide. Sempre faça sua própria análise.
      </p>
    </div>
  );
}
