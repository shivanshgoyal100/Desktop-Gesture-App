import numpy as np
import pandas as pd
import tensorflow as tf
import subprocess
import pickle
import pyautogui
import math
import time
import os
import csv
import json
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "gesture_model.h5")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
MAPPINGS_PATH = os.path.join(MODEL_DIR, "gesture_mappings.json")
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_PATH = os.path.normpath(os.path.join(DATA_DIR, "gesture_data.csv"))

# Default actions for pretrained gestures
DEFAULT_ACTIONS = {
    "palm_open": "playpause",
    "fist": "volumemute",
    "thumb_up": "volumeup",
    "thumb_down": "volumedown",
    "peace": "ctrl+tab", 
    "three_fingers": "ctrl+shift+tab",
    "swipe_l": "win+ctrl+left",
    "swipe_r": "win+ctrl+right"
}

PRETRAINED_DEFAULTS = [g.lower().strip() for g in list(DEFAULT_ACTIONS.keys()) + ["point", "pinch"]]

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Performance Tuning
SMOOTHING = 3 
SCREEN_W, SCREEN_H = pyautogui.size()
CONFIDENCE_THRESHOLD = 0.70 
COOLDOWN_TIME = 0.5 
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Global AI States
model, encoder = None, None
p_loc_x, p_loc_y = SCREEN_W // 2, SCREEN_H // 2
is_clicking = False
last_action_time = 0

class MappingRequest(BaseModel):
    label: str
    action: str

# --- DATA REPAIR & SANITIZATION ---
def sanitize_and_fix_csv():
    """Forces all labels to lowercase and normalizes coordinates if needed."""
    if os.path.exists(DATA_PATH) and os.path.getsize(DATA_PATH) > 0:
        try:
            df = pd.read_csv(DATA_PATH, header=None)
            needs_coord_fix = abs(float(df.iloc[0, 0])) > 0.01
            
            # Always fix labels to lowercase and strip whitespace
            print("--- SANITIZING DATA LABELS ---")
            fixed_rows = []
            for _, row in df.iterrows():
                label = str(row.iloc[-1]).lower().strip()
                coords_raw = row.iloc[:-1].values
                
                if needs_coord_fix:
                    coords = coords_raw.reshape(21, 3)
                    wrist = coords[0]
                    norm_coords = (coords - wrist)
                    max_val = np.max(np.abs(norm_coords))
                    if max_val != 0: norm_coords /= max_val
                    final_coords = norm_coords.flatten().tolist()
                else:
                    final_coords = coords_raw.tolist()
                
                fixed_rows.append(final_coords + [label])
            
            pd.DataFrame(fixed_rows).to_csv(DATA_PATH, index=False, header=False)
            print("--- DATA SANITIZATION COMPLETE ---")
        except Exception as e:
            print(f"Sanitization Warning: {e}")

sanitize_and_fix_csv()

# --- HELPERS ---
def get_mappings():
    if os.path.exists(MAPPINGS_PATH):
        try:
            with open(MAPPINGS_PATH, 'r') as f: return json.load(f)
        except: return {}
    return {}

def normalize_landmarks(landmarks):
    try:
        wrist = landmarks[0]
        wx, wy, wz = wrist.get('x', 0), wrist.get('y', 0), wrist.get('z', 0)
        row = []
        for lm in landmarks:
            row.extend([lm.get('x', 0) - wx, lm.get('y', 0) - wy, lm.get('z', 0) - wz])
        row = np.array(row)
        max_val = np.max(np.abs(row))
        if max_val != 0: row = row / max_val
        return row.tolist()
    except: return None

def load_ai():
    global model, encoder
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            tf.keras.backend.clear_session()
            model = tf.keras.models.load_model(MODEL_PATH)
            with open(ENCODER_PATH, 'rb') as f: encoder = pickle.load(f)
            print("--- AI CORE RELOADED ---")
            return True
    except: return False

load_ai()

def get_finger_states(lm):
    states = [1 if lm[4]['y'] < lm[2]['y'] - 0.02 else 0] # Thumb
    for tip, pip in [(8, 6), (12, 10), (16, 14), (20, 18)]: # Others
        states.append(1 if lm[tip]['y'] < lm[pip]['y'] else 0)
    return states

