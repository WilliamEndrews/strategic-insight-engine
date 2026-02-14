// src/types/trading.ts
// Definições de tipos para todo o domínio de trading do SUSE
// Código comentado para servir como documentação viva

/**
 * Representa uma vela (candle) no formato OHLCV + timestamp
 * Usada para enviar dados históricos ao backend para análise técnica
 */
export interface Candle {
  open: number;      // Preço de abertura
  high: number;      // Preço máximo da vela
  low: number;       // Preço mínimo da vela
  close: number;     // Preço de fechamento
  volume: number;    // Volume negociado
  timestamp: number; // Timestamp UNIX em milissegundos (Date.now())
}

/**
 * Decisão gerada pela IA (BUY, SELL ou HOLD)
 */
export interface AIDecision {
  decision: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;           // 0 a 1 (ou 0 a 100, dependendo da convenção)
  probabilities: {
    buy: number;
    sell: number;
    hold: number;
  };
  explanations: string[];
  warnings: string[];
  timestamp: string;            // ISO string
}

/**
 * Análise técnica com indicadores calculados
 */
export interface TechnicalAnalysis {
  rsi: {
    name: string;
    value: number;
    interpretation: string;
    description: string;
    slope: string;
    zone: string;
  };
  ema: {
    ema20: number;
    ema50: number;
    ema200: number;
    priceRelation: {
      aboveEMA20: boolean;
      aboveEMA50: boolean;
      aboveEMA200: boolean;
    };
  };
  vwap: {
    name: string;
    value: number;
    interpretation: string;
    description: string;
  };
  atr: {
    name: string;
    value: number;
    interpretation: string;
    description: string;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    pricePosition: string;
  };
  fibonacci: {
    level_0: number;
    level_236: number;
    level_382: number;
    level_500: number;
    level_618: number;
    level_786: number;
    level_1000: number;
    nearestLevel: string;
    distanceToNearest: number;
  };
  volumeAnalysis: {
    name: string;
    value: number;
    interpretation: string;
    description: string;
  };
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

/**
 * Dados atuais do mercado (ativo, timeframe, preço atual, etc.)
 */
export interface MarketData {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  volume: number;
  spread: number;
}

/**
 * Tipos de timeframe suportados
 */
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';

/**
 * Resultado completo de uma análise (o que o backend retorna e o frontend consome)
 */
export interface AnalysisResult {
  marketData: MarketData;
  technicalAnalysis: TechnicalAnalysis;
  aiDecision: AIDecision;   // ← importante: usamos aiDecision aqui
  processedAt: string;
}