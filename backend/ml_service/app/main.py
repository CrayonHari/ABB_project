
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import xgboost as xgb
import joblib
import os
import uuid
from datetime import datetime
import pyarrow.parquet as pq
import pyarrow as pa
import json

# --- Pydantic Schemas ---
def to_camel(string: str) -> str:
    words = string.split('_')
    return words[0] + ''.join(word.capitalize() for word in words[1:]) if len(words) > 1 else words[0]

class CamelCaseModel(BaseModel):
    class Config:
        alias_generator = to_camel
        populate_by_name = True

class DateRange(CamelCaseModel):
    start_date: str
    end_date: str

class AllDateRangesRequest(CamelCaseModel):
    training_period: DateRange
    testing_period: DateRange
    simulation_period: DateRange

class RecordCounts(CamelCaseModel):
    training: int
    testing: int
    simulation: int

class UploadResponse(CamelCaseModel):
    message: str
    total_records: int
    column_count: int
    date_range_start: str
    date_range_end: str
    pass_rate: float

class TrainRequest(CamelCaseModel):
    train_start: str
    train_end: str
    test_start: str
    test_end: str

class TrainingHistoryEntry(CamelCaseModel):
    epoch: int
    train_loss: float
    train_accuracy: float

class Metrics(CamelCaseModel):
    accuracy: float
    balanced_accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]] # <-- ADD THIS
    training_history: List[TrainingHistoryEntry] # <-- ADD THIS

class TrainResponse(CamelCaseModel):
    status: str
    model_id: Optional[str] = None
    metrics: Metrics

# --- Paths ---
DATA_DIR = "data"
MODEL_DIR = "model"
PROCESSED_DATA_PATH = os.path.join(DATA_DIR, "processed_dataset.parquet")
MODEL_PATH = os.path.join(MODEL_DIR, "model.xgb")
MODEL_COLUMNS_PATH = os.path.join(MODEL_DIR, "model_columns.pkl")
THRESHOLD_PATH = os.path.join(MODEL_DIR, "best_threshold.json")

model_registry = {
    "latest_model": None,
    "latest_model_id": None,
    "latest_model_columns": None,
    "latest_threshold": 0.5
}