@app.post("/process")
async def process_landmarks(request: Request):
    global p_loc_x, p_loc_y, is_clicking, last_action_time
    try:
        data = await request.json()
        lm = data.get("landmarks")
        if not lm or len(lm) < 21: return {"prediction": "Waiting..."}

        # 1. MOUSE CONTROL
        f_states = get_finger_states(lm)
        if f_states[1] == 1 and f_states[2] == 0:
            idx_tip, thumb_tip = lm[8], lm[4]
            tx = np.interp(idx_tip['x'], [0.15, 0.85], [SCREEN_W, 0])
            ty = np.interp(idx_tip['y'], [0.15, 0.85], [0, SCREEN_H])
            p_loc_x += (tx - p_loc_x) / SMOOTHING
            p_loc_y += (ty - p_loc_y) / SMOOTHING
            pyautogui.moveTo(int(p_loc_x), int(p_loc_y))
            dist = math.hypot(idx_tip['x'] - thumb_tip['x'], idx_tip['y'] - thumb_tip['y'])
            if dist < 0.045:
                if not is_clicking:
                    pyautogui.click()
                    is_clicking = True
                return {"prediction": "Clicking"}
            else: is_clicking = False

        # 2. AI GESTURE LOGIC
        now = time.time()
        if model and (now - last_action_time) > COOLDOWN_TIME:
            norm_input = normalize_landmarks(lm)
            if norm_input:
                pred = model.predict(np.array([norm_input]), verbose=0)
                if np.max(pred) > CONFIDENCE_THRESHOLD:
                    label = str(encoder.inverse_transform([np.argmax(pred)])[0]).lower().strip()
                    mappings = get_mappings()
                    if label in mappings:
                        pyautogui.press(mappings[label])
                        last_action_time = now
                        return {"prediction": f"Mapped: {label}"}
                    # Defaults
                    if label == "palm_open": pyautogui.press('playpause')
                    elif label == "fist": pyautogui.press('volumemute')
                    elif label == "thumb_up": pyautogui.press('volumeup')
                    elif label == "thumb_down": pyautogui.press('volumedown')
                    elif label == "peace": pyautogui.hotkey('ctrl', 'tab')
                    elif label == "three_fingers": pyautogui.hotkey('ctrl', 'shift', 'tab')
                    elif label == "swipe_l": pyautogui.hotkey('win', 'ctrl', 'left')
                    elif label == "swipe_r": pyautogui.hotkey('win', 'ctrl', 'right')
                    last_action_time = now
                    return {"prediction": f"AI: {label}"}
        return {"prediction": "Scanning..."}
    except: return {"prediction": "Error"}

# --- MANAGEMENT ENDPOINTS ---

@app.get("/gestures/list")
async def get_gestures():
    csv_labels = set()
    if os.path.exists(DATA_PATH):
        try:
            df = pd.read_csv(DATA_PATH, header=None)
            labels = df.iloc[:, -1].astype(str).str.lower().str.strip().unique().tolist()
            for l in labels: csv_labels.add(l)
        except: pass
    
    # Merge and Sort
    all_gestures = sorted(list(csv_labels.union(set(PRETRAINED_DEFAULTS))))
    return {"gestures": all_gestures, "custom_gestures": list(csv_labels)}

@app.post("/gestures/collect_frame")
async def collect_frame(request: Request):
    try:
        data = await request.json()
        landmarks, label = data.get("landmarks"), data.get("label")
        if landmarks and label:
            row = normalize_landmarks(landmarks) + [label.lower().strip()]
            with open(DATA_PATH, 'a', newline='') as f:
                csv.writer(f).writerow(row)
            return {"status": "recorded"}
    except: pass
    return {"status": "error"}

@app.delete("/gestures/delete/{name}")
async def delete_gesture(name: str):
    clean = name.lower().strip()
    try:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH, header=None)
            df = df[df.iloc[:, -1].astype(str).str.lower().str.strip() != clean]
            df.to_csv(DATA_PATH, index=False, header=False)
            m = get_mappings()
            if clean in m: 
                del m[clean]
                with open(MAPPINGS_PATH, 'w') as f: json.dump(m, f)
            return {"status": "success"}
    except: pass
    return {"status": "error"}

@app.post("/gestures/set_mapping")
async def set_mapping(req: MappingRequest):
    try:
        m = get_mappings()
        m[req.label.lower().strip()] = req.action
        with open(MAPPINGS_PATH, 'w') as f: json.dump(m, f)
        return {"status": "success"}
    except: return {"status": "error"}

@app.post("/gestures/train_now")
async def start_training(background_tasks: BackgroundTasks):
    def run_training():
        # Ensure training.py script is in the same directory
        subprocess.run(['python', os.path.join(BASE_DIR, "training.py")], check=True)
        load_ai() 
    background_tasks.add_task(run_training)
    return {"status": "success"}

@app.get("/analytics/plot")
async def get_plot():
    p = os.path.join(MODEL_DIR, "accuracy_plot.png")
    return FileResponse(p) if os.path.exists(p) else {"error": "no plot"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)