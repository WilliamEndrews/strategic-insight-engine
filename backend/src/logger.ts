/**
 * SUSE - Structured Logger (Node.js)
 * Fase 5: Logs estruturados em formato JSON para produção.
 *
 * Em produção: output JSON para stdout (compatível com Docker/PM2).
 * Em desenvolvimento: output colorido para console.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  module?: string;
  [key: string]: unknown;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (IS_PRODUCTION ? 'info' : 'debug');

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

function formatConsole(entry: LogEntry): string {
  const ts = entry.timestamp.split('T')[1]?.split('.')[0] || '';
  const color = COLORS[entry.level];
  const extra: Record<string, unknown> = { ...entry };
  delete extra.timestamp;
  delete extra.level;
  delete extra.service;
  delete extra.message;
  delete extra.module;

  const extraStr = Object.keys(extra).length > 0 ? ' ' + JSON.stringify(extra) : '';
  const moduleStr = entry.module ? ` [${entry.module}]` : '';

  return `${color}[${ts}]{RESET} ${entry.level.toUpperCase().padEnd(5)} ${entry.service}${moduleStr} ${entry.message}${extraStr}`.replace(/\{RESET\}/g, RESET);
}

function log(level: LogLevel, service: string, message: string, extra?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...extra,
  };

  if (IS_PRODUCTION) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(formatConsole(entry));
  }
}

export function createLogger(service: string, module?: string) {
  return {
    debug: (msg: string, extra?: Record<string, unknown>) => log('debug', service, msg, { module, ...extra }),
    info: (msg: string, extra?: Record<string, unknown>) => log('info', service, msg, { module, ...extra }),
    warn: (msg: string, extra?: Record<string, unknown>) => log('warn', service, msg, { module, ...extra }),
    error: (msg: string, extra?: Record<string, unknown>) => log('error', service, msg, { module, ...extra }),
  };
}

export const logger = createLogger('suse-backend');