# --- FastAPI App ---
app = FastAPI(
    title="IntelliInspect ML Service",
    version="6.0.0",
    description="High-performance ML service capable of processing large datasets via chunking."
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    load_prediction_model()

# --- Configuration Endpoints ---
@app.post("/upload-dataset/", response_model=UploadResponse, tags=["1. Configuration"])
async def upload_and_process_dataset(file: UploadFile = File(...)):
    # ... (code for this function is unchanged)
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    temp_file_path = os.path.join(DATA_DIR, "uploaded_dataset.csv")
    try:
        with open(temp_file_path, "wb+") as file_object:
            file_object.write(file.file.read())
        chunk_size = 100000
        total_records, pass_count, column_count = 0, 0, 0
        parquet_writer = None
        for i, chunk_df in enumerate(pd.read_csv(temp_file_path, chunksize=chunk_size)):
            if i == 0:
                column_count = len(chunk_df.columns) + 1
                if 'Response' not in chunk_df.columns:
                    raise HTTPException(status_code=400, detail="Dataset must have a 'Response' column.")
            chunk_df['Response'] = chunk_df['Response'].astype(str).str.strip().str.lower().replace({'1': 'pass', '0': 'fail', 'p': 'pass', 'f': 'fail'})
            valid_chunk_df = chunk_df[chunk_df['Response'].isin(['pass', 'fail'])].copy()
            if valid_chunk_df.empty: continue
            start_index, end_index = total_records, total_records + len(valid_chunk_df)
            valid_chunk_df['synthetic_timestamp'] = pd.to_datetime('2025-08-01 00:00:00') + pd.to_timedelta(range(start_index, end_index), unit='s')
            pass_count += (valid_chunk_df['Response'] == 'pass').sum()
            total_records += len(valid_chunk_df)
            table = pa.Table.from_pandas(valid_chunk_df, preserve_index=False)
            if i == 0:
                parquet_writer = pq.ParquetWriter(PROCESSED_DATA_PATH, table.schema)
            parquet_writer.write_table(table)
        if parquet_writer: parquet_writer.close()
        if total_records == 0: raise HTTPException(status_code=400, detail="No valid rows with 'pass' or 'fail' found.")
        final_df_info = pd.read_parquet(PROCESSED_DATA_PATH, columns=['synthetic_timestamp'])
        return UploadResponse(message=f"Large dataset ({total_records} records) processed.", total_records=total_records, column_count=column_count, date_range_start=final_df_info['synthetic_timestamp'].min().isoformat(), date_range_end=final_df_info['synthetic_timestamp'].max().isoformat(), pass_rate=round((pass_count / total_records) * 100, 2))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        if os.path.exists(temp_file_path): os.remove(temp_file_path)


@app.post("/get-record-counts-for-ranges", response_model=RecordCounts, tags=["1. Configuration"])
async def get_record_counts_for_ranges_endpoint(request: AllDateRangesRequest):
    # ... (code for this function is unchanged)
    if not os.path.exists(PROCESSED_DATA_PATH): raise HTTPException(status_code=404, detail="Parquet dataset not found.")
    try:
        timestamp_col = pd.read_parquet(PROCESSED_DATA_PATH, columns=['synthetic_timestamp'])
        min_available_date, max_available_date = timestamp_col['synthetic_timestamp'].min(), timestamp_col['synthetic_timestamp'].max()
        def validate_period(period: DateRange, period_name: str):
            start_dt, end_dt = pd.to_datetime(period.start_date).tz_localize(None), pd.to_datetime(period.end_date).tz_localize(None)
            if start_dt < min_available_date or end_dt > max_available_date:
                raise HTTPException(status_code=400, detail=f"Error: The requested {period_name} period is outside the available dataset range.")
        validate_period(request.training_period, "training"); validate_period(request.testing_period, "testing"); validate_period(request.simulation_period, "simulation")
        def count_records_in_range(start_date: str, end_date: str) -> int:
            filters = [('synthetic_timestamp', '>=', pd.to_datetime(start_date)), ('synthetic_timestamp', '<=', pd.to_datetime(end_date))]
            table = pq.read_table(PROCESSED_DATA_PATH, columns=[pq.read_schema(PROCESSED_DATA_PATH).names[0]], filters=filters)
            return table.num_rows
        return RecordCounts(training=count_records_in_range(request.training_period.start_date, request.training_period.end_date), testing=count_records_in_range(request.testing_period.start_date, request.testing_period.end_date), simulation=count_records_in_range(request.simulation_period.start_date, request.simulation_period.end_date))
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred: {str(e)}")


# --- Model Loading ---
def load_prediction_model():
    # ... (code for this function is unchanged)
    global model_registry
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(MODEL_COLUMNS_PATH):
            model = xgb.XGBClassifier(); model.load_model(MODEL_PATH)
            columns = joblib.load(MODEL_COLUMNS_PATH)
            threshold = 0.5
            if os.path.exists(THRESHOLD_PATH):
                with open(THRESHOLD_PATH, "r") as f: threshold = json.load(f).get("best_threshold", 0.5)
            model_registry.update({"latest_model": model, "latest_model_columns": columns, "latest_threshold": threshold})
            print(f"✅ Model loaded with threshold {threshold:.2f}")
        else:
            print("⚠️ Model files not found."); model_registry.update({"latest_model": None, "latest_model_columns": None, "latest_threshold": 0.5})
    except Exception as e: print(f"❌ Error loading model: {e}")


# --- Training, Prediction, and Insights Endpoints ---
@app.post("/train-model", response_model=TrainResponse, tags=["2. Training"])
async def train_model_endpoint(request: TrainRequest):
    # ... (code for this function is unchanged)
    try:
        from .ml.model_trainer import train_model_on_range
        metrics_dict = train_model_on_range(train_start=request.train_start, train_end=request.train_end, test_start=request.test_start, test_end=request.test_end)
        load_prediction_model()
        model_id = f"model_{uuid.uuid4().hex[:8]}"; model_registry["latest_model_id"] = model_id
        return TrainResponse(status="Model Trained Successfully", model_id=model_id, metrics=Metrics(**metrics_dict))
    except (ValueError, FileNotFoundError) as e: raise HTTPException(status_code=400, detail=str(e))
    except Exception as e: raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


# ===================================================================
# THIS IS THE MISSING ENDPOINT THAT NEEDS TO BE ADDED
# ===================================================================
@app.post("/get-data-for-range", tags=["3. Prediction"])
async def get_data_for_range_endpoint(request: DateRange) -> List[dict]:
    """
    Retrieves raw data rows for a given date range for the simulation.
    """
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise HTTPException(status_code=404, detail="Parquet dataset not found. Please upload a dataset first.")
    try:
        filters = [('synthetic_timestamp', '>=', pd.to_datetime(request.start_date)), ('synthetic_timestamp', '<=', pd.to_datetime(request.end_date))]
        table = pq.read_table(PROCESSED_DATA_PATH, filters=filters)
        data_list = table.to_pylist()
        print(f"Found {len(data_list)} records for the simulation period from {request.start_date} to {request.end_date}.")
        return data_list
    except Exception as e:
        print(f"Error getting data for range: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
# ===================================================================


@app.post("/predict", tags=["3. Prediction"])
async def predict_single_row(data: dict):
    # ... (code for this function is unchanged)
    model, model_columns, threshold = model_registry.get("latest_model"), model_registry.get("latest_model_columns"), model_registry.get("latest_threshold", 0.5)
    if model is None or model_columns is None: raise HTTPException(status_code=503, detail="Model not available.")
    try:
        input_df = pd.DataFrame([data]).reindex(columns=model_columns).fillna(0)
        proba = model.predict_proba(input_df)[0][1]
        prediction = int(proba >= threshold)
        return {"prediction": "Pass" if prediction == 1 else "Fail", "confidence": round(float(max(proba, 1 - proba)) * 100, 2)}
    except Exception as e: raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/feature-importance", tags=["4. Insights"])
async def get_feature_importance():
    # ... (code for this function is unchanged)
    model, model_columns = model_registry.get("latest_model"), model_registry.get("latest_model_columns")
    if model is None or model_columns is None: raise HTTPException(status_code=404, detail="No model trained yet.")
    importances_percent = model.feature_importances_ * 100
    feature_importance_df = pd.DataFrame({'featureName': model_columns, 'importanceScore': importances_percent}).sort_values(by='importanceScore', ascending=False)
    return feature_importance_df.head(10).to_dict(orient='records')