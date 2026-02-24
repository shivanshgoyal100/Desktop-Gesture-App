import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, ArrowLeft, Trash2 } from 'lucide-react';
import { Hands } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';

const ModelTraining = () => {
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const isRunning = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const gestureName = location.state?.newGesture || "Unknown";
  const frameLimit = location.state?.limit || 100;

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  const recordingRef = useRef(false);
  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  const onResults = useCallback((results) => {
    // Only process results if the component is still mounted and intended to run
    if (!isRunning.current) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      
      if (recordingRef.current) {
        setFrameCount((prev) => {
          if (prev < frameLimit) {
            fetch('http://localhost:8000/gestures/collect_frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                landmarks: results.multiHandLandmarks[0], 
                label: gestureName 
              }),
            }).catch(err => console.error("Capture Error:", err));
            
            return prev + 1;
          }
          setIsRecording(false);
          return frameLimit;
        });
      }
    } else {
      setHandDetected(false);
    }
  }, [gestureName, frameLimit]);

  useEffect(() => {
    // ONLY initialize if camera is requested AND the video element exists in DOM
    if (isCameraOpen && videoRef.current) {
      isRunning.current = true;

      handsRef.current = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handsRef.current.onResults(onResults);

      cameraRef.current = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          const videoElement = videoRef.current;
          
          // SAFETY GATE: Ensure the video element is ready and the model exists
          if (
            isRunning.current && 
            handsRef.current && 
            videoElement && 
            videoElement.readyState >= 2 // HAVE_CURRENT_DATA: ensures width/height are available
          ) {
            try {
              await handsRef.current.send({ image: videoElement });
            } catch (e) {
              console.warn("MediaPipe Frame Error:", e);
            }
          }
        },
        width: 1280,
        height: 720,
      });
      
      cameraRef.current.start().catch(err => console.error("Camera Start Error:", err));
    }

    // Cleanup: Stop everything when the component closes or camera is toggled
    return () => {
      isRunning.current = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [isCameraOpen, onResults]);

  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('http://localhost:8000/gestures/train_now', { method: 'POST' });
      if (response.ok) alert("Neural network update started!");
    } catch (err) {
      alert("Failed to connect to backend.");
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteData = async () => {
    if (window.confirm(`Permanently wipe all training data for "${gestureName}"?`)) {
      try {
        await fetch(`http://localhost:8000/gestures/delete/${gestureName}`, { method: 'DELETE' });
        setFrameCount(0);
        alert("Gesture data deleted.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const progressPercentage = Math.round((frameCount / frameLimit) * 100);

  return (
    <div className="p-10 text-white min-h-screen bg-[#0d1117] font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/gestures')} className="p-2 hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black italic">GESTURE PRO LAB</h1>
              <p className="text-indigo-400 font-mono">Gesture: {gestureName.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDeleteData} className="p-3 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-900/40 transition-all border border-red-900/50">
               <Trash2 size={20} />
            </button>
            <button 
              onClick={handleRetrain}
              disabled={isTraining || frameCount < frameLimit}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${frameCount < frameLimit ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
            >
              {isTraining ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
              {isTraining ? "Synthesizing..." : "Update Model"}
            </button>
          </div>
        </div>

        {isCameraOpen ? (
          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-black aspect-video shadow-2xl">
            {/* Mirror the video feed for a more natural training experience */}
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
            
            <div className={`absolute top-8 left-8 px-4 py-2 rounded-full text-[10px] font-black tracking-widest border ${handDetected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {handDetected ? "• HAND DETECTED" : "• SEARCHING..."}
            </div>

            <div className="absolute bottom-12 w-full flex justify-center px-10">
              {!isRecording && frameCount < frameLimit ? (
                <button 
                  onClick={() => { setFrameCount(0); setIsRecording(true); }} 
                  disabled={!handDetected}
                  className="bg-white text-black px-12 py-5 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                >
                  START COLLECTING {frameLimit} SAMPLES
                </button>
              ) : frameCount >= frameLimit ? (
                <div className="bg-green-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-green-500/30">
                  COLLECTION COMPLETE - CLICK 'UPDATE MODEL'
                </div>
              ) : (
                <div className="w-full max-w-sm bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <div className="flex justify-between mb-2 px-1 text-[10px] font-bold tracking-widest text-indigo-300">
                    <span>RECORDING COORDINATES</span>
                    <span>{frameCount} / {frameLimit}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                      style={{ width: `${progressPercentage}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-white/5 bg-white/[0.02] p-24 rounded-[3.5rem] text-center backdrop-blur-sm border-dashed">
             <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
               <RefreshCw size={32} className="text-indigo-400" />
             </div>
             <h2 className="text-3xl font-bold mb-4">Neural Feed: {gestureName}</h2>
             <p className="text-gray-400 mb-10 max-w-sm mx-auto text-sm leading-relaxed">
               Hold your gesture in front of the lens. We will capture {frameLimit} snapshots to teach the neural network this specific hand structure.
             </p>
             <button 
              onClick={() => setIsCameraOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 px-12 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20"
             >
               Launch Workspace
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTraining;