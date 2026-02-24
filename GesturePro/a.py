import pandas as pd
import numpy as np

# Load your existing data
df = pd.read_csv("data\gesture_data.csv", header=None)

def fix_normalization(row):
    coords = row.iloc[:-1].values.astype(float).reshape(21, 3)
    wrist = coords[0].copy()
    coords = coords - wrist  # Make relative to wrist
    flat = coords.flatten()
    max_val = np.max(np.abs(flat))
    if max_val != 0: flat = flat / max_val # Normalize size
    return list(flat) + [row.iloc[-1]]

fixed_df = df.apply(fix_normalization, axis=1, result_type='expand')
fixed_df.to_csv('gesture_data.csv', index=False, header=False)
print("Data successfully converted to Relative Coordinates!")