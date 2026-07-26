/**
 * SUSE - CollapsiblePanel Component
 * Wrapper minimizável/expandível para os painéis do dashboard.
 *
 * Quando expandido: mostra o conteúdo original com um botão flutuante de minimizar.
 * Quando minimizado: mostra um card compacto apenas com o título e botão de expandir.
 */

import { useState } from 'react';
import { Minus, Plus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  description?: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsiblePanel({
  title,
  children,
  icon: Icon,
  description,
  className,
  defaultExpanded = true,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!expanded) {
    return (
      <div
        className={cn(
          'glass-panel rounded-xl border border-border/50 px-4 py-3 flex items-center justify-between',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="p-1 rounded-md hover:bg-secondary/80 transition text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
          title="Expandir"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setExpanded(false)}
        className="absolute top-3 right-3 z-10 p-1 rounded-md hover:bg-secondary/80 transition text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm"
        title="Minimizar"
      >
        <Minus className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}
