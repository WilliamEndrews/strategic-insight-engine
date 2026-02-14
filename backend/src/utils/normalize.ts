import { Candle } from '../types/trading';

export function normalizeCandles(candles: Candle[]): Candle[] {
  return candles.map((candle) => ({
    open: Math.max(candle.open, 0), // Corrige negativos
    high: Math.max(candle.high, candle.open),
    low: Math.min(candle.low, candle.open),
    close: Math.max(candle.close, 0),
    volume: Math.max(candle.volume, 0),
    timestamp: new Date(candle.timestamp).getTime(), // Normaliza para UNIX
  }));
}