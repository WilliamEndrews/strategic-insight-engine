/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * MarketHeader Component
 * 
 * PURPOSE:
 * Displays the current market context at the top of the dashboard.
 * Shows asset, timeframe, price, and connection status.
 * 
 * DESIGN PHILOSOPHY:
 * - Always visible information
 * - Clean, professional appearance
 * - Status indicators for system health
 * - Quick asset/timeframe switching
 */

import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Minus,
  ChevronDown
} from 'lucide-react';
import type { MarketData, MarketTrend, Timeframe } from '@/types/trading';
import { availableAssets, availableTimeframes } from '@/lib/mockData';

interface MarketHeaderProps {
  marketData: MarketData;
  trend: MarketTrend;
  isConnected: boolean;
  onAssetChange?: (asset: string) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  className?: string;
}

/**
 * Trend icon component.
 */
function TrendIcon({ trend }: { trend: MarketTrend }) {
  switch (trend) {
    case 'BULLISH':
      return <TrendingUp className="w-4 h-4 text-indicator-bullish" />;
    case 'BEARISH':
      return <TrendingDown className="w-4 h-4 text-indicator-bearish" />;
    default:
      return <Minus className="w-4 h-4 text-indicator-neutral" />;
  }
}

/**
 * Formats price change for display.
 */
function PriceChange({ open, close }: { open: number; close: number }) {
  const change = close - open;
  const changePercent = (change / open) * 100;
  const isPositive = change >= 0;

  return (
    <span className={cn(
      'font-mono text-sm',
      isPositive ? 'text-indicator-bullish' : 'text-indicator-bearish'
    )}>
      {isPositive ? '+' : ''}{changePercent.toFixed(3)}%
    </span>
  );
}

export function MarketHeader({
  marketData,
  trend,
  isConnected,
  onAssetChange,
  onTimeframeChange,
  className,
}: MarketHeaderProps) {
  const { symbol, timeframe, ohlc, timestamp } = marketData;

  return (
    <header className={cn(
      'glass-panel px-4 py-3 flex items-center justify-between flex-wrap gap-4',
      className
    )}>
      {/* Left section - Logo and asset */}
      <div className="flex items-center gap-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">SU</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">SUSE</h1>
            <p className="text-[10px] text-muted-foreground leading-none">
              Suporte Estratégico
            </p>
          </div>
        </div>

        {/* Asset selector */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            onClick={() => {
              // FUTURE: Open asset selector modal
            }}
          >
            <span className="font-semibold text-foreground">{symbol}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Timeframe selector */}
          <button
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            onClick={() => {
              // FUTURE: Open timeframe selector
            }}
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{timeframe}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Center section - Price */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Preço Atual</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-bold text-foreground">
              {ohlc.close.toFixed(5)}
            </span>
            <PriceChange open={ohlc.open} close={ohlc.close} />
          </div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
          <TrendIcon trend={trend} />
          <span className={cn(
            'text-sm font-medium',
            trend === 'BULLISH' && 'text-indicator-bullish',
            trend === 'BEARISH' && 'text-indicator-bearish',
            (trend === 'LATERAL' || trend === 'HIGH_VOLATILITY') && 'text-indicator-neutral'
          )}>
            {trend === 'BULLISH' && 'Alta'}
            {trend === 'BEARISH' && 'Baixa'}
            {trend === 'LATERAL' && 'Lateral'}
            {trend === 'HIGH_VOLATILITY' && 'Volátil'}
          </span>
        </div>
      </div>

      {/* Right section - Status */}
      <div className="flex items-center gap-4">
        {/* Last update time */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Última Atualização</p>
          <p className="text-sm font-mono text-foreground/80">
            {new Date(timestamp).toLocaleTimeString('pt-BR')}
          </p>
        </div>

        {/* Connection status */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          isConnected ? 'bg-indicator-bullish/20' : 'bg-indicator-bearish/20'
        )}>
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-indicator-bullish" />
              <span className="text-sm text-indicator-bullish">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-indicator-bearish" />
              <span className="text-sm text-indicator-bearish">Desconectado</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
