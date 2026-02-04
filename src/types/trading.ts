/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Trading Types and Interfaces
 * 
 * This file defines all TypeScript types used throughout the SUSE system.
 * Each type is documented to explain its purpose and usage.
 * 
 * ARCHITECTURE NOTE:
 * These types form the contract between all modules of the system.
 * Any changes here should be carefully considered for backward compatibility.
 */

/**
 * Represents the three possible trading decisions the AI can make.
 * - BUY: Opportunity to enter a long position
 * - SELL: Opportunity to exit or enter a short position  
 * - HOLD: No action recommended - wait for better conditions
 */
export type TradingDecision = 'BUY' | 'SELL' | 'HOLD';

/**
 * Market trend states used to contextualize trading decisions.
 * The AI considers trend state when generating recommendations.
 */
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'LATERAL' | 'HIGH_VOLATILITY';

/**
 * Confidence level categories for quick visual assessment.
 * Maps to specific color coding in the UI.
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Timeframe options for market analysis.
 * Standard MetaTrader-compatible timeframes.
 */
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';

/**
 * OHLC (Open, High, Low, Close) candle data structure.
 * The fundamental unit of price data in technical analysis.
 */
export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Complete candle data with volume and timestamp.
 * This is what we receive from MetaTrader or data providers.
 */
export interface CandleData extends OHLCData {
  timestamp: string;
  volume: number;
}

/**
 * Market data packet received from MetaTrader.
 * Contains all information needed for analysis.
 */
export interface MarketData {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  ohlc: OHLCData;
  volume: number;
  spread: number;
}

/**
 * Individual technical indicator value with metadata.
 * Each indicator provides its current value and interpretation.
 */
export interface IndicatorValue {
  name: string;
  value: number | string;
  interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description?: string;
}

/**
 * RSI (Relative Strength Index) specific data.
 * Includes slope for momentum analysis.
 */
export interface RSIData extends IndicatorValue {
  slope: 'RISING' | 'FALLING' | 'FLAT';
  zone: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
}

/**
 * Exponential Moving Average data.
 * Multiple EMAs used for trend identification.
 */
export interface EMAData {
  ema20: number;
  ema50: number;
  ema200: number;
  priceRelation: {
    aboveEMA20: boolean;
    aboveEMA50: boolean;
    aboveEMA200: boolean;
  };
}

/**
 * Fibonacci retracement levels.
 * Key levels for support/resistance identification.
 */
export interface FibonacciLevels {
  level_0: number;      // 0% - Recent high
  level_236: number;    // 23.6%
  level_382: number;    // 38.2%
  level_500: number;    // 50%
  level_618: number;    // 61.8%
  level_786: number;    // 78.6%
  level_1000: number;   // 100% - Recent low
  nearestLevel: string;
  distanceToNearest: number;
}

/**
 * Bollinger Bands data.
 * Used for volatility and mean reversion analysis.
 */
export interface BollingerBandsData {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  pricePosition: 'ABOVE_UPPER' | 'ABOVE_MIDDLE' | 'BELOW_MIDDLE' | 'BELOW_LOWER';
}

/**
 * Complete technical analysis result.
 * Aggregates all indicators for AI processing.
 */
export interface TechnicalAnalysis {
  rsi: RSIData;
  ema: EMAData;
  vwap: IndicatorValue;
  atr: IndicatorValue;
  bollingerBands: BollingerBandsData;
  fibonacci: FibonacciLevels;
  volumeAnalysis: IndicatorValue;
  trend: MarketTrend;
}

/**
 * AI Decision Output - The core response from the AI engine.
 * Contains the decision, confidence, and full explanation.
 * 
 * CRITICAL: This is what traders see. Every decision MUST be explainable.
 */
export interface AIDecision {
  decision: TradingDecision;
  confidence: number; // 0.0 to 1.0
  probabilities: {
    buy: number;
    sell: number;
    hold: number;
  };
  explanations: string[];
  warnings: string[];
  timestamp: string;
}

/**
 * Complete analysis result combining market data with AI decision.
 * This is the full package presented to the trader.
 */
export interface AnalysisResult {
  marketData: MarketData;
  technicalAnalysis: TechnicalAnalysis;
  aiDecision: AIDecision;
  processedAt: string;
}

/**
 * Configuration for the SUSE system.
 * All parameters that can be tuned.
 * 
 * FUTURE: These will be adjustable per strategy/asset.
 */
export interface SUSEConfig {
  minConfidenceThreshold: number; // Below this → HOLD
  maxVolatilityThreshold: number; // Above this → HOLD
  indicatorsEnabled: string[];
  riskManagement: {
    enabled: boolean;
    maxPositionSize: number;
  };
}

/**
 * UI Display state for the dashboard.
 * Tracks what's being shown to the user.
 */
export interface DashboardState {
  selectedAsset: string;
  selectedTimeframe: Timeframe;
  isLive: boolean;
  lastUpdate: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}
