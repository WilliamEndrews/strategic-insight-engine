/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Mock Data for MVP Development
 * 
 * This file provides realistic mock data for UI development and testing.
 * In production, this will be replaced by real-time data from MetaTrader.
 * 
 * PURPOSE:
 * - Enable UI development without backend connection
 * - Provide consistent test cases for component development
 * - Demonstrate the data structures the system will use
 */

import type {
  AIDecision,
  TechnicalAnalysis,
  MarketData,
  AnalysisResult,
  Timeframe,
} from '@/types/trading';

/**
 * Generates a mock BUY signal with high confidence.
 * Represents an ideal buying opportunity scenario.
 */
export const mockBuyDecision: AIDecision = {
  decision: 'BUY',
  confidence: 0.87,
  probabilities: {
    buy: 0.87,
    sell: 0.05,
    hold: 0.08,
  },
  explanations: [
    'RSI saindo da zona de sobrevenda (32 → 38)',
    'Preço reagindo no nível de Fibonacci 61.8%',
    'Tendência principal de alta confirmada pela EMA 200',
    'Volume 23% acima da média dos últimos 20 períodos',
    'Bandas de Bollinger indicando compressão pré-expansão',
  ],
  warnings: [
    'Proximidade de resistência em 1.0895',
  ],
  timestamp: new Date().toISOString(),
};

/**
 * Generates a mock SELL signal with medium-high confidence.
 * Represents a selling opportunity scenario.
 */
export const mockSellDecision: AIDecision = {
  decision: 'SELL',
  confidence: 0.72,
  probabilities: {
    buy: 0.12,
    sell: 0.72,
    hold: 0.16,
  },
  explanations: [
    'RSI em zona de sobrecompra (78)',
    'Divergência bearish no MACD',
    'Rejeição no topo das Bandas de Bollinger',
    'Volume decrescente nas últimas 3 velas',
  ],
  warnings: [
    'Volatilidade elevada - ATR acima do normal',
    'Notícia econômica em 2 horas',
  ],
  timestamp: new Date().toISOString(),
};

/**
 * Generates a mock HOLD signal.
 * Represents a scenario where no clear opportunity exists.
 */
export const mockHoldDecision: AIDecision = {
  decision: 'HOLD',
  confidence: 0.45,
  probabilities: {
    buy: 0.28,
    sell: 0.27,
    hold: 0.45,
  },
  explanations: [
    'Mercado em consolidação lateral',
    'RSI neutro em 52',
    'Sem confirmação de tendência clara',
    'Aguardando rompimento de range',
  ],
  warnings: [
    'Confiança abaixo do limite mínimo configurado',
    'Recomendação: aguardar melhor setup',
  ],
  timestamp: new Date().toISOString(),
};

/**
 * Mock technical analysis data.
 * Represents a complete analysis of the current market state.
 */
export const mockTechnicalAnalysis: TechnicalAnalysis = {
  rsi: {
    name: 'RSI (14)',
    value: 38,
    interpretation: 'BULLISH',
    description: 'Saindo da zona de sobrevenda',
    slope: 'RISING',
    zone: 'NEUTRAL',
  },
  ema: {
    ema20: 1.0862,
    ema50: 1.0848,
    ema200: 1.0792,
    priceRelation: {
      aboveEMA20: true,
      aboveEMA50: true,
      aboveEMA200: true,
    },
  },
  vwap: {
    name: 'VWAP',
    value: 1.0855,
    interpretation: 'BULLISH',
    description: 'Preço acima do VWAP',
  },
  atr: {
    name: 'ATR (14)',
    value: 0.0045,
    interpretation: 'NEUTRAL',
    description: 'Volatilidade normal',
  },
  bollingerBands: {
    upper: 1.0912,
    middle: 1.0867,
    lower: 1.0822,
    bandwidth: 0.0090,
    pricePosition: 'ABOVE_MIDDLE',
  },
  fibonacci: {
    level_0: 1.0950,
    level_236: 1.0915,
    level_382: 1.0889,
    level_500: 1.0867,
    level_618: 1.0845,
    level_786: 1.0815,
    level_1000: 1.0784,
    nearestLevel: '61.8%',
    distanceToNearest: 0.0022,
  },
  volumeAnalysis: {
    name: 'Volume Relativo',
    value: 1.23,
    interpretation: 'BULLISH',
    description: '23% acima da média',
  },
  trend: 'BULLISH',
};

/**
 * Mock market data for EUR/USD.
 */
export const mockMarketData: MarketData = {
  symbol: 'EUR/USD',
  timeframe: 'M5' as Timeframe,
  timestamp: new Date().toISOString(),
  ohlc: {
    open: 1.0862,
    high: 1.0871,
    low: 1.0858,
    close: 1.0867,
  },
  volume: 1234,
  spread: 0.8,
};

/**
 * Complete analysis result combining all mock data.
 * This is what the UI will display.
 */
export const mockAnalysisResult: AnalysisResult = {
  marketData: mockMarketData,
  technicalAnalysis: mockTechnicalAnalysis,
  aiDecision: mockBuyDecision,
  processedAt: new Date().toISOString(),
};

/**
 * Available trading assets for the dropdown.
 * FUTURE: This will come from MetaTrader connection.
 */
export const availableAssets = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'XAU/USD',
  'BTC/USD',
];

/**
 * Available timeframes.
 */
export const availableTimeframes: Timeframe[] = [
  'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1',
];

/**
 * Returns a random decision for demo purposes.
 * Useful for showing different UI states.
 */
export function getRandomDecision(): AIDecision {
  const decisions = [mockBuyDecision, mockSellDecision, mockHoldDecision];
  return decisions[Math.floor(Math.random() * decisions.length)];
}
