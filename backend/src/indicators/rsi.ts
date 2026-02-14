import { Candle } from '../types/trading';

export function calculateRSI(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) throw new Error('Candles insuficientes para RSI.');

  let gains = 0;
  let losses = 0;

  // Calcula ganhos/perdas iniciais
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff; // Absoluto
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Suavização para o resto (se mais candles)
  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}