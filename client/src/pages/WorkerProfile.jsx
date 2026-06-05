import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../api';
import { User, Calendar, MapPin, Camera, Clock, TrendingUp, Briefcase, ChevronRight, Mail } from 'lucide-react';

const WorkerProfile = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const workersRes = await api.get('/api/workers');
        const currentWorker = workersRes.data.find(w => String(w.id) === String(id) || String(w._id) === String(id));

        if (currentWorker) {
          setWorker(currentWorker);
          const [attendanceRes, visitsRes] = await Promise.all([
            api.get('/api/attendance'),
            api.get(`/api/visits?workerName=${currentWorker.name}&limit=-1`)
          ]);
          setAttendance(attendanceRes.data.filter(a => a.workerName === currentWorker.name));
          setVisits(visitsRes.data.visits || []);
        }
      } catch (err) {
        console.error("Error fetching worker profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading profile...</div>;
  if (!worker) return <div className="text-center py-10 text-red-500">Worker not found</div>;

  const totalVisits = visits.length;
  const completedSessions = attendance.filter(a => a.status === 'completed').length;
  const uniqueShops = new Set(visits.map(v => v.shopName)).size;

  const activityTimeline = [
    ...attendance.map(a => ({ ...a, type: 'attendance', timestamp: a.startTime })),
    ...visits.map(v => ({ ...v, type: 'visit', timestamp: v.timestamp }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header Profile Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 mb-8 shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-green-500/20">
            <User size={48} strokeWidth={2.5} />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-5xl font-extrabold mb-2 tracking-tighter">{worker.name}</h1>
            <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 font-medium">
              <Mail size={16} className="text-green-500" /> {worker.username}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-widest">Visits</p>
              <p className="text-2xl font-bold text-green-500">{totalVisits}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-widest">Days</p>
              <p className="text-2xl font-bold text-green-500">{completedSessions}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-widest">Shops</p>
              <p className="text-2xl font-bold text-green-500">{uniqueShops}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics & Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <TrendingUp className="text-green-500" /> Stats Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Total Working Days</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">{attendance.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Total Shop Visits</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">{visits.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Avg Visits / Day</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  {attendance.length > 0 ? (visits.length / attendance.length).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Calendar className="text-green-500" /> Recent Attendance
            </h2>
            <div className="space-y-3">
              {attendance.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-800/40 rounded-lg transition-colors border border-transparent hover:border-slate-800">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${a.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <span className="font-bold text-slate-200">{new Date(a.startTime).toLocaleDateString()}</span>
                  <span className="text-slate-400 ml-auto font-mono">
                    {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {attendance.length === 0 && <p className="text-slate-500 italic text-center py-4">No attendance records</p>}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-white">
              <Briefcase className="text-green-500" /> Activity Timeline
            </h2>

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-8">
              {activityTimeline.map((item, index) => (
                <div key={item.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 shadow-md ${
                    item.type === 'attendance' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />

                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                      {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {item.type === 'attendance' && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                        {item.status === 'working' ? 'Shift Started' : 'Shift Ended'}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all group">
                    {item.type === 'attendance' ? (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-800 rounded-lg text-blue-400">
                          <Camera size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white">Attendance Marked</p>
                          <p className="text-sm text-slate-400">{item.status === 'working' ? 'Started work for the day' : 'Completed shift'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                          <MapPin size={20} className="text-green-500" /> {item.shopName}
                        </div>
                        {item.notes && (
                          <div className="relative pl-4 border-l-2 border-green-500/30">
                            <p className="text-sm text-slate-300 italic leading-relaxed">"{item.notes}"</p>
                          </div>
                        )}
                        {item.photo && (
                          <div className="relative w-40 h-40 group-hover:scale-[1.02] transition-transform">
                            <img
                              src={item.photo.startsWith('http') ? item.photo : `${API_BASE_URL}/${item.photo.replace(/\\/g, '/')}`}
                              alt="Visit"
                              className="w-full h-full object-cover rounded-xl shadow-lg border border-slate-700"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors rounded-xl" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {activityTimeline.length === 0 && (
                <div className="pl-8 text-slate-500 italic">No recent activity recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
