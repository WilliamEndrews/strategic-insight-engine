import express, { Request, Response } from 'express';
import cors from 'cors';
import { normalizeCandles } from './utils/normalize';
import { calculateRSI } from './indicators/rsi';
import { calculateEMA } from './indicators/ema';
import { Candle } from './types/trading';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

app.use(express.json()); // Correção: Parsing de JSON
app.use(express.urlencoded({ extended: true }));

app.post('/analyze', (req: Request, res: Response) => {
  console.log('Requisição recebida. Body:', req.body);

  const { candles } = req.body as { candles: Candle[] };

  try {
    if (!candles || !Array.isArray(candles) || candles.length < 14) {
      throw new Error('Dados insuficientes: Forneça pelo menos 14 candles válidos.');
    }

    const normalizedCandles = normalizeCandles(candles);
    const rsi = calculateRSI(normalizedCandles, 14);
    const ema20 = calculateEMA(normalizedCandles, 20);
    const ema50 = calculateEMA(normalizedCandles, 50);

    let decision: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0.5;
    let explanations: string[] = [];

    if (rsi < 30 && normalizedCandles[normalizedCandles.length - 1].close > ema20) {
      decision = 'BUY';
      confidence = 0.75;
      explanations.push('RSI abaixo de 30 indica sobrevenda; Preço acima de EMA20 sugere reversão de alta.');
    } else if (rsi > 70 && normalizedCandles[normalizedCandles.length - 1].close < ema50) {
      decision = 'SELL';
      confidence = 0.75;
      explanations.push('RSI acima de 70 indica sobrecompra; Preço abaixo de EMA50 sugere reversão de baixa.');
    } else {
      explanations.push('Condições neutras ou incertas; Recomendação conservadora para HOLD.');
    }

    if (confidence < 0.6) {
      decision = 'HOLD';
      explanations.push('Baixa confiança: Forçando HOLD para proteção de capital.');
    }

    res.json({
      decision,
      confidence: confidence * 100,
      explanations,
      indicators: { rsi, ema20, ema50 },
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});