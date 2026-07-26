"""
SUSE - Preparação de Dados para Treinamento Supervisionado
Propósito: Transforma candles reais em features + labels (BUY/SELL/HOLD) baseados em performance futura.
Inclui as funções de indicadores para ser autocontido.
"""

import pandas as pd
import numpy as np

# ================== FUNÇÕES DE INDICADORES (copiadas do ia_engine.py) ==================
def calculate_rsi(candles, period=14):
    closes = np.array([c['close'] for c in candles]) if isinstance(candles[0], dict) else candles['close'].values
    delta = np.diff(closes)
    gain = np.mean(np.maximum(delta[-period:], 0))
    loss = np.mean(np.abs(np.minimum(delta[-period:], 0)))
    if loss == 0:
        return 100.0
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_ema(candles, period):
    if len(candles) < period:
        return np.nan
    closes = np.array([c['close'] for c in candles]) if isinstance(candles[0], dict) else candles['close'].values
    alpha = 2 / (period + 1)
    ema = closes[0]
    for price in closes[1:]:
        ema = alpha * price + (1 - alpha) * ema
    return ema

def calculate_atr(candles, period=14):
    if len(candles) < period + 1:
        return np.nan
    high = np.array([c['high'] for c in candles]) if isinstance(candles[0], dict) else candles['high'].values
    low = np.array([c['low'] for c in candles]) if isinstance(candles[0], dict) else candles['low'].values
    close = np.array([c['close'] for c in candles]) if isinstance(candles[0], dict) else candles['close'].values
    tr = np.maximum(high[1:] - low[1:], np.abs(high[1:] - close[:-1]), np.abs(low[1:] - close[:-1]))
    atr = np.mean(tr[-period:])
    return atr

# ================== FUNÇÃO PRINCIPAL ==================
def create_features_and_labels(df: pd.DataFrame, future_bars: int = 20, min_profit_pips: float = 15.0):
    df = df.copy()
    
    # Calcular features
    df['rsi'] = [calculate_rsi(df.iloc[i:i+100].to_dict('records')) for i in range(len(df))]
    df['ema20'] = [calculate_ema(df.iloc[i:i+200].to_dict('records'), 20) for i in range(len(df))]
    df['ema50'] = [calculate_ema(df.iloc[i:i+200].to_dict('records'), 50) for i in range(len(df))]
    df['ema200'] = [calculate_ema(df.iloc[i:i+300].to_dict('records'), 200) for i in range(len(df))]
    df['atr'] = [calculate_atr(df.iloc[i:i+100].to_dict('records')) for i in range(len(df))]
    df['volume_rel'] = df['volume'] / df['volume'].rolling(50).mean()
    df['dist_ema20'] = (df['close'] - df['ema20']) / df['atr']
    
    # Label supervisionado baseado em performance futura real
    future_return = (df['close'].shift(-future_bars) - df['close']) / df['close'] * 10000  # pips
    
    conditions = [
        (future_return > min_profit_pips),
        (future_return < -min_profit_pips)
    ]
    choices = ['BUY', 'SELL']
    df['label'] = np.select(conditions, choices, default='HOLD')
    
    df = df.dropna().reset_index(drop=True)
    
    print(f"✅ Dataset preparado com {len(df):,} amostras")
    print(f"Distribuição de labels:\n{df['label'].value_counts()}")
    
    return df

# ================== EXECUÇÃO ==================
if __name__ == "__main__":
    df = pd.read_csv("data/real_eurusd_m5.csv")
    df_prepared = create_features_and_labels(df)
    df_prepared.to_csv("data/training_data_labeled.csv", index=False)
    print("✅ Dados preparados e salvos em 'data/training_data_labeled.csv'")