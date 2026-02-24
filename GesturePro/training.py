import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import matplotlib.pyplot as plt 
import pickle
import os

def run_retraining():
    print("\n--- Starting AI Core Retraining ---")
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(BASE_DIR, 'data', 'gesture_data.csv')
    model_dir = os.path.join(BASE_DIR, 'models')
    
    if not os.path.exists(csv_path):
        print(f"Error: No dataset found at {csv_path}")
        return

    # 1. Load and Clean Data (Case-Insensitive)
    try:
        df = pd.read_csv(csv_path, header=None)
        # Ensure labels are lowercase to prevent "Refresh" vs "refresh" issues
        df.iloc[:, -1] = df.iloc[:, -1].astype(str).str.lower().str.strip()
        df = df[df.iloc[:, -1] != 'label']
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # 2. Extract Features and Labels
    X = df.iloc[:, :-1].values.astype('float32')
    y = df.iloc[:, -1].values

    # Normalize landmarks
    for i in range(len(X)):
        max_val = np.max(np.abs(X[i]))
        if max_val != 0: X[i] /= max_val

    # 3. Label Encoding
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    os.makedirs(model_dir, exist_ok=True)
    with open(os.path.join(model_dir, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(label_encoder, f)
        
    print(f"AI is learning these gestures: {list(label_encoder.classes_)}")

    # 4. Data Splitting
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42
    )

    # 5. Model Architecture
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(63,)),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dense(len(np.unique(y_encoded)), activation='softmax')
    ])

    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # 6. Training
    print(f"Training on {len(X)} samples...")
    history = model.fit(
        X_train, y_train, 
        epochs=60, 
        validation_data=(X_test, y_test), 
        verbose=1
    )

    # 7. GENERATE AND SAVE THE PLOT
    plt.figure(figsize=(12, 5))
    
    # Accuracy Plot
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.legend()

    # Loss Plot
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.legend()

    plot_path = os.path.join(model_dir, 'accuracy_plot.png')
    plt.tight_layout()
    plt.savefig(plot_path)
    print(f"\n--- SUCCESS ---")
    print(f"1. Model saved to: {os.path.join(model_dir, 'gesture_model.h5')}")
    print(f"2. PLOT SAVED TO: {plot_path}") # This is where your plot is!

    # Note: If running via main.py, plt.show() might not pop up. 
    # Check the models/accuracy_plot.png file instead.
    # plt.show() 

    model.save(os.path.join(model_dir, 'gesture_model.h5'))

if __name__ == "__main__":
    run_retraining()