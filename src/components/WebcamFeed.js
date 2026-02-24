import React, { useEffect, useRef, useState } from 'react';

const WebcamFeed = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attempt to start raw video stream immediately
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera Access Denied: " + err.message);
      }
    };

    startVideo();
  }, []);

  return (
    <div className="relative w-full aspect-video rounded-xl bg-slate-900 border-2 border-slate-700 overflow-hidden">
      {error ? (
        <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
          {error}
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} 
        />
      )}
    </div>
  );
};

export default WebcamFeed;