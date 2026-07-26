/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Trading Types and Interfaces (trading.ts)
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Definir todas as interfaces e tipos TypeScript utilizados em todo o sistema SUSE.
 * Cada tipo é documentado para explicar seu propósito, uso e importância.
 * 
 * NOTA DE ARQUITETURA:
 * Estes tipos formam o contrato entre todos os módulos do sistema (frontend, backend, IA).
 * Qualquer alteração aqui deve ser feita com cuidado para manter compatibilidade retroativa.
 * O tipo AIDecision é o mais crítico, pois é o que o trader visualiza diretamente no dashboard.
 */

/**
 * Representa as três possíveis decisões de trading que a IA pode sugerir.
 * - BUY: Oportunidade de entrar em posição comprada (long)
 * - SELL: Oportunidade de sair de posição ou entrar vendida (short)
 * - HOLD: Não operar — aguardar condições melhores (prioridade de segurança)
 */
export type TradingDecision = 'BUY' | 'SELL' | 'HOLD';

/**
 * Estados de tendência do mercado usados para contextualizar as decisões.
 * A IA considera o estado de tendência ao gerar recomendações.
 */
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'LATERAL' | 'HIGH_VOLATILITY';

/**
 * Categorias de nível de confiança para avaliação visual rápida.
 * Mapeia para cores específicas na interface (verde, amarelo, vermelho).
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Opções de timeframe para análise de mercado.
 * Compatíveis com os padrões do MetaTrader.
 */
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';

/**
 * Estrutura básica de dados OHLC (Open, High, Low, Close).
 * Unidade fundamental dos dados de preço na análise técnica.
 */
export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Dados completos de uma vela (candle), incluindo volume e timestamp.
 * Este é o formato recebido do MetaTrader ou provedores de dados.
 */
export interface CandleData extends OHLCData {
  timestamp: number;  // UNIX timestamp em milissegundos (number para compatibilidade)
  volume: number;
}

/**
 * Pacote de dados de mercado recebido do MetaTrader ou provedor.
 * Contém todas as informações necessárias para análise.
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
 * Valor individual de um indicador técnico com metadados.
 * Cada indicador fornece valor atual e interpretação qualitativa.
 */
export interface IndicatorValue {
  name: string;
  value: number | string;
  interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description?: string;
}

/**
 * Dados específicos do RSI (Relative Strength Index).
 * Inclui inclinação (slope) para análise de momentum.
 */
export interface RSIData extends IndicatorValue {
  slope: 'RISING' | 'FALLING' | 'FLAT';
  zone: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
}

/**
 * Dados das Médias Móveis Exponenciais (EMA).
 * Múltiplas EMAs usadas para identificação de tendência.
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
 * Níveis de retração/extensão de Fibonacci.
 * Chaves para identificação de suportes e resistências.
 */
export interface FibonacciLevels {
  level_0: number;      // 0% - Alta recente
  level_236: number;    // 23.6%
  level_382: number;    // 38.2%
  level_500: number;    // 50%
  level_618: number;    // 61.8%
  level_786: number;    // 78.6%
  level_1000: number;   // 100% - Baixa recente
  nearestLevel: string;
  distanceToNearest: number;
}

/**
 * Dados das Bandas de Bollinger.
 * Usadas para análise de volatilidade e reversão à média.
 */
export interface BollingerBandsData {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  pricePosition: 'ABOVE_UPPER' | 'ABOVE_MIDDLE' | 'BELOW_MIDDLE' | 'BELOW_LOWER';
}

/**
 * Resultado completo da análise técnica.
 * Agrega todos os indicadores calculados para uso pela IA.
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
 * Saída da IA - Decisão principal do sistema.
 * Contém a recomendação, confiança, probabilidades, explicações e duração estimada.
 * 
 * CRÍTICO: Este é o tipo que o trader visualiza diretamente no dashboard.
 * Toda decisão deve ser explicável e acompanhada de justificativas claras.
 */
export interface AIDecision {
  decision: TradingDecision;
  confidence: number; // Valor de 0 a 100 (já em percentual, conforme retornado pela IA Flask)
  probabilities: {
    buy: number;
    sell: number;
    hold: number;
  };
  explanations: string[]; // Justificativas técnicas claras e compreensíveis
  warnings: string[];     // Alertas de risco ou condições desfavoráveis
  timestamp: string;      // Data/hora da geração da decisão

  /**
   * Contribuições SHAP das principais features para a decisão.
   * Permite explicar "por que" a IA decidiu (XAI / Explainable AI).
   * Cada item contém nome da feature e valor da contribuição (positivo ou negativo).
   */
  shap_values?: {
    feature: string;
    contribution: number;
  }[];

  /**
   * Estimativa de duração da operação (campo crítico adicionado).
   * Ajuda o trader a gerenciar exposição temporal e risco.
   * Baseada em volatilidade (ATR) e histórico de tendências semelhantes.
   * Valores em minutos; confiança reflete a certeza da estimativa.
   * 
   * IMPORTANTE: Este campo é opcional no mockData, mas obrigatório na resposta real da IA.
   * No frontend, use condicional (?.) para evitar erros quando não disponível.
   */
  estimated_duration: {
    min: number;        // Tempo mínimo estimado (minutos)
    max: number;        // Tempo máximo estimado (minutos)
    confidence: number; // Confiança na estimativa (0-100%)
  };
}

/**
 * Resultado completo da análise combinada.
 * Pacote final enviado ao frontend para exibição no dashboard.
 */
export interface AnalysisResult {
  marketData: MarketData;
  technicalAnalysis: TechnicalAnalysis;
  aiDecision: AIDecision;
  processedAt: string; // Data/hora do processamento completo
}

/**
 * Configuração global do sistema SUSE.
 * Parâmetros ajustáveis que controlam o comportamento da IA e regras de risco.
 * 
 * FUTURO: Estes valores serão configuráveis por usuário/ativo/estratégia.
 */
export interface SUSEConfig {
  minConfidenceThreshold: number; // Abaixo disso → força HOLD
  maxVolatilityThreshold: number; // Acima disso → força HOLD
  indicatorsEnabled: string[];     // Indicadores ativos no momento
  riskManagement: {
    enabled: boolean;
    maxPositionSize: number;       // Tamanho máximo de posição (% do capital)
  };
}

/**
 * Estado de exibição do dashboard (estado da UI).
 * Controla o que está sendo mostrado ao usuário no momento.
 */
export interface DashboardState {
  selectedAsset: string;
  selectedTimeframe: Timeframe;
  isLive: boolean;
  lastUpdate: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}

/* ============================================================
 * FASE 2: Backtesting e Replay
 * ============================================================ */

export interface BacktestSummary {
  initial_capital: number;
  final_capital: number;
  total_return_pips: number;
  total_return_pct: number;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_win_pips: number;
  avg_loss_pips: number;
  profit_factor: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  total_candles: number;
  total_predictions: number;
  decision_distribution: Record<string, number>;
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  pnl_pips: number;
  result: 'WIN' | 'LOSS';
  reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'END_OF_DATA';
  entry_index: number;
  exit_index: number;
  confidence: number;
}

export interface EquityPoint {
  index: number;
  capital: number;
  price: number;
  decision: string;
  confidence: number;
  has_position: boolean;
}

export interface BacktestResult {
  summary: BacktestSummary;
  equity_curve: EquityPoint[];
  trades: BacktestTrade[];
  config: {
    window_size: number;
    step: number;
    stop_loss_pips: number;
    take_profit_pips: number;
    spread_pips: number;
  };
  timestamp: string;
  error?: string;
}

export interface ReplayStep {
  step: number;
  candle_index: number;
  price: number;
  decision: string;
  confidence: number;
  probabilities: { buy: number; sell: number; hold: number };
  estimated_duration: { min: number; max: number; confidence: number };
  top_features: Record<string, number>;
}

