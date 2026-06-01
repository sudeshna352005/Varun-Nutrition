import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Play, Square, CheckCircle, MessageSquare, MapPin } from 'lucide-react';

const WorkerAttendance = ({ user }) => {
  const [session, setSession] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const res = await axios.get('http://localhost:5000/api/attendance');
    const active = res.data.find(a => a.workerName === user.name && a.status === 'working');
    if (active) setSession(active);
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
      const res = await axios.post('http://localhost:5000/api/attendance/start', formData);
      setSession(res.data);
      setPhoto(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndWork = async () => {
    try {
      await axios.post('http://localhost:5000/api/attendance/end', { workerName: user.name });
      setSession(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        {session ? (
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-10 h-10 text-green-600 ml-1" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Work in Progress</h2>
            <p className="text-gray-500 mb-6">Started at {new Date(session.startTime).toLocaleTimeString()}</p>
            <button
              onClick={handleEndWork}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center hover:bg-red-700 transition"
            >
              <Square className="w-5 h-5 mr-2" /> Mark End Work
            </button>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Start Your Shift</h2>
            <p className="text-gray-500 mb-6">Upload a photo to begin</p>
            
            <div className="mb-6">
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files[0])}
                />
                <span className="text-sm text-gray-600">
                  {photo ? photo.name : 'Click to select photo'}
                </span>
              </label>
            </div>

            <button
              onClick={handleStartWork}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center hover:bg-blue-700 transition"
            >
              <Play className="w-5 h-5 mr-2" /> Mark Start Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerAttendance;
