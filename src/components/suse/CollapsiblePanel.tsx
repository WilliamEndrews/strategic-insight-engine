/**
 * SUSE - CollapsiblePanel Component
 * Wrapper minimizável/expandível para os painéis do dashboard.
 *
 * Quando expandido: mostra o conteúdo original com um botão flutuante de minimizar.
 * Quando minimizado: mostra um card compacto apenas com o título e botão de expandir.
 */

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsiblePanel({
  title,
  children,
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
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          onClick={() => setExpanded(true)}
          className="p-1 rounded-md hover:bg-secondary/80 transition text-muted-foreground hover:text-foreground"
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
