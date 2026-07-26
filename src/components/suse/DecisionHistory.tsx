/**
 * SUSE - DecisionHistory Component
 * FASE 4: Timeline de decisões da IA com estatísticas.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  History, TrendingUp, TrendingDown, Minus, RefreshCw, Trash2,
  Loader2, AlertTriangle, Filter, ChevronDown
} from 'lucide-react';
import type { DecisionHistoryResult, DecisionHistoryEntry } from '@/types/trading';
import { cn } from '@/lib/utils';

interface DecisionHistoryProps {
  className?: string;
}

export function DecisionHistory({ className }: DecisionHistoryProps) {
  const [data, setData] = useState<DecisionHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filter !== 'ALL') params.set('decision', filter);
      const resp = await fetch(`http://localhost:4000/history?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result: DecisionHistoryResult = await resp.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar histórico');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearHistory = async () => {
    try {
      await fetch('http://localhost:4000/history/clear', { method: 'POST' });
      setData(null);
    } catch { /* silent */ }
  };

  const decisionIcon = (d: string) => {
    if (d === 'BUY') return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
    if (d === 'SELL') return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
    return <Minus className="w-3.5 h-3.5 text-yellow-600" />;
  };

  const decisionColor = (d: string) => {
    if (d === 'BUY') return 'text-green-600 bg-green-500/15';
    if (d === 'SELL') return 'text-red-600 bg-red-500/15';
    return 'text-yellow-600 bg-yellow-500/15';
  };

  const stats = data?.stats;
  const entries = data?.entries || [];

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Histórico de Decisões</h3>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.total_decisions} decisões registradas` : 'Carregando...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-secondary transition"
            title="Atualizar"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg hover:bg-secondary transition"
            title="Limpar histórico"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 p-3 bg-secondary/20">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">BUY</p>
            <p className="text-sm font-bold text-green-600">{stats.buy_count}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">SELL</p>
            <p className="text-sm font-bold text-red-600">{stats.sell_count}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">HOLD</p>
            <p className="text-sm font-bold text-yellow-600">{stats.hold_count}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Conf. Méd</p>
            <p className="text-sm font-bold text-primary">{stats.avg_confidence.toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-1 p-2 bg-secondary/10">
        <Filter className="w-3 h-3 text-muted-foreground" />
        {(['ALL', 'BUY', 'SELL', 'HOLD'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium transition',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            {f === 'ALL' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Timeline */}
      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 && !loading ? (
          <div className="p-6 text-center">
            <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Nenhuma decisão registrada. Execute análises para gerar histórico.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border/30" />

            <div className="divide-y divide-border/10">
              {entries.map((entry: DecisionHistoryEntry) => (
                <div
                  key={entry.id}
                  className="relative pl-12 pr-3 py-2.5 hover:bg-secondary/20 transition cursor-pointer"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-3 top-3 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background',
                    decisionColor(entry.decision)
                  )}>
                    {decisionIcon(entry.decision)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', decisionColor(entry.decision))}>
                        {entry.decision}
                      </span>
                      <span className="text-xs font-medium">{entry.symbol}</span>
                      <span className="text-[10px] text-muted-foreground">{entry.timeframe}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-semibold',
                        entry.confidence >= 70 ? 'text-green-600' :
                        entry.confidence >= 50 ? 'text-yellow-600' : 'text-red-600')}>
                        {entry.confidence.toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition', expanded === entry.id && 'rotate-180')} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      @ {entry.price.toFixed(5)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{entry.trend}</span>
                    {entry.warnings.length > 0 && (
                      <span className="text-[10px] text-yellow-600">{entry.warnings.length} avisos</span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {expanded === entry.id && (
                    <div className="mt-2 space-y-1.5 pl-0">
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-muted-foreground">Probabilidades:</span>
                        <span className="text-green-600">B: {(entry.probabilities.buy * 100).toFixed(0)}%</span>
                        <span className="text-red-600">S: {(entry.probabilities.sell * 100).toFixed(0)}%</span>
                        <span className="text-yellow-600">H: {(entry.probabilities.hold * 100).toFixed(0)}%</span>
                      </div>
                      {entry.estimated_duration && (
                        <div className="text-[10px] text-muted-foreground">
                          Duração estimada: {entry.estimated_duration.min}-{entry.estimated_duration.max} min
                        </div>
                      )}
                      {entry.warnings.length > 0 && (
                        <div className="space-y-0.5">
                          {entry.warnings.map((w, i) => (
                            <div key={i} className="text-[10px] text-yellow-600 flex items-start gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" />
                              {w}
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.top_features && entry.top_features.length > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">Top features:</p>
                          {entry.top_features.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">{f.name}</span>
                              <span className={f.contribution > 0 ? 'text-green-600' : 'text-red-600'}>
                                {f.contribution > 0 ? '+' : ''}{f.contribution.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