export interface ReplayResult {
  steps: ReplayStep[];
  total_steps: number;
  start_index: number;
  window_size: number;
  total_candles: number;
  timestamp: string;
  error?: string;
}

/* ============================================================
 * FASE 3: Multi-ativos, Multitimeframe, Gestão de Risco, Alertas
 * ============================================================ */

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
export type AlertCategory = 'SIGNAL' | 'RISK' | 'SYSTEM' | 'PRICE';

export interface AlertItem {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  symbol?: string;
  timeframe?: string;
  timestamp: string;
  acknowledged: boolean;
  data?: Record<string, unknown>;
}

export interface RiskAssessment {
  position_size: {
    recommended_lots: number;
    risk_amount: number;
    risk_percent: number;
    pip_value: number;
  };
  stop_loss: {
    price: number;
    pips: number;
    distance_percent: number;
  };
  take_profit: {
    price: number;
    pips: number;
    distance_percent: number;
  };
  risk_reward_ratio: number;
  max_loss: number;
  max_loss_percent: number;
  exposure: {
    current_positions: number;
    total_risk_percent: number;
    max_allowed_percent: number;
    available: boolean;
  };
  warnings: string[];
  recommendations: string[];
  timestamp: string;
  error?: string;
}

export interface RiskConfig {
  account_balance: number;
  risk_per_trade_percent: number;
  max_risk_percent: number;
  stop_loss_pips: number;
  take_profit_pips: number;
  pip_value: number;
  current_positions?: number;
  open_risk_percent?: number;
}

export interface AssetInfo {
  symbol: string;
  timeframe: Timeframe;
  last_price: number;
  decision: TradingDecision;
  confidence: number;
  trend: MarketTrend;
  last_update: string;
}

export interface MultiAssetResult {
  assets: AssetInfo[];
  total_assets: number;
  active_signals: number;
  high_confidence_signals: number;
  timestamp: string;
  error?: string;
}

/* ============================================================
 * FASE 4: Histórico de Decisões, Paper Trading, UX/UI
 * ============================================================ */

export interface DecisionHistoryEntry {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  decision: TradingDecision;
  confidence: number;
  probabilities: { buy: number; sell: number; hold: number };
  price: number;
  trend: MarketTrend;
  warnings: string[];
  estimated_duration: { min: number; max: number; confidence: number };
  top_features?: { name: string; contribution: number }[];
}

export interface DecisionHistoryResult {
  entries: DecisionHistoryEntry[];
  total: number;
  stats: {
    total_decisions: number;
    buy_count: number;
    sell_count: number;
    hold_count: number;
    avg_confidence: number;
    high_confidence_count: number;
  };
  error?: string;
}

export type PaperPositionStatus = 'OPEN' | 'CLOSED' | 'STOPPED' | 'TARGET_HIT';

export interface PaperPosition {
  id: string;
  symbol: string;
  timeframe: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  volume_lots: number;
  stop_loss: number;
  take_profit: number;
  open_time: string;
  close_time: string | null;
  status: PaperPositionStatus;
  pnl: number;
  pnl_pips: number;
  pips_to_sl: number;
  pips_to_tp: number;
  confidence_at_open: number;
  close_reason: string | null;
}

export interface PaperTradingAccount {
  balance: number;
  equity: number;
  margin_used: number;
  free_margin: number;
  open_positions: number;
  total_positions: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  total_pnl: number;
  total_pips: number;
  largest_win: number;
  largest_loss: number;
  profit_factor: number;
  positions: PaperPosition[];
  error?: string;
}

export interface PaperTradeRequest {
  action: 'OPEN' | 'CLOSE' | 'RESET' | 'UPDATE_SL_TP';
  symbol?: string;
  timeframe?: string;
  direction?: 'BUY' | 'SELL';
  volume_lots?: number;
  entry_price?: number;
  stop_loss_pips?: number;
  take_profit_pips?: number;
  confidence?: number;
  position_id?: string;
  current_price?: number;
}

export interface PaperTradeResult {
  success: boolean;
  message: string;
  account: PaperTradingAccount;
  position?: PaperPosition;
}