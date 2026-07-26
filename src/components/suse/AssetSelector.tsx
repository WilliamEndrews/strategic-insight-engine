/**
 * SUSE - AssetSelector Component
 * FASE 3: Seletor de ativos e timeframes com visão multi-ativo.
 */

import { useState, useCallback } from 'react';
import {
  LayoutGrid, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
  ChevronRight, AlertTriangle
} from 'lucide-react';
import type { Timeframe, TradingDecision } from '@/types/trading';
import { cn } from '@/lib/utils';

interface AssetSelectorProps {
  className?: string;
  currentSymbol?: string;
  currentTimeframe?: Timeframe;
  onSelectAsset?: (symbol: string, timeframe: Timeframe) => void;
}

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'BTCUSD', 'ETHUSD'];
const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

interface AssetSummary {
  symbol: string;
  timeframe: Timeframe;
  decision: TradingDecision;
  confidence: number;
  lastPrice: number;
  trend: string;
}

export function AssetSelector({ className, currentSymbol = 'EURUSD', currentTimeframe = 'M5', onSelectAsset }: AssetSelectorProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(currentSymbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(currentTimeframe);
  const [summaries, setSummaries] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For each symbol, do a quick analysis using mock candles
      // In production, this would fetch from MT5 or cache
      const results: AssetSummary[] = [];

      for (const symbol of SYMBOLS) {
        // Try to get analysis from backend
        try {
          const resp = await fetch('http://localhost:4000/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candles: generateMockCandlesForSymbol(symbol) }),
          });
          if (resp.ok) {
            const data = await resp.json();
            results.push({
              symbol,
              timeframe: selectedTimeframe,
              decision: data.aiDecision?.decision || 'HOLD',
              confidence: data.aiDecision?.confidence || 0,
              lastPrice: data.marketData?.ohlc?.close || 0,
              trend: data.technicalAnalysis?.trend || 'LATERAL',
            });
          }
        } catch {
          // Skip if backend unavailable
        }
      }

      setSummaries(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao escanear ativos');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  const decisionColor = (d: string) => {
    if (d === 'BUY') return 'text-green-600 bg-green-500/15';
    if (d === 'SELL') return 'text-red-600 bg-red-500/15';
    return 'text-yellow-600 bg-yellow-500/15';
  };

  const DecisionIcon = ({ d, className }: { d: string; className?: string }) => {
    if (d === 'BUY') return <TrendingUp className={className} />;
    if (d === 'SELL') return <TrendingDown className={className} />;
    return <Minus className={className} />;
  };

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Multi-Ativos</h3>
            <p className="text-xs text-muted-foreground">Visão geral por ativo</p>
          </div>
        </div>
        <button
          onClick={scanAssets}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Escanear
        </button>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-1 p-2 bg-secondary/20 overflow-x-auto">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium transition whitespace-nowrap',
              selectedTimeframe === tf
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            {tf}
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

      {/* Asset list */}
      <div className="max-h-64 overflow-y-auto">
        {summaries.length === 0 && !loading ? (
          <div className="p-6 text-center">
            <LayoutGrid className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Clique em Escanear para analisar múltiplos ativos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {summaries.map((s) => (
              <button
                key={s.symbol}
                onClick={() => {
                  setSelectedSymbol(s.symbol);
                  onSelectAsset?.(s.symbol, s.timeframe);
                }}
                className={cn(
                  'flex items-center justify-between w-full p-3 hover:bg-secondary/30 transition text-left',
                  selectedSymbol === s.symbol && 'bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold', decisionColor(s.decision))}>
                    <DecisionIcon d={s.decision} className="w-3 h-3" />
                    {s.decision}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{s.symbol}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {s.lastPrice > 0 ? s.lastPrice.toFixed(5) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={cn('text-xs font-semibold',
                      s.confidence >= 70 ? 'text-green-600' :
                      s.confidence >= 50 ? 'text-yellow-600' : 'text-red-600')}>
                      {s.confidence.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.trend}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected asset display */}
      <div className="p-3 border-t border-border/50 bg-secondary/10">
        <p className="text-[10px] text-muted-foreground">
          Ativo selecionado: <span className="font-semibold text-foreground">{selectedSymbol} • {selectedTimeframe}</span>
        </p>
      </div>
    </div>
  );
}

/* Generate simple mock candles for symbols that don't have real data */
function generateMockCandlesForSymbol(symbol: string) {
  const basePrice: Record<string, number> = {
    EURUSD: 1.0850, GBPUSD: 1.2700, USDJPY: 149.50,
    AUDUSD: 0.6600, USDCAD: 1.3600, BTCUSD: 65000, ETHUSD: 3500,
  };
  const base = basePrice[symbol] || 1.0000;
  const candles = [];
  let price = base;

  for (let i = 0; i < 120; i++) {
    const change = (Math.random() - 0.5) * (base * 0.002);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.abs(change) * 0.5;
    candles.push({
      timestamp: Date.now() - (120 - i) * 300000,
      open: round(open, symbol),
      high: round(high, symbol),
      low: round(low, symbol),
      close: round(close, symbol),
      volume: Math.floor(Math.random() * 1000) + 100,
      symbol,
    });
    price = close;
  }
  return candles;
}

function round(val: number, symbol: string) {
  if (symbol.includes('JPY')) return Math.round(val * 1000) / 1000;
  if (symbol.includes('BTC')) return Math.round(val * 100) / 100;
  if (symbol.includes('ETH')) return Math.round(val * 100) / 100;
  return Math.round(val * 100000) / 100000;
}
