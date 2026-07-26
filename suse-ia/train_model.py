"""
SUSE - Script de Treinamento do Modelo Random Forest (v2.0)

Objetivos:
1. Usar módulo compartilhado features.py para eliminar mismatch treino vs predição
2. Labeler por score de regras + thresholds dinâmicos baseados em percentis
3. Balanceamento controlado das classes BUY/SELL/HOLD
4. Persistir modelo, thresholds e metadados
5. Relatório de classificação e importância das features
"""

import json
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from collections import Counter

from features import (
    extract_features,
    assign_score_label,
    compute_dynamic_thresholds,
    FEATURE_ORDER,
)


DATASET_PATH = "dataset/real_candles.jsonl"
MODEL_PATH = "model_rf_real.pkl"
METADATA_PATH = "model_metadata.pkl"

# Hiperparâmetros do modelo
RF_PARAMS = {
    "n_estimators": 800,
    "max_depth": 20,
    "min_samples_split": 5,
    "min_samples_leaf": 2,
    "random_state": 42,
    "n_jobs": -1,
    "class_weight": "balanced_subsample",
}


def load_candles_from_jsonl(path):
    """Carrega pacotes de candles do dataset JSONL."""
    entries = []
    if not os.path.exists(path):
        print(f"❌ Dataset não encontrado: {path}")
        return entries

    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                candles = entry.get("candles")
                if candles and len(candles) >= 21:
                    entries.append(candles)
            except json.JSONDecodeError as e:
                print(f"⚠️ Erro ao parsear linha {i + 1}: {e}")

    print(f"✅ {len(entries)} pacotes de candles carregados de {path}")
    return entries


