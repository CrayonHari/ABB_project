import pandas as pd
import os

DATA_DIR = "data"
PROCESSED_DATA_PATH = os.path.join(DATA_DIR, "processed_dataset.csv")

def augment_data_with_timestamps(df: pd.DataFrame) -> pd.DataFrame:
    if 'synthetic_timestamp' not in df.columns:
        print("Augmenting data with synthetic timestamps...")
        start_time = pd.to_datetime('2023-01-01 00:00:00')
        df['synthetic_timestamp'] = pd.to_datetime(start_time) + pd.to_timedelta(df.index, unit='s')
    else:
        df['synthetic_timestamp'] = pd.to_datetime(df['synthetic_timestamp'])
    return df

def load_and_process_data(file_path: str):
    print(f"Loading and processing data from: {file_path}")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    df = pd.read_csv(file_path, low_memory=False)
    df = augment_data_with_timestamps(df)
    
    df.to_csv(PROCESSED_DATA_PATH, index=False)
    print(f"Processed data saved to: {PROCESSED_DATA_PATH}")

def get_dataset_info() -> dict:
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError("Processed dataset not found. Please upload a dataset first.")
    
    df = pd.read_csv(PROCESSED_DATA_PATH, parse_dates=['synthetic_timestamp'], low_memory=False)
    
    return {
        "message": "Dataset processed and ready for use.",
        "totalRecords": len(df),
        "columnCount": len(df.columns),
        "dateRangeStart": df['synthetic_timestamp'].min().isoformat(),
        "dateRangeEnd": df['synthetic_timestamp'].max().isoformat()
    }

def get_data_for_range(start_date: str, end_date: str) -> pd.DataFrame:
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError("Processed dataset not found. Please upload a dataset first.")
    
    df = pd.read_csv(PROCESSED_DATA_PATH, parse_dates=['synthetic_timestamp'], low_memory=False)
    
    start_dt = pd.to_datetime(start_date).tz_localize(None)
    end_dt = pd.to_datetime(end_date).tz_localize(None)

    mask = (df['synthetic_timestamp'] >= start_dt) & (df['synthetic_timestamp'] <= end_dt)
    return df.loc[mask]