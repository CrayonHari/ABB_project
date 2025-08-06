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

# Import paths from the main app's namespace
from app.main import PROCESSED_DATA_PATH, MODEL_PATH, MODEL_COLUMNS_PATH, THRESHOLD_PATH

def train_model_on_range(train_start: str, train_end: str, test_start: str, test_end: str):
    """
    Trains an XGBoost model, finds the best threshold, and returns metrics on a 0-100 scale.
    """
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError("Parquet dataset not found. Please upload a dataset first.")

    # --- Inspect Schema and Define Columns ---
    schema = pq.read_schema(PROCESSED_DATA_PATH)
    id_column_name = schema.names[0]
    print(f"Dynamically identified ID column: '{id_column_name}'")
    
    exclude_cols = ['Response', 'Response_mapped', 'synthetic_timestamp', id_column_name]
    numeric_types = ['int', 'float', 'double']
    feature_cols = [
        field.name for field in schema
        if field.name not in exclude_cols and any(t in str(field.type).lower() for t in numeric_types)
    ]
    if not feature_cols:
        raise ValueError("No numeric feature columns found for training.")
    print(f"Identified {len(feature_cols)} features for training.")
    
    cols_to_load = feature_cols + ['Response', 'synthetic_timestamp']

    # --- Load Data Efficiently ---
    train_filters = [('synthetic_timestamp', '>=', pd.to_datetime(train_start)), ('synthetic_timestamp', '<=', pd.to_datetime(train_end))]
    test_filters = [('synthetic_timestamp', '>=', pd.to_datetime(test_start)), ('synthetic_timestamp', '<=', pd.to_datetime(test_end))]
    
    train_df = pd.read_parquet(PROCESSED_DATA_PATH, columns=cols_to_load, filters=train_filters, engine='pyarrow')
    test_df = pd.read_parquet(PROCESSED_DATA_PATH, columns=cols_to_load, filters=test_filters, engine='pyarrow')

    if train_df.empty or test_df.empty:
        raise ValueError("No training or testing data found for the selected date ranges.")

    # --- Prepare Data for Training ---
    train_df['Response_mapped'] = train_df['Response'].map({'pass': 1, 'fail': 0})
    test_df['Response_mapped'] = test_df['Response'].map({'pass': 1, 'fail': 0})
    
    X_train, y_train = train_df[feature_cols].fillna(0), train_df['Response_mapped']
    X_test, y_test = test_df[feature_cols].fillna(0), test_df['Response_mapped']

    # --- Handle Class Imbalance ---
    neg_count, pos_count = y_train.value_counts().get(0, 0), y_train.value_counts().get(1, 0)
    scale_pos_weight = (neg_count / pos_count) if pos_count > 0 else 1
    print(f"Training data: {neg_count} fail / {pos_count} pass → scale_pos_weight={scale_pos_weight:.2f}")

    # --- Train Model ---
    model = xgb.XGBClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric='logloss',
        random_state=42,
        use_label_encoder=False
    )
    model.fit(X_train, y_train)

    # --- Save Model and Columns ---
    model.save_model(MODEL_PATH)
    joblib.dump(feature_cols, MODEL_COLUMNS_PATH)
    print(f"✅ Model and columns saved.")

    # --- Find and Save Best Threshold ---
    y_proba = model.predict_proba(X_test)[:, 1]
    thresholds = np.linspace(0.05, 0.95, 181) 
    best_f1, best_threshold = 0, 0.5
    for thr in thresholds:
        f1 = f1_score(y_test, (y_proba >= thr).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1, best_threshold = f1, thr

    print(f"🔹 Best threshold for F1-score found: {best_threshold:.2f} (F1={best_f1:.4f})")
    with open(THRESHOLD_PATH, "w") as f:
        json.dump({"best_threshold": float(best_threshold)}, f)
    print(f"✅ Best threshold saved to {THRESHOLD_PATH}")

    y_pred = (y_proba >= best_threshold).astype(int)

    # --- Calculate and Return Metrics ---
    metrics_dict = {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1_score": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba)
    }
    
    # ==========================================================
    # THE CHANGE: Convert all metric values to a 0-100 scale.
    # ==========================================================
    metrics_percent = {key: value * 100 for key, value in metrics_dict.items()}
    
    print("--- Final Evaluation Metrics (using best threshold) ---")
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    for k, v in metrics_percent.items():
        print(f"{k}: {v:.2f}%") # Print with % sign for clarity in logs

    return metrics_percent