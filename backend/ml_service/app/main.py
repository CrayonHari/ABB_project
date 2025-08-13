from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
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

class Metrics(CamelCaseModel):
    accuracy: float
    balanced_accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float

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

@app.on_event("startup")
async def startup_event():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    load_prediction_model()

# --- Configuration Endpoints ---
@app.post("/upload-dataset/", response_model=UploadResponse, tags=["1. Configuration"])
async def upload_and_process_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    temp_file_path = os.path.join(DATA_DIR, "uploaded_dataset.csv")
    try:
        # Save the uploaded file to a temporary location first
        with open(temp_file_path, "wb+") as file_object:
            file_object.write(file.file.read())

        print(f"Temporarily saved {file.filename}, now processing in chunks...")

        # Process the large CSV in chunks to avoid memory errors
        chunk_size = 100000  # Process 100,000 rows at a time
        total_records = 0
        pass_count = 0
        column_count = 0
        
        parquet_writer = None

        for i, chunk_df in enumerate(pd.read_csv(temp_file_path, chunksize=chunk_size)):
            if i == 0:
                column_count = len(chunk_df.columns) + 1 # +1 for synthetic timestamp
                if 'Response' not in chunk_df.columns:
                    raise HTTPException(status_code=400, detail="Dataset must have a 'Response' column.")
            
            chunk_df['Response'] = chunk_df['Response'].astype(str).str.strip().str.lower().replace({
                '1': 'pass', '0': 'fail', 'p': 'pass', 'f': 'fail'
            })
            valid_chunk_df = chunk_df[chunk_df['Response'].isin(['pass', 'fail'])].copy()
            if valid_chunk_df.empty:
                continue
            
            start_index = total_records
            end_index = total_records + len(valid_chunk_df)
            start_date = pd.to_datetime('2025-08-01 00:00:00')
            valid_chunk_df['synthetic_timestamp'] = start_date + pd.to_timedelta(range(start_index, end_index), unit='s')
            
            pass_count += (valid_chunk_df['Response'] == 'pass').sum()
            total_records += len(valid_chunk_df)

            table = pa.Table.from_pandas(valid_chunk_df, preserve_index=False)

            if i == 0:
                parquet_writer = pq.ParquetWriter(PROCESSED_DATA_PATH, table.schema)
            
            parquet_writer.write_table(table)
        
        if parquet_writer:
            parquet_writer.close()

        if total_records == 0:
            raise HTTPException(status_code=400, detail="No valid rows with 'pass' or 'fail' found in the entire dataset.")

        final_df_info = pd.read_parquet(PROCESSED_DATA_PATH, columns=['synthetic_timestamp'])
        date_start = final_df_info['synthetic_timestamp'].min().isoformat()
        date_end = final_df_info['synthetic_timestamp'].max().isoformat()
        pass_rate = round((pass_count / total_records) * 100, 2)

        return UploadResponse(
            message=f"Large dataset ({total_records} records) processed and saved as Parquet.",
            total_records=total_records,
            column_count=column_count,
            date_range_start=date_start,
            date_range_end=date_end,
            pass_rate=pass_rate
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/get-record-counts-for-ranges", response_model=RecordCounts, tags=["1. Configuration"])
async def get_record_counts_for_ranges_endpoint(request: AllDateRangesRequest):
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise HTTPException(status_code=404, detail="Parquet dataset not found. Please upload a dataset first.")
    
    try:
        timestamp_col = pd.read_parquet(PROCESSED_DATA_PATH, columns=['synthetic_timestamp'])
        min_available_date = timestamp_col['synthetic_timestamp'].min()
        max_available_date = timestamp_col['synthetic_timestamp'].max()

        def validate_period(period: DateRange, period_name: str):
            start_dt = pd.to_datetime(period.start_date).tz_localize(None)
            end_dt = pd.to_datetime(period.end_date).tz_localize(None)
            if start_dt < min_available_date or end_dt > max_available_date:
                error_msg = (f"Error: The requested {period_name} period is outside the available dataset range "
                             f"({min_available_date.strftime('%Y-%m-%d %H:%M:%S')} to {max_available_date.strftime('%Y-%m-%d %H:%M:%S')}).")
                raise HTTPException(status_code=400, detail=error_msg)

        validate_period(request.training_period, "training")
        validate_period(request.testing_period, "testing")
        validate_period(request.simulation_period, "simulation")

        def count_records_in_range(start_date: str, end_date: str) -> int:
            filters = [('synthetic_timestamp', '>=', pd.to_datetime(start_date)), ('synthetic_timestamp', '<=', pd.to_datetime(end_date))]
            schema = pq.read_schema(PROCESSED_DATA_PATH)
            id_column_name = schema.names[0]
            table = pq.read_table(PROCESSED_DATA_PATH, columns=[id_column_name], filters=filters)
            return table.num_rows

        return RecordCounts(
            training=count_records_in_range(request.training_period.start_date, request.training_period.end_date),
            testing=count_records_in_range(request.testing_period.start_date, request.testing_period.end_date),
            simulation=count_records_in_range(request.simulation_period.start_date, request.simulation_period.end_date)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred: {str(e)}")


# --- Model Loading ---
def load_prediction_model():
    global model_registry
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(MODEL_COLUMNS_PATH):
            model = xgb.XGBClassifier()
            model.load_model(MODEL_PATH)
            columns = joblib.load(MODEL_COLUMNS_PATH)
            
            threshold = 0.5
            if os.path.exists(THRESHOLD_PATH):
                with open(THRESHOLD_PATH, "r") as f:
                    threshold = json.load(f).get("best_threshold", 0.5)

            model_registry.update({
                "latest_model": model,
                "latest_model_columns": columns,
                "latest_threshold": threshold
            })
            print(f"✅ Model loaded with threshold {threshold:.2f}")
        else:
            print("⚠️ Model files not found.")
            model_registry.update({"latest_model": None, "latest_model_columns": None, "latest_threshold": 0.5})
    except Exception as e:
        print(f"❌ Error loading model: {e}")

# --- Training, Prediction, and Insights Endpoints ---
@app.post("/train-model", response_model=TrainResponse, tags=["2. Training"])
async def train_model_endpoint(request: TrainRequest):
    try:
        from .ml.model_trainer import train_model_on_range
        metrics_dict = train_model_on_range(
            train_start=request.train_start,
            train_end=request.train_end,
            test_start=request.test_start,
            test_end=request.test_end
        )
        load_prediction_model()
        model_id = f"model_{uuid.uuid4().hex[:8]}"
        model_registry["latest_model_id"] = model_id

        return TrainResponse(
            status="Model Trained Successfully",
            model_id=model_id,
            metrics=Metrics(**metrics_dict)
        )
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

@app.post("/predict", tags=["3. Prediction"])
async def predict_single_row(data: dict):
    model = model_registry.get("latest_model")
    model_columns = model_registry.get("latest_model_columns")
    threshold = model_registry.get("latest_threshold", 0.5)

    if model is None or model_columns is None:
        raise HTTPException(status_code=503, detail="Model not available.")
    
    try:
        input_df = pd.DataFrame([data]).reindex(columns=model_columns).fillna(0)
        proba = model.predict_proba(input_df)[0][1] # Probability of the 'pass' class
        prediction = int(proba >= threshold)

        return {
            "prediction": "Pass" if prediction == 1 else "Fail",
            "confidence": round(float(max(proba, 1 - proba)) * 100, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/feature-importance", tags=["4. Insights"])
async def get_feature_importance():
    model = model_registry.get("latest_model")
    model_columns = model_registry.get("latest_model_columns")

    if model is None or model_columns is None:
        raise HTTPException(status_code=404, detail="No model trained yet.")
        
    importances = model.feature_importances_
    
    importances_percent = importances * 100

    feature_importance_df = pd.DataFrame({
        'featureName': model_columns,
        'importanceScore': importances_percent
    }).sort_values(by='importanceScore', ascending=False)
    
    return feature_importance_df.head(10).to_dict(orient='records')