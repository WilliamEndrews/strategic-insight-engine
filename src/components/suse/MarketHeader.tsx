/**
 * SUSE - Componente MarketHeader
 * 
 * Exibe informações do ativo (símbolo, preço atual, timeframe, tendência, etc.)
 * Versão corrigida com proteção total contra marketData undefined ou incompleto.
 * 
 * Data: 06/04/2026
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Wifi, WifiOff } from 'lucide-react';

interface MarketHeaderProps {
  marketData?: {
    symbol?: string;
    timeframe?: string;
    timestamp?: string;
    ohlc?: {
      open: number;
      high: number;
      low: number;
      close: number;
    };
    volume?: number;
    spread?: number;
  };
  trend?: string;
  isConnected?: boolean;
  className?: string;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({
  marketData = {},
  trend = 'INDETERMINADO',
  isConnected = true,
  className = '',
}) => {
  // Proteção contra marketData undefined ou incompleto
  const symbol = marketData.symbol || 'EURUSD';
  const timeframe = marketData.timeframe || 'M5';
  const closePrice = marketData.ohlc?.close ?? 0;
  const volume = marketData.volume ?? 0;

  // Ícone de tendência
  const trendIcon = 
    trend.includes('ALTA') || trend.includes('BULLISH') ? 
      <TrendingUp className="text-green-500" size={20} /> :
    trend.includes('BAIXA') || trend.includes('BEARISH') ? 
      <TrendingDown className="text-red-500" size={20} /> :
      <Minus className="text-yellow-500" size={20} />;

  return (
    <header className={`border-b border-border/50 bg-background/95 backdrop-blur-md ${className}`}>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Esquerda - Ativo e Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{symbol}</h1>
              <p className="text-sm text-muted-foreground">M5 • MetaTrader 5</p>
            </div>
          </div>

          <div className="ml-8 flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Preço Atual</span>
              <p className="font-mono text-lg font-medium">{closePrice.toFixed(5)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Volume</span>
              <p className="font-mono">{volume.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Centro - Tendência */}
        <div className="flex items-center gap-3">
          {trendIcon}
          <div>
            <p className="text-sm text-muted-foreground">Tendência Atual</p>
            <p className={`font-medium ${
              trend.includes('ALTA') || trend.includes('BULLISH') ? 'text-green-600' :
              trend.includes('BAIXA') || trend.includes('BEARISH') ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {trend}
            </p>
          </div>
        </div>

        {/* Direita - Status e Horário */}
        <div className="flex items-center gap-4">
          {/* Status de Conexão */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            isConnected 
              ? 'bg-green-500/10 text-green-600' 
              : 'bg-red-500/10 text-red-600'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Desconectado
              </>
            )}
          </div>

          {/* Horário da Última Atualização */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Última Atualização</p>
            <p className="text-sm font-mono text-foreground/80">
              {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};