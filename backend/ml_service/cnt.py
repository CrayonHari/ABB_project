import pandas as pd
import requests
import json
from app.ml.data_handler import get_data_for_range

# ------------------------------
# 1. Check Training and Testing Data
# ------------------------------
train_start = "2023-01-01T00:00:00"
train_end   = "2023-01-01T00:11:39"
test_start  = "2023-01-01T00:11:40"
test_end    = "2023-01-01T00:16:39"

train_df = get_data_for_range(train_start, train_end)
test_df = get_data_for_range(test_start, test_end)

print("\n=== DEBUG: TRAIN DATA ===")
print(train_df.shape)
print(train_df['Response'].value_counts())

print("\n=== DEBUG: TEST DATA ===")
print(test_df.shape)
print(test_df['Response'].value_counts())

# ------------------------------
# 2. Pick a Real Row for Prediction
# ------------------------------
# Drop Response and timestamp because the model does not need them
sample_row = test_df.iloc[0].drop(['Sample_ID', 'Response', 'synthetic_timestamp']).to_dict()
print("\n=== DEBUG: Sample Row for Prediction ===")
print(sample_row)

# ------------------------------
# 3. Send Row to FastAPI /predict
# ------------------------------
url = "http://127.0.0.1:8000/predict"
headers = {"Content-Type": "application/json"}
response = requests.post(url, data=json.dumps(sample_row), headers=headers)

print("\n=== DEBUG: Prediction Response ===")
print(response.status_code, response.text)
