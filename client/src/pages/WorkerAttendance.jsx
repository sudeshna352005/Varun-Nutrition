import React, { useState, useEffect } from 'react';
import api from '../api';
import { Camera, Play, Square, CheckCircle, MessageSquare, MapPin } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';

const WorkerAttendance = ({ user }) => {
  const [session, setSession] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const res = await api.get('/api/attendance');
      const attendanceArr = Array.isArray(res.data) ? res.data : [];
      const active = attendanceArr.find(a => a.workerName === user.name && a.status === 'working');
      if (active) setSession(active);
    } catch (err) {
      console.error("Failed to check active session", err);
    }
  };

  const handleStartWork = async () => {
    if (!photo) {
      alert('Please select a photo for attendance');
      return;
    }
    const formData = new FormData();
    formData.append('workerName', user.name);
    formData.append('photo', photo);

    try {
      const res = await api.post('/api/attendance/start', formData);
      setSession(res.data);
      setPhoto(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndWork = async () => {
    try {
      await api.post('/api/attendance/end', { workerName: user.name });
      setSession(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-10">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-white tracking-tight">Attendance</h1>
      
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl text-center">
        {session ? (
          <div>
            <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-green-500/20">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Play className="w-8 h-8 text-zinc-900 ml-1" fill="currentColor" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Work in Progress</h2>
            <p className="text-slate-500 text-sm mb-10 uppercase tracking-widest font-bold">Started at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <button
              onClick={handleEndWork}
              className="w-full bg-slate-800 border border-red-500/50 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-red-500 hover:text-zinc-900 transition-all shadow-lg"
            >
              <Square className="w-5 h-5 mr-3" fill="currentColor" /> Mark End Work
            </button>
          </div>
        ) : (
          <div>
            <div className="w-24 h-24 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500">
              <Camera className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Your Shift</h2>
            <p className="text-slate-500 text-sm mb-10 uppercase tracking-widest font-bold">Identity verification required</p>
            
            <div className="mb-10 text-left">
              <CameraCapture
                onCapture={setPhoto}
                label="Selfie Identity Proof"
                required
              />
            </div>

            <button
              onClick={handleStartWork}
              className="w-full bg-green-600 text-zinc-900 py-4 rounded-2xl font-extrabold flex items-center justify-center hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
            >
              <Play className="w-5 h-5 mr-3" fill="currentColor" /> Mark Start Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerAttendance;
