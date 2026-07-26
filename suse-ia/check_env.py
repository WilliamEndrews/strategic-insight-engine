import json
import sys

try:
    import shap
    print('SHAP version:', shap.__version__)
except ImportError:
    print('SHAP nao instalado')

try:
    import sklearn
    print('sklearn version:', sklearn.__version__)
except ImportError:
    print('sklearn nao instalado')

try:
    with open('dataset/real_candles.jsonl', 'r', encoding='utf-8') as f:
        lines = [json.loads(l) for l in f]
    print('Total de entradas:', len(lines))
    if lines:
        print('Candles na primeira:', len(lines[0].get('candles', [])))
        print('Candles na ultima:', len(lines[-1].get('candles', [])))
        print('Chaves:', list(lines[0].keys()))
except Exception as e:
    print('Erro ao ler dataset:', e)
