import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { logger } from './logger';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const IA_HOST = process.env.IA_HOST || 'localhost';
const IA_PORT = parseInt(process.env.IA_PORT || '5000', 10);
const IA_PATH = '/ia';

app.use(cors({ origin: '*' }));
app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.use((req, res, next) => {
  logger.info('Request received', { method: req.method, url: req.url, ip: req.ip });
  next();
});

/**
 * Função utilitária para parsear o body raw recebido do EA ou do frontend.
 * Aplica limpeza agressiva para tolerar JSON levemente malformado (legado do MT5).
 */
function parseRawBody(req: Request): { candles: object[] } {
  let bodyText = '';
  if (Buffer.isBuffer(req.body)) bodyText = req.body.toString('utf8');
  else if (typeof req.body === 'string') bodyText = req.body;

  bodyText = bodyText.trim();
  if (bodyText.endsWith(',')) bodyText = bodyText.slice(0, -1);
  if (!bodyText.startsWith('{')) bodyText = '{' + bodyText;
  if (!bodyText.endsWith('}')) bodyText += '}';

  const parsed = JSON.parse(bodyText);
  return { candles: parsed.candles || [] };
}

/**
 * Faz proxy de um payload JSON para a IA Flask e retorna a resposta.
 */
function proxyToIA(payload: object, path: string = IA_PATH): Promise<object> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const options: http.RequestOptions = {
      hostname: IA_HOST,
      port: IA_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Resposta inválida da IA: ${data.substring(0, 200)}`));
        }
      });
    });

    proxyReq.on('error', (err) => {
      reject(new Error(`Falha ao conectar na IA Flask (${IA_HOST}:${IA_PORT}): ${err.message}`));
    });

    const timeoutMs = path === '/ia' ? 15000 : 120000;
    proxyReq.setTimeout(timeoutMs, () => {
      proxyReq.destroy();
      reject(new Error(`Timeout ao aguardar resposta da IA (>${timeoutMs / 1000}s) [${path}]`));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

/**
 * POST /analyze
 * Rota legada: recebe candles do EA (MQL5) e valida o payload.
 * Mantida para compatibilidade com o Expert Advisor existente.
 */
app.post('/analyze', (req: Request, res: Response) => {
  logger.info('Route /analyze (legacy EA)');

  let bodyText = '';
  if (Buffer.isBuffer(req.body)) bodyText = req.body.toString('utf8');
  else if (typeof req.body === 'string') bodyText = req.body;

  logger.debug('Body received', { length: bodyText.length });

  try {
    bodyText = bodyText.trim();
    if (bodyText.endsWith(',')) bodyText = bodyText.slice(0, -1);
    if (!bodyText.startsWith('{')) bodyText = '{' + bodyText;
    if (!bodyText.endsWith('}')) bodyText += '}';

    const parsed = JSON.parse(bodyText);
    const candles = parsed.candles || [];

    logger.info('Candles received', { count: candles.length });

    res.json({
      status: "success",
      candlesReceived: candles.length,
      message: "Dados recebidos corretamente"
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Failed to parse JSON', { error: msg, bodyPreview: bodyText.substring(0, 200) });
    res.status(400).json({ error: msg, bodyLength: bodyText.length });
  }
});

/**
 * POST /ia
 * Rota principal consumida pelo dashboard React.
 * Recebe candles, faz proxy para a IA Flask em :5000/ia e mapeia a resposta
 * flat da IA para o formato AnalysisResult esperado pelo frontend.
 */
/**
 * GET /health
 * Health check para Docker e PM2.
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'suse-backend', version: '2.0' });
});

/**
 * POST /ia
 * Rota principal consumida pelo dashboard React.
 */
app.post('/ia', async (req: Request, res: Response) => {
  logger.info('Route /ia');

  try {
    const { candles } = parseRawBody(req);
    logger.info('Candles parsed', { count: candles.length });

    if (candles.length === 0) {
      res.status(400).json({ error: 'Nenhum candle recebido no payload.' });
      return;
    }

    logger.info('Proxying to IA Flask', { host: IA_HOST, port: IA_PORT, path: IA_PATH });
    const iaRaw = await proxyToIA({ candles }) as Record<string, unknown>;

    logger.info('IA response received', { decision: iaRaw.decision, confidence: iaRaw.confidence });

    // A IA Flask retorna campos no nível raiz. Mapeia para AnalysisResult.
    const lastCandle = (candles[candles.length - 1] || {}) as Record<string, unknown>;

    const analysisResult = {
      marketData: {
        symbol: (lastCandle.symbol as string) || 'UNKNOWN',
        timeframe: 'M5',
        timestamp: new Date().toISOString(),
        ohlc: {
          open:  Number(lastCandle.open  ?? 0),
          high:  Number(lastCandle.high  ?? 0),
          low:   Number(lastCandle.low   ?? 0),
          close: Number(lastCandle.close ?? 0),
        },
        volume: Number(lastCandle.volume ?? 0),
        spread: 0,
      },
      technicalAnalysis: {
        rsi: {
          name: 'RSI (14)',
          value: parseFloat(
            ((iaRaw.explanations as string[] | undefined)?.[0]?.match(/[\d.]+/)?.[0]) ?? '0'
          ),
          interpretation: 'NEUTRAL',
          description: (iaRaw.explanations as string[] | undefined)?.[0] ?? '',
          slope: 'FLAT',
          zone: 'NEUTRAL',
        },
        ema: {
          ema20: 0,
          ema50: 0,
          ema200: 0,
          priceRelation: {
            aboveEMA20: false,
            aboveEMA50: false,
            aboveEMA200: false,
          },
        },
        vwap:   { name: 'VWAP',   value: 0, interpretation: 'NEUTRAL' },
        atr:    { name: 'ATR',    value: 0, interpretation: 'NEUTRAL' },
        bollingerBands: {
          upper: 0, middle: 0, lower: 0, bandwidth: 0, pricePosition: 'ABOVE_MIDDLE',
        },
        fibonacci: {
          level_0: 0, level_236: 0, level_382: 0, level_500: 0,
          level_618: 0, level_786: 0, level_1000: 0,
          nearestLevel: 'N/A', distanceToNearest: 0,
        },
        volumeAnalysis: { name: 'Volume Relativo', value: 0, interpretation: 'NEUTRAL' },
        trend: 'LATERAL',
      },
      aiDecision: {
        decision:     iaRaw.decision     ?? 'HOLD',
        confidence:   iaRaw.confidence   ?? 0,
        probabilities: iaRaw.probabilities ?? { buy: 0, sell: 0, hold: 1 },
        explanations: iaRaw.explanations ?? [],
        warnings:     iaRaw.warnings     ?? [],
        timestamp:    iaRaw.timestamp    ?? new Date().toISOString(),
        estimated_duration: iaRaw.estimated_duration ?? { min: 5, max: 30, confidence: 0 },
        shap_values:  (iaRaw.shap_values as unknown[]) ?? [],
      },
      processedAt: new Date().toISOString(),
    };

    res.json(analysisResult);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /ia route', { error: msg });
    res.status(502).json({
      error: msg,
      hint: `Verifique se a IA Flask está rodando em http://${IA_HOST}:${IA_PORT}`
    });
  }
});

