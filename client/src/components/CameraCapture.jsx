import React, { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Play, SwitchCamera } from 'lucide-react';

const CameraCapture = ({ onCapture, label = "Proof Photo", required = false, facingMode = "environment" }) => {
  const [stream, setStream] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeFacingMode, setActiveFacingMode] = useState(facingMode);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async (retryWithAny = false) => {
    setError(null);
    setIsCapturing(true);
    try {
      const videoConstraints = retryWithAny
        ? { width: { ideal: 1280 }, height: { ideal: 720 } }
        : {
            facingMode: activeFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };

      const constraints = { video: videoConstraints };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (!retryWithAny) {
        console.log("Retrying with any available camera...");
        return startCamera(true);
      }
      setError("Camera access denied. Please enable permissions and try again.");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const toggleCamera = () => {
    const nextMode = activeFacingMode === 'user' ? 'environment' : 'user';
    setActiveFacingMode(nextMode);
    stopCamera();
    // Use a small delay to ensure stream is fully stopped before restarting
    setTimeout(() => {
      // Re-trigger start with nextMode
      startCameraWithMode(nextMode);
    }, 100);
  };

  const startCameraWithMode = async (mode) => {
    setError(null);
    setIsCapturing(true);
    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera switch error:", err);
      // Fallback
      startCamera(true);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(dataUrl);

      // Convert to file for API compatibility
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }, 'image/jpeg', 0.8);

      stopCamera();
    }
  };

  const retake = () => {
    setPreview(null);
    onCapture(null);
    startCamera();
  };

  const cancel = () => {
    stopCamera();
    setPreview(null);
    onCapture(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {!isCapturing && !preview && (
        <button
          type="button"
          onClick={startCamera}
          className="w-full bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:border-green-500/50 hover:bg-slate-800/80 transition-all group"
        >
          <div className="p-4 bg-slate-900 rounded-full text-slate-500 group-hover:text-green-500 transition-colors shadow-inner">
             <Camera size={32} />
          </div>
          <p className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Tap to Open Camera</p>
          <p className="text-[10px] text-slate-600 font-medium">Gallery upload is disabled for security</p>
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
          {error}
        </div>
      )}

      {isCapturing && (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-300">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto max-h-[60vh] object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
            <button
              type="button"
              onClick={cancel}
              className="p-3 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition-all border border-slate-700"
            >
              <X size={20} />
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              className="p-5 bg-green-500 text-zinc-950 rounded-full hover:bg-green-400 transition-all shadow-lg shadow-green-500/40 ring-4 ring-green-500/20 active:scale-95"
            >
              <Camera size={28} />
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className="p-3 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition-all border border-slate-700"
              title="Switch Camera"
            >
              <SwitchCamera size={20} />
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-green-500/30 shadow-2xl animate-in fade-in zoom-in duration-300">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-[60vh] object-cover"
          />
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-zinc-950 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
            <Check size={14} /> Live Captured
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
            <button
              type="button"
              onClick={retake}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900/90 text-white rounded-xl font-bold hover:bg-slate-800 transition-all border border-slate-700 shadow-xl backdrop-blur-sm"
            >
              <RefreshCw size={18} /> Retake Photo
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
