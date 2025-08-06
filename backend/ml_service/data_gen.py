import pandas as pd
import numpy as np

# -----------------------
# Configuration
# -----------------------
num_samples = 1000
start_time = pd.to_datetime("2023-01-01 00:00:00")

# -----------------------
# Generate synthetic features
# -----------------------
np.random.seed(42)

data = {
    "Sample_ID": range(1, num_samples + 1),
    "Temperature": np.random.normal(75, 5, num_samples),  # Mean 75°C ± 5
    "Pressure": np.random.normal(30, 3, num_samples),      # Mean 30 PSI ± 3
    "Vibration": np.random.normal(0.5, 0.1, num_samples),  # Mean 0.5g ± 0.1
    "Speed": np.random.normal(120, 10, num_samples),       # Mean 120 RPM ± 10
    "Voltage": np.random.normal(220, 5, num_samples),      # Mean 220V ± 5
}

# -----------------------
# Generate Response (Pass/Fail)
# -----------------------
# Fail occurs when sensor readings deviate too much
response = []
for i in range(num_samples):
    fail_prob = 0.1  # base 10% chance
    # Increase failure probability for extreme values
    if data["Temperature"][i] > 82 or data["Temperature"][i] < 68:
        fail_prob += 0.3
    if data["Pressure"][i] > 36 or data["Pressure"][i] < 24:
        fail_prob += 0.3
    if data["Vibration"][i] > 0.7:
        fail_prob += 0.2
    if data["Speed"][i] > 135 or data["Speed"][i] < 105:
        fail_prob += 0.2
    
    response.append(0 if np.random.rand() < fail_prob else 1)

data["Response"] = response

# -----------------------
# Add synthetic timestamp
# -----------------------
timestamps = [start_time + pd.Timedelta(seconds=i) for i in range(num_samples)]
data["synthetic_timestamp"] = timestamps

# -----------------------
# Create DataFrame and Save CSV
# -----------------------
df = pd.DataFrame(data)
df.to_csv("sample_dataset.csv", index=False)

print("\nGenerated dataset saved as 'realistic_production_data.csv'")
print(df.head(10))
print("\nClass distribution:")
print(df['Response'].value_counts())