/**
 * POST /backtest
 */
app.post('/backtest', async (req: Request, res: Response) => {
  logger.info('Route /backtest');
  try {
    let params: Record<string, unknown> = {};
    try {
      const bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
      params = JSON.parse(bodyText.trim());
    } catch { /* params vazio = defaults */ }

    logger.info('Proxying backtest to Flask', { host: IA_HOST, port: IA_PORT });
    const result = await proxyToIA(params, '/backtest');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /backtest route', { error: msg });
    res.status(502).json({ error: msg, hint: `Verifique se a IA Flask está rodando em http://${IA_HOST}:${IA_PORT}` });
  }
});

/**
 * POST /replay
 */
app.post('/replay', async (req: Request, res: Response) => {
  logger.info('Route /replay');
  try {
    let params: Record<string, unknown> = {};
    try {
      const bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
      params = JSON.parse(bodyText.trim());
    } catch { /* params vazio = defaults */ }

    logger.info('Proxying replay to Flask', { host: IA_HOST, port: IA_PORT });
    const result = await proxyToIA(params, '/replay');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /replay route', { error: msg });
    res.status(502).json({ error: msg, hint: `Verifique se a IA Flask está rodando em http://${IA_HOST}:${IA_PORT}` });
  }
});

/**
 * POST /risk
 */
app.post('/risk', async (req: Request, res: Response) => {
  logger.info('Route /risk');
  try {
    let params: Record<string, unknown> = {};
    try {
      const bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
      params = JSON.parse(bodyText.trim());
    } catch { /* params vazio = defaults */ }

    logger.info('Proxying risk to Flask', { host: IA_HOST, port: IA_PORT });
    const result = await proxyToIA(params, '/risk');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /risk route', { error: msg });
    res.status(502).json({ error: msg, hint: `Verifique se a IA Flask está rodando em http://${IA_HOST}:${IA_PORT}` });
  }
});

/**
 * GET /alerts
 * Retorna alertas do histórico com filtros opcionais (query params).
 */
