"""
SUSE - Coleta de Dados Reais do MetaTrader 5
Propósito: Baixar histórico real de candles (M5) diretamente do MetaTrader e salvar em CSV.
Versão FINAL - Sem nenhum aviso do Pylint no VS Code.
"""

# pylint: disable=import-error, no-member, unsubscriptable-object
# (Desativa todos os avisos problemáticos do MetaTrader5 e pandas)

import pandas as pd
from datetime import datetime, timedelta
import MetaTrader5 as mt5

# ================== CONFIGURAÇÃO ==================
SYMBOL = "EURUSD"
TIMEFRAME = mt5.TIMEFRAME_M5
BARS_TO_FETCH = 30000
FILENAME = "data/real_eurusd_m5.csv"

# ================== CONEXÃO COM METATRADER 5 ==================
if not mt5.initialize():
    print("❌ Falha ao conectar ao MetaTrader 5. Certifique-se de que o MT5 está aberto e logado.")
    mt5.shutdown()
    exit()

print(f"✅ Conectado ao MetaTrader 5 | {SYMBOL} | M5")

to_date = datetime.now()
from_date = to_date - timedelta(days=180)

print(f"Baixando {BARS_TO_FETCH} candles de {from_date.date()} até {to_date.date()}...")

rates = mt5.copy_rates_range(SYMBOL, TIMEFRAME, from_date, to_date)

if rates is None or len(rates) == 0:
    print("❌ Nenhum dado retornado.")
    mt5.shutdown()
    exit()

# Converter para DataFrame
df = pd.DataFrame(rates)
df['time'] = pd.to_datetime(df['time'], unit='s')
df = df.rename(columns={
    'time': 'timestamp',
    'open': 'open',
    'high': 'high',
    'low': 'low',
    'close': 'close',
    'tick_volume': 'volume'
})
df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]

# Salvar
df.to_csv(FILENAME, index=False)

print(f"✅ Sucesso! {len(df):,} candles reais salvos em '{FILENAME}'")
print(f"Período: {df['timestamp'].min()} → {df['timestamp'].max()}")

# Linha que estava gerando o erro (agora com disable explícito)
print(f"Último candle: {df.iloc[-1].to_dict()}")

mt5.shutdown()