def build_training_data(candles_list, buy_percentile=70, sell_percentile=30, target_non_hold=0.30):
    """
    Constrói dataset de treino a partir de pacotes de candles.
    Usa augmentação por janela deslizante para gerar mais amostras.
    
    Args:
        candles_list: lista de listas de candles
        buy_percentile, sell_percentile: percentis para thresholds dinâmicos iniciais
        target_non_hold: proporção alvo de sinais não-HOLD (BUY+SELL)
    
    Returns:
        tuple: (X, y, scores, thresholds)
    """
    records = []
    scores = []

    # Augmentação: para cada pacote, extrair múltiplas janelas deslizantes
    # Isso aumenta significativamente o número de amostras
    window_sizes = [120, 80, 60, 40, 30]
    min_window = 30  # mínimo de candles para extrair features válidas

    for candles in candles_list:
        n = len(candles)
        for wsize in window_sizes:
            if n < wsize:
                continue
            # Janela deslizante com step de 10 candles
            step = max(5, wsize // 8)
            for start in range(0, n - wsize + 1, step):
                window = candles[start:start + wsize]
                feats = extract_features(window)
                if feats is None:
                    continue

                _, score = assign_score_label(window, score_threshold_buy=999, score_threshold_sell=-999)
                scores.append(score)
                records.append({
                    'features': feats,
                    'score': score,
                    'candles': window,
                })

    # Se augmentação não gerou amostras suficientes, usa pacotes inteiros
    if len(records) < 10:
        print("⚠️ Augmentação gerou poucas amostras. Usando pacotes inteiros.")
        records = []
        scores = []
        for candles in candles_list:
            feats = extract_features(candles)
            if feats is None:
                continue
            _, score = assign_score_label(candles, score_threshold_buy=999, score_threshold_sell=-999)
            scores.append(score)
            records.append({'features': feats, 'score': score, 'candles': candles})

    if len(records) < 5:
        print(f"❌ Apenas {len(records)} amostras válidas. Mínimo necessário: 5.")
        return None, None, None, (0.25, -0.25)

    scores_arr = np.array(scores)
    print(f"✅ {len(records)} amostras geradas (após augmentação por janela deslizante)")

    # Verificar se scores têm variabilidade suficiente
    score_std = float(np.std(scores_arr))
    if score_std < 0.01:
        print(f"⚠️ Scores homogêneos (std={score_std:.4f}). Aplicando split por ranking.")
        # Split por ranking: top 1/3 = BUY, bottom 1/3 = SELL, meio = HOLD
        sorted_indices = np.argsort(scores_arr)
        n_total = len(sorted_indices)
        n_third = max(1, n_total // 3)
        buy_indices = set(sorted_indices[-n_third:])
        sell_indices = set(sorted_indices[:n_third])
        chosen_labels = []
        for i in range(n_total):
            if i in buy_indices:
                chosen_labels.append('BUY')
            elif i in sell_indices:
                chosen_labels.append('SELL')
            else:
                chosen_labels.append('HOLD')
        buy_threshold = float(np.percentile(scores_arr, 67))
        sell_threshold = float(np.percentile(scores_arr, 33))
    else:
        # Ajuste iterativo dos percentis para atingir target_non_hold
        best_thresholds = None
        best_diff = float('inf')
        chosen_labels = None

        for bp in range(55, 96, 5):
            for sp in range(5, 46, 5):
                buy_thr, sell_thr = compute_dynamic_thresholds(scores_arr, buy_percentile=bp, sell_percentile=sp)
                labels = []
                for rec in records:
                    if rec['score'] >= buy_thr:
                        labels.append('BUY')
                    elif rec['score'] <= sell_thr:
                        labels.append('SELL')
                    else:
                        labels.append('HOLD')
                non_hold_ratio = (np.array(labels) != 'HOLD').mean()
                diff = abs(non_hold_ratio - target_non_hold)
                if diff < best_diff:
                    best_diff = diff
                    best_thresholds = (buy_thr, sell_thr)
                    chosen_labels = labels

        buy_threshold, sell_threshold = best_thresholds

        # Fallback: se só uma classe não-HOLD, forçar split por ranking
        label_counts = Counter(chosen_labels)
        if label_counts.get('BUY', 0) == 0 or label_counts.get('SELL', 0) == 0:
            print("⚠️ Apenas uma classe não-HOLD detectada. Forçando split por ranking 33/67.")
            sorted_indices = np.argsort(scores_arr)
            n_total = len(sorted_indices)
            n_third = max(1, n_total // 3)
            buy_indices = set(sorted_indices[-n_third:])
            sell_indices = set(sorted_indices[:n_third])
            chosen_labels = []
            for i in range(n_total):
                if i in buy_indices:
                    chosen_labels.append('BUY')
                elif i in sell_indices:
                    chosen_labels.append('SELL')
                else:
                    chosen_labels.append('HOLD')
            buy_threshold = float(np.percentile(scores_arr, 67))
            sell_threshold = float(np.percentile(scores_arr, 33))

    X = pd.concat([rec['features'] for rec in records], ignore_index=True)
    y = pd.Series(chosen_labels, name='label')

    print(f"\n📊 Labeler Score - thresholds finais:")
    print(f"   BUY  >= {buy_threshold:.4f}")
    print(f"   SELL <= {sell_threshold:.4f}")
    print(f"\n📈 Distribuição de labels:")
    print(y.value_counts())

    return X, y, scores_arr, (buy_threshold, sell_threshold)


def train_and_save():
    print("🚀 Iniciando treinamento SUSE v2.0")
    print("=" * 80)

    candles_list = load_candles_from_jsonl(DATASET_PATH)
    if not candles_list:
        return

    X, y, scores, thresholds = build_training_data(candles_list)
    if X is None:
        return

    if len(X) < 30:
        print(f"⚠️ Dataset pequeno ({len(X)} amostras). Modelo pode ter baixa generalização.")

    # Divisão treino/teste estratificada
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n🔧 Treinando Random Forest com {len(X_train)} amostras...")
    print(f"   Features: {', '.join(FEATURE_ORDER)}")

    model = RandomForestClassifier(**RF_PARAMS)
    model.fit(X_train, y_train)

    # Avaliação
    y_pred = model.predict(X_test)
    print("\n📈 RESULTADO NO CONJUNTO DE TESTE:")
    print(classification_report(y_test, y_pred, digits=4, zero_division=0))
    print("\n🧮 Matriz de confusão:")
    print(confusion_matrix(y_test, y_pred, labels=['BUY', 'HOLD', 'SELL']))

    # Importância das features
    importances = pd.DataFrame({
        'feature': FEATURE_ORDER,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)
    print("\n🔍 Importância das features:")
    print(importances.to_string(index=False))

    # Persistência
    model_payload = {
        'model': model,
        'feature_order': FEATURE_ORDER,
        'label_thresholds': {
            'buy': float(thresholds[0]),
            'sell': float(thresholds[1]),
        },
        'version': '2.0',
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_payload, f)

    # Metadados adicionais
    metadata = {
        'num_samples': len(X),
        'num_features': len(FEATURE_ORDER),
        'features': FEATURE_ORDER,
        'label_distribution': dict(Counter(y)),
        'thresholds': model_payload['label_thresholds'],
        'rf_params': RF_PARAMS,
        'score_statistics': {
            'min': float(np.min(scores)),
            'max': float(np.max(scores)),
            'mean': float(np.mean(scores)),
            'std': float(np.std(scores)),
        },
    }

    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)

    print(f"\n✅ TREINAMENTO CONCLUÍDO")
    print(f"   Modelo salvo em: {MODEL_PATH}")
    print(f"   Metadados: {METADATA_PATH}")
    print(f"   Total de amostras: {len(X)}")
    print("\n💡 Reinicie o Flask para usar o novo modelo.")


if __name__ == "__main__":
    train_and_save()
