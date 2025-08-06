import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, balanced_accuracy_score, confusion_matrix
)
import joblib
import numpy as np
import os
import json
import pyarrow.parquet as pq

from app.main import PROCESSED_DATA_PATH, MODEL_PATH, MODEL_COLUMNS_PATH, THRESHOLD_PATH

def train_model_on_range(train_start: str, train_end: str, test_start: str, test_end: str):
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError("Parquet dataset not found. Please upload a dataset first.")

    schema = pq.read_schema(PROCESSED_DATA_PATH)
    id_column_name = schema.names[0]
    exclude_cols = ['Response', 'Response_mapped', 'synthetic_timestamp', id_column_name]
    numeric_types = ['int', 'float', 'double']
    feature_cols = [
        field.name for field in schema
        if field.name not in exclude_cols and any(t in str(field.type).lower() for t in numeric_types)
    ]
    if not feature_cols:
        raise ValueError("No numeric feature columns found for training.")
    
    cols_to_load = feature_cols + ['Response', 'synthetic_timestamp']

    train_filters = [('synthetic_timestamp', '>=', pd.to_datetime(train_start)), ('synthetic_timestamp', '<=', pd.to_datetime(train_end))]
    test_filters = [('synthetic_timestamp', '>=', pd.to_datetime(test_start)), ('synthetic_timestamp', '<=', pd.to_datetime(test_end))]
    
    train_df = pd.read_parquet(PROCESSED_DATA_PATH, columns=cols_to_load, filters=train_filters)
    test_df = pd.read_parquet(PROCESSED_DATA_PATH, columns=cols_to_load, filters=test_filters)

    if train_df.empty or test_df.empty:
        raise ValueError("No training or testing data found for the selected date ranges.")

    train_df['Response_mapped'] = train_df['Response'].map({'pass': 1, 'fail': 0})
    test_df['Response_mapped'] = test_df['Response'].map({'pass': 1, 'fail': 0})
    
    X_train, y_train = train_df[feature_cols].fillna(0), train_df['Response_mapped']
    X_test, y_test = test_df[feature_cols].fillna(0), test_df['Response_mapped']

    neg_count, pos_count = y_train.value_counts().get(0, 0), y_train.value_counts().get(1, 0)
    scale_pos_weight = (neg_count / pos_count) if pos_count > 0 else 1

    model = xgb.XGBClassifier(
        n_estimators=150, learning_rate=0.05, max_depth=5, subsample=0.8,
        colsample_bytree=0.8, scale_pos_weight=scale_pos_weight,
        eval_metric=['logloss', 'error'], # Track both loss and error (1-accuracy)
        random_state=42, use_label_encoder=False
    )
    
    # --- CHANGE 1: Capture Training History ---
    # We provide an evaluation set to track metrics during training.
    eval_set = [(X_train, y_train), (X_test, y_test)]
    model.fit(X_train, y_train, eval_set=eval_set, verbose=False)

    model.save_model(MODEL_PATH)
    joblib.dump(feature_cols, MODEL_COLUMNS_PATH)

    y_proba = model.predict_proba(X_test)[:, 1]
    thresholds = np.linspace(0.05, 0.95, 181) 
    best_f1, best_threshold = 0, 0.5
    for thr in thresholds:
        f1 = f1_score(y_test, (y_proba >= thr).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1, best_threshold = f1, thr

    with open(THRESHOLD_PATH, "w") as f:
        json.dump({"best_threshold": float(best_threshold)}, f)
    
    y_pred = (y_proba >= best_threshold).astype(int)

    metrics_dict = {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1_score": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba)
    }
    
    metrics_percent = {key: value * 100 for key, value in metrics_dict.items()}
    
    # --- CHANGE 2: Add Confusion Matrix and History to Response ---
    cm = confusion_matrix(y_test, y_pred)
    metrics_percent['confusion_matrix'] = cm.tolist() # Convert numpy array to a standard list

    evals_result = model.evals_result()
    train_loss = evals_result['validation_0']['logloss']
    # XGBoost tracks 'error', which is (1 - accuracy). We convert it back to accuracy.
    train_accuracy = [1.0 - x for x in evals_result['validation_0']['error']] 

    history = []
    for i in range(len(train_loss)):
        history.append({
            "epoch": i + 1,
            "train_loss": train_loss[i],
            "train_accuracy": train_accuracy[i]
        })
    
    metrics_percent['training_history'] = history

    return metrics_percent