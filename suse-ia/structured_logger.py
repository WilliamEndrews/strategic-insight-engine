"""
SUSE - Logging Estruturado (structured_logger.py)

Fase 5: Logs estruturados em formato JSON para produção.

Uso:
    from structured_logger import get_logger
    log = get_logger('ia_engine')
    log.info('Predição concluída', extra={'decision': 'BUY', 'confidence': 75.3})
    log.error('Erro na predição', extra={'error': str(e), 'traceback': True})
"""

import logging
import json
import sys
import os
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Formatter que produz logs JSON estruturados."""

    def format(self, record):
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Adicionar campos extras
        if hasattr(record, 'extra_data'):
            log_entry.update(record.extra_data)

        # Adicionar exception info se existir
        if record.exc_info and record.exc_info[1]:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
            }

        return json.dumps(log_entry, ensure_ascii=False, default=str)


class ConsoleFormatter(logging.Formatter):
    """Formatter colorido para desenvolvimento (console)."""

    COLORS = {
        'DEBUG': '\033[36m',     # cyan
        'INFO': '\033[32m',      # green
        'WARNING': '\033[33m',   # yellow
        'ERROR': '\033[31m',     # red
        'CRITICAL': '\033[35m',  # magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        color = self.COLORS.get(record.levelname, '')
        ts = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        msg = record.getMessage()

        extra_str = ''
        if hasattr(record, 'extra_data'):
            extra_str = ' ' + json.dumps(record.extra_data, ensure_ascii=False, default=str)

        return f"{color}[{ts}]{self.RESET} {record.levelname:<8} {record.name:<15} {msg}{extra_str}"


class SUSELogger(logging.Logger):
    """Logger customizado com método extra()."""

    def _log_with_extra(self, level, msg, extra_data=None, **kwargs):
        if extra_data:
            kwargs['extra'] = {'extra_data': extra_data}
        else:
            kwargs['extra'] = {'extra_data': {}}
        self.log(level, msg, **kwargs)

    def info(self, msg, extra=None, **kwargs):
        self._log_with_extra(logging.INFO, msg, extra, **kwargs)

    def warning(self, msg, extra=None, **kwargs):
        self._log_with_extra(logging.WARNING, msg, extra, **kwargs)

    def error(self, msg, extra=None, **kwargs):
        self._log_with_extra(logging.ERROR, msg, extra, **kwargs)

    def debug(self, msg, extra=None, **kwargs):
        self._log_with_extra(logging.DEBUG, msg, extra, **kwargs)

    def critical(self, msg, extra=None, **kwargs):
        self._log_with_extra(logging.CRITICAL, msg, extra, **kwargs)


# Configurar logging class
logging.setLoggerClass(SUSELogger)

# Detectar ambiente
IS_PRODUCTION = os.environ.get('FLASK_ENV') == 'production' or os.environ.get('NODE_ENV') == 'production'
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'DEBUG' if not IS_PRODUCTION else 'INFO')

# Cache de loggers
_loggers = {}


def get_logger(name='suse'):
    """
    Retorna um logger configurado.

    Em produção: output JSON para stdout (compatível com Docker/PM2).
    Em desenvolvimento: output colorido para console.
    """
    if name in _loggers:
        return _loggers[name]

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL))
    logger.propagate = False

    # Remover handlers existentes
    logger.handlers.clear()

    # Handler para stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, LOG_LEVEL))

    if IS_PRODUCTION:
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(ConsoleFormatter())

    logger.addHandler(handler)

    # Handler para arquivo (se diretório logs/ existir)
    log_dir = os.environ.get('LOG_DIR', 'logs')
    if os.path.isdir(log_dir) or os.path.exists(log_dir):
        try:
            os.makedirs(log_dir, exist_ok=True)
            file_handler = logging.FileHandler(
                os.path.join(log_dir, f'{name}.log'),
                encoding='utf-8'
            )
            file_handler.setLevel(getattr(logging, LOG_LEVEL))
            file_handler.setFormatter(JSONFormatter())
            logger.addHandler(file_handler)
        except Exception:
            pass  # Não falhar se não conseguir escrever arquivo

    _loggers[name] = logger
    return logger
