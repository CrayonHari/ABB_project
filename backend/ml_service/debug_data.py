from app.ml.data_handler import get_data_for_range

train_df = get_data_for_range("2023-01-01T00:00:00", "2023-01-01T00:11:39")
print("Train Data Shape:", train_df.shape)
print(train_df['Response'].value_counts())
