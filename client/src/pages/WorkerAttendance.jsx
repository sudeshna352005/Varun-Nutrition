import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Play, Square, Calendar, Clock, History, Camera, UserCheck } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';

const WorkerAttendance = ({ user }) => {
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/attendance');
      const attendanceArr = Array.isArray(res.data) ? res.data : [];

      const userLogs = attendanceArr
        .filter(a => a.workerName === user.name)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      setHistory(userLogs);

      const active = userLogs.find(a => a.status === 'working');
      if (active) setSession(active);
      else setSession(null);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!photo) {
      alert("Selfie verification is required to start shift.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('workerName', user.name);
      formData.append('photo', photo);

      const res = await api.post('/api/attendance/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSession(res.data);
      setPhoto(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to start work session.");
    }
  };

  const handleEndWork = async () => {
    try {
      await api.post('/api/attendance/end', { workerName: user.name });
      setSession(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to end work session.");
    }
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return '-';
    const diff = new Date(end) - new Date(start);
    const hours = diff / (1000 * 60 * 60);
    return `${hours.toFixed(1)} hrs`;
  };

  if (loading && history.length === 0) return <div className="text-center py-20 text-slate-500">Loading Attendance...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Attendance Dashboard</h1>
        <p className="text-slate-500">Mark your daily work sessions and track your history.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Action Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center sticky top-6">
            {session ? (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="w-8 h-8 text-green-500 ml-1 animate-pulse" fill="currentColor" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Shift Active</h2>
                <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-bold">Started at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <button
                  onClick={handleEndWork}
                  className="w-full bg-slate-800 border border-red-500/30 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-red-500 hover:text-zinc-900 transition-all shadow-lg active:scale-95"
                >
                  <Square size={18} className="mr-2" fill="currentColor" /> Mark End Work
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                  <Clock size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Ready to Work?</h2>
                <p className="text-slate-500 text-xs mb-6 uppercase tracking-widest font-bold text-center">Selfie Identity Verification Required</p>

                <div className="mb-8 text-left">
                  <CameraCapture
                    onCapture={setPhoto}
                    label="Front Camera Selfie"
                    required
                    facingMode="user"
                  />
                </div>

                <button
                  onClick={handleStartWork}
                  className="w-full bg-green-600 text-zinc-900 py-4 rounded-2xl font-extrabold flex items-center justify-center hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 active:scale-95"
                >
                  <Play size={18} className="mr-2" fill="currentColor" /> Mark Start Work
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center gap-2">
              <History size={18} className="text-green-500" />
              <h3 className="font-bold text-white uppercase tracking-widest text-xs">Recent History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Start</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">End</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Hours</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                        {new Date(log.startTime).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                        {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                        {log.endTime ? new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-green-500">
                        {calculateHours(log.startTime, log.endTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                          log.status === 'working' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-slate-600 italic text-sm">No attendance history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerAttendance;
