import { Candle } from '../types/trading';

export function calculateEMA(candles: Candle[], period: number): number {
  if (candles.length < period) {
    console.log(`Candles insuficientes para EMA de period=${period}. Disponíveis: ${candles.length}`);
    throw new Error('Candles insuficientes para EMA.');
  }

  let ema = candles[0].close;
  const multiplier = 2 / (period + 1);

  for (let i = 1; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema;
  }

  return ema;
}