# Desktop-Gesture-App
GesturePro README
GesturePro is a comprehensive system designed to translate hand movements into system-level commands through machine learning. By leveraging computer vision and neural networks, it provides a touchless interface for controlling various desktop and browser functions.

Features
Real-time Gesture Recognition: Utilizes MediaPipe for high-accuracy hand landmark detection and a TensorFlow-based model for rapid gesture classification.

Custom Gesture Training: Users can record and train new gestures directly through the interface by capturing a 400-frame landmark dataset.

System-Level Mappings: Predefined and custom gestures can be mapped to keyboard shortcuts, media controls, and browser navigation.

Live Control Dashboard: A centralized hub to start or stop the recognition system and view active predictions.

System Analytics: Visualizes model performance, including training accuracy and loss curves, to verify recognition quality.

Technical Stack
Backend
Framework: FastAPI for handling real-time data processing and model management.

Computer Vision: OpenCV and MediaPipe Hands for landmark extraction.

Machine Learning: TensorFlow/Keras for model training and classification.

Automation: PyAutoGUI for executing system-level actions based on recognized gestures.

Frontend
Library: React with React Router for navigation.

Styling: Tailwind CSS for a modern, dark-themed responsive UI.

Icons: Lucide-React and React-Icons.

Core Components
collection.py: A standalone utility for high-volume data collection of 10 predefined gestures.

main.py: The primary server that manages the AI state, handles landmark processing, and executes mapped actions.

training.py: Handles the retraining of the neural network using collected landmark data and generates performance plots.

Dashboard.js: Connects the webcam feed to the MediaPipe processing pipeline and sends landmarks to the backend.

Gestures.js: Interface for managing the library of available gestures and initiating new training sessions.

Default Action Mappings
The system includes several default configurations for immediate use:

Palm Open: Play/Pause media.

Fist: Mute System (Boss Key).

Thumb Up/Down: Volume Up/Down.

Peace/Three Fingers: Next/Previous Tab.

Swipe Left/Right: Windows Desktop Navigation.

Index Finger Up: Cursor Movement (Mouse Control).

Index + Thumb Pinch: Left Click.

Setup and Installation
Prerequisites
Python 3.8+

Node.js and npm

A webcam

Backend Setup
Navigate to the backend directory.

Install dependencies: pip install fastapi uvicorn mediapipe tensorflow pyautogui pandas scikit-learn matplotlib.

Start the server: uvicorn main:app --reload.

Frontend Setup
Navigate to the frontend directory.

Install dependencies: npm install.

Start the development server: npm start.

Data Management
All captured landmark data is stored in backend/data/gesture_data.csv. Trained models and label encoders are preserved in the models/ directory as .h5 and .pkl files, respectively.
