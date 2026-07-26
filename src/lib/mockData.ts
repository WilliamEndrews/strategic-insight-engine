/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Dados Mock para Desenvolvimento do MVP (mockData.ts)
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Fornecer dados realistas e consistentes para desenvolvimento da interface
 * sem depender do backend ou do MetaTrader. Todos os componentes do dashboard
 * utilizam esses dados durante a fase de prototipação.
 * 
 * FUTURO: Esses dados serão substituídos por informações em tempo real
 * vindas do Expert Advisor (EA) no MetaTrader via backend.
 * 
 * IMPORTANTE: Todos os mocks de AIDecision agora incluem estimated_duration
 * para compatibilidade com o tipo atualizado (obrigatório). Valores são simulados.
 */

import type {
  AIDecision,
  TechnicalAnalysis,
  MarketData,
  AnalysisResult,
  Timeframe,
  CandleData,
} from '@/types/trading';

/**
 * Decisão de COMPRA (BUY) com alta confiança
 * Representa um cenário ideal de entrada longa
 */
export const mockBuyDecision: AIDecision = {
  decision: 'BUY',
  confidence: 87,
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
  shap_values: [
    { feature: 'rsi', contribution: 0.32 },
    { feature: 'momentum_10', contribution: 0.18 },
    { feature: 'crossover_9_21', contribution: 0.14 },
    { feature: 'dist_ema9', contribution: -0.08 },
    { feature: 'resistance_distance', contribution: -0.05 },
  ],
  // Campo obrigatório adicionado para compatibilidade com tipo AIDecision
  estimated_duration: {
    min: 12,           // Tempo mínimo estimado (minutos)
    max: 25,           // Tempo máximo estimado (minutos)
    confidence: 78     // Confiança na estimativa (%)
  }
};

/**
 * Decisão de VENDA (SELL) com confiança média-alta
 * Representa um cenário de saída ou posição vendida
 */
export const mockSellDecision: AIDecision = {
  decision: 'SELL',
  confidence: 72,
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
  shap_values: [
    { feature: 'rsi', contribution: -0.28 },
    { feature: 'momentum_20', contribution: -0.21 },
    { feature: 'resistance_distance', contribution: -0.15 },
    { feature: 'atr_percentil', contribution: 0.09 },
    { feature: 'volume_zscore', contribution: 0.04 },
  ],
  // Campo obrigatório adicionado para compatibilidade com tipo AIDecision
  estimated_duration: {
    min: 8,            // Tempo mínimo estimado (minutos)
    max: 18,           // Tempo máximo estimado (minutos)
    confidence: 65     // Confiança na estimativa (%)
  }
};

/**
 * Decisão de ESPERA (HOLD)
 * Representa cenário sem oportunidade clara (prioridade de segurança)
 */
export const mockHoldDecision: AIDecision = {
  decision: 'HOLD',
  confidence: 45,
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
  shap_values: [
    { feature: 'momentum_5', contribution: 0.10 },
    { feature: 'momentum_20', contribution: -0.10 },
    { feature: 'rsi', contribution: 0.05 },
    { feature: 'volume_rel', contribution: 0.03 },
    { feature: 'support_distance', contribution: -0.02 },
  ],
  // Campo obrigatório adicionado para compatibilidade com tipo AIDecision
  estimated_duration: {
    min: 0,            // HOLD pode ser indefinido → min 0
    max: 60,           // Tempo máximo sugerido para reavaliação (minutos)
    confidence: 45     // Confiança baixa, refletindo incerteza
  }
};

/**
 * Análise técnica completa mockada
 * Simula todos os indicadores que o backend irá calcular
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
 * Dados de mercado mockados para EUR/USD
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
 * Resultado completo de análise (o que o dashboard exibe)
 * Usa o mockBuyDecision (com estimated_duration já adicionado)
 */
export const mockAnalysisResult: AnalysisResult = {
  marketData: mockMarketData,
  technicalAnalysis: mockTechnicalAnalysis,
  aiDecision: mockBuyDecision, // Já contém estimated_duration
  processedAt: new Date().toISOString(),
};

/**
 * Lista de ativos disponíveis para seleção
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
 * Timeframes disponíveis
 */
export const availableTimeframes: Timeframe[] = [
  'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1',
];

/**
 * Função utilitária para teste rápido de diferentes sinais
 */
export function getRandomDecision(): AIDecision {
  const decisions = [mockBuyDecision, mockSellDecision, mockHoldDecision];
  return decisions[Math.floor(Math.random() * decisions.length)];
}

/**
 * CANDLES MOCKADOS - DADOS HISTÓRICOS PARA TESTE DO BACKEND
 * 
 * Gera 120 velas realistas de EUR/USD M5 — alinhado com o EA MQL5 que envia 120 candles.
 * Simulam uma tendência de alta com pullback e retomada (cenário do mockBuyDecision)
 * 
 * Timestamp em milissegundos (number) para compatibilidade com backend
 */
export const mockCandles: CandleData[] = Array.from({ length: 120 }, (_, i) => ({
  open: 1.082 + i * 0.0002,
  high: 1.0825 + i * 0.0002,
  low: 1.0818 + i * 0.0002,
  close: 1.0823 + i * 0.0002,
  volume: 1100 + i * 10,
  timestamp: Date.now() - (120 - i) * 30000, // Sequência crescente (ordem cronológica)
}));