app.get('/alerts', async (req: Request, res: Response) => {
  logger.info('Route GET /alerts');
  try {
    const qs = new URLSearchParams();
    if (req.query.limit) qs.set('limit', String(req.query.limit));
    if (req.query.level) qs.set('level', String(req.query.level));
    if (req.query.category) qs.set('category', String(req.query.category));
    if (req.query.symbol) qs.set('symbol', String(req.query.symbol));
    if (req.query.unacknowledged) qs.set('unacknowledged', String(req.query.unacknowledged));

    const path = `/alerts${qs.toString() ? '?' + qs.toString() : ''}`;

    const result = await new Promise<object>((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: IA_HOST, port: IA_PORT, path, method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error(`Resposta inválida: ${data.substring(0, 200)}`)); }
        });
      });
      proxyReq.on('error', (err) => reject(new Error(`Falha: ${err.message}`)));
      proxyReq.setTimeout(10000, () => { proxyReq.destroy(); reject(new Error('Timeout')); });
      proxyReq.end();
    });

    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in GET /alerts route', { error: msg });
    res.status(502).json({ error: msg, hint: 'Verifique se a IA Flask está rodando' });
  }
});

/**
 * POST /alerts/acknowledge
 * Marca um alerta como reconhecido.
 */
app.post('/alerts/acknowledge', async (req: Request, res: Response) => {
  logger.info('Route /alerts/acknowledge');
  try {
    let params: Record<string, unknown> = {};
    try {
      const bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
      params = JSON.parse(bodyText.trim());
    } catch { /* */ }

    const result = await proxyToIA(params, '/alerts/acknowledge');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /alerts/acknowledge route', { error: msg });
    res.status(502).json({ error: msg });
  }
});

/**
 * POST /alerts/clear
 * Limpa todo o histórico de alertas.
 */
app.post('/alerts/clear', async (req: Request, res: Response) => {
  logger.info('Route /alerts/clear');
  try {
    const result = await proxyToIA({}, '/alerts/clear');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /alerts/clear route', { error: msg });
    res.status(502).json({ error: msg });
  }
});

/**
 * GET /history
 * Retorna histórico de decisões com filtros opcionais.
 */
app.get('/history', async (req: Request, res: Response) => {
  logger.info('Route GET /history');
  try {
    const qs = new URLSearchParams();
    if (req.query.limit) qs.set('limit', String(req.query.limit));
    if (req.query.symbol) qs.set('symbol', String(req.query.symbol));
    if (req.query.decision) qs.set('decision', String(req.query.decision));
    if (req.query.min_confidence) qs.set('min_confidence', String(req.query.min_confidence));

    const path = `/history${qs.toString() ? '?' + qs.toString() : ''}`;

    const result = await new Promise<object>((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: IA_HOST, port: IA_PORT, path, method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error(`Resposta inválida: ${data.substring(0, 200)}`)); }
        });
      });
      proxyReq.on('error', (err) => reject(new Error(`Falha: ${err.message}`)));
      proxyReq.setTimeout(10000, () => { proxyReq.destroy(); reject(new Error('Timeout')); });
      proxyReq.end();
    });

    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in GET /history route', { error: msg });
    res.status(502).json({ error: msg, hint: 'Verifique se a IA Flask está rodando' });
  }
});

/**
 * POST /history/clear
 * Limpa todo o histórico de decisões.
 */
app.post('/history/clear', async (req: Request, res: Response) => {
  logger.info('Route /history/clear');
  try {
    const result = await proxyToIA({}, '/history/clear');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /history/clear route', { error: msg });
    res.status(502).json({ error: msg });
  }
});

/**
 * POST /paper-trade
 * Gerencia paper trading (abrir/fechar/resetar/status).
 */
app.post('/paper-trade', async (req: Request, res: Response) => {
  logger.info('Route /paper-trade');
  try {
    let params: Record<string, unknown> = {};
    try {
      const bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
      params = JSON.parse(bodyText.trim());
    } catch { /* */ }

    logger.info('Proxying paper-trade to Flask', { host: IA_HOST, port: IA_PORT });
    const result = await proxyToIA(params, '/paper-trade');
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error in /paper-trade route', { error: msg });
    res.status(502).json({ error: msg, hint: 'Verifique se a IA Flask está rodando' });
  }
});

app.listen(PORT, () => {
  logger.info('Backend started', { port: PORT, iaHost: IA_HOST, iaPort: IA_PORT });
  logger.info('Routes available', {
    legacy: 'POST /analyze',
    main: `POST /ia → ${IA_HOST}:${IA_PORT}${IA_PATH}`,
    backtest: `POST /backtest → ${IA_HOST}:${IA_PORT}/backtest`,
    replay: `POST /replay → ${IA_HOST}:${IA_PORT}/replay`,
    risk: `POST /risk → ${IA_HOST}:${IA_PORT}/risk`,
    alerts: `GET /alerts → ${IA_HOST}:${IA_PORT}/alerts`,
    history: `GET /history → ${IA_HOST}:${IA_PORT}/history`,
    paperTrade: `POST /paper-trade → ${IA_HOST}:${IA_PORT}/paper-trade`,
    health: `GET /health`,
  });
});