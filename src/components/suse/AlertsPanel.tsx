/**
 * SUSE - AlertsPanel Component
 * FASE 3: Sistema de alertas com notificações e histórico.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, BellRing, Check, Trash2, RefreshCw, AlertTriangle,
  Info, CheckCircle, XCircle, ChevronDown, Filter
} from 'lucide-react';
import type { AlertItem, AlertLevel } from '@/types/trading';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  className?: string;
}

const levelConfig: Record<AlertLevel, { icon: any; color: string; bg: string; label: string }> = {
  INFO:     { icon: Info,        color: 'text-blue-600',    bg: 'bg-blue-500/10',    label: 'Info' },
  WARNING:  { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500/10', label: 'Aviso' },
  CRITICAL: { icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-500/10',     label: 'Crítico' },
  SUCCESS:  { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-500/10',   label: 'Sucesso' },
};

export function AlertsPanel({ className }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AlertLevel | 'ALL'>('ALL');
  const [showHistory, setShowHistory] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filter !== 'ALL') params.set('level', filter);
      const resp = await fetch(`http://localhost:4000/alerts?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setAlerts(data.alerts || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar alertas');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const acknowledge = async (id: string) => {
    try {
      await fetch('http://localhost:4000/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    try {
      await fetch('http://localhost:4000/alerts/clear', { method: 'POST' });
      setAlerts([]);
    } catch { /* silent */ }
  };

  const unackCount = alerts.filter(a => !a.acknowledged).length;
  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.level === filter);

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 relative">
            {unackCount > 0 ? (
              <BellRing className="w-5 h-5 text-primary" />
            ) : (
              <Bell className="w-5 h-5 text-primary" />
            )}
            {unackCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unackCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Alertas</h3>
            <p className="text-xs text-muted-foreground">
              {unackCount > 0 ? `${unackCount} não reconhecidos` : 'Todos reconhecidos'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-secondary transition"
            title="Atualizar"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
          <button
            onClick={clearAll}
            className="p-1.5 rounded-lg hover:bg-secondary transition"
            title="Limpar tudo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1 p-2 bg-secondary/20 overflow-x-auto">
        <Filter className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        {(['ALL', 'SUCCESS', 'WARNING', 'CRITICAL', 'INFO'] as const).map(lvl => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium transition whitespace-nowrap',
              filter === lvl
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            {lvl === 'ALL' ? 'Todos' : levelConfig[lvl].label}
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

      {/* Alerts list */}
      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Nenhum alerta. Execute análises para gerar alertas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((alert) => {
              const cfg = levelConfig[alert.level] || levelConfig.INFO;
              const Icon = cfg.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-2 p-3 transition',
                    !alert.acknowledged && cfg.bg,
                    alert.acknowledged && 'opacity-50'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate">{alert.title}</p>
                      {!alert.acknowledged && (
                        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                          alert.level === 'CRITICAL' ? 'bg-red-500' :
                          alert.level === 'WARNING' ? 'bg-yellow-500' :
                          alert.level === 'SUCCESS' ? 'bg-green-500' : 'bg-blue-500'
                        )} />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      {alert.symbol && (
                        <span className="text-[10px] text-muted-foreground">• {alert.symbol}</span>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledge(alert.id)}
                      className="p-1 rounded hover:bg-secondary transition flex-shrink-0"
                      title="Reconhecer"
                    >
                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
