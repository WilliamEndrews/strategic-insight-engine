/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * FutureFeatureCard Component
 * 
 * PURPOSE:
 * Placeholder cards for features planned in future versions.
 * Shows users what's coming while maintaining clean UI structure.
 * 
 * PLANNED FEATURES:
 * - Backtesting module
 * - Market replay
 * - Multi-asset dashboard
 * - Audit logs
 * - Strategy builder
 * 
 * DESIGN PHILOSOPHY:
 * - Subtle and non-intrusive
 * - Clearly marked as "coming soon"
 * - Maintains layout consistency
 */

import { cn } from '@/lib/utils';
import { 
  History, 
  PlayCircle, 
  LayoutGrid, 
  FileText, 
  Settings2,
  Lock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type FeatureType = 'backtest' | 'replay' | 'multiasset' | 'logs' | 'strategy';

interface FutureFeatureCardProps {
  feature: FeatureType;
  className?: string;
}

const featureConfig: Record<FeatureType, {
  icon: LucideIcon;
  title: string;
  description: string;
}> = {
  backtest: {
    icon: History,
    title: 'Backtesting',
    description: 'Teste estratégias em dados históricos',
  },
  replay: {
    icon: PlayCircle,
    title: 'Replay de Mercado',
    description: 'Reviva momentos do mercado em tempo simulado',
  },
  multiasset: {
    icon: LayoutGrid,
    title: 'Multi-Ativos',
    description: 'Analise múltiplos pares simultaneamente',
  },
  logs: {
    icon: FileText,
    title: 'Logs de Auditoria',
    description: 'Histórico completo de decisões da IA',
  },
  strategy: {
    icon: Settings2,
    title: 'Construtor de Estratégias',
    description: 'Personalize parâmetros e indicadores',
  },
};

export function FutureFeatureCard({ feature, className }: FutureFeatureCardProps) {
  const config = featureConfig[feature];
  const Icon = config.icon;

  return (
    <div className={cn(
      'glass-panel p-4 opacity-60 hover:opacity-80 transition-opacity cursor-not-allowed relative overflow-hidden',
      className
    )}>
      {/* Locked overlay */}
      <div className="absolute top-2 right-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground/80">{config.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
            Em Breve
          </span>
        </div>
      </div>
    </div>
  );
}
