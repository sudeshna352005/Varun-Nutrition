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
        const [workersRes, attendanceRes, visitsRes] = await Promise.all([
          api.get('/api/workers'),
          api.get('/api/attendance'),
          api.get('/api/visits')
        ]);

        const currentWorker = workersRes.data.find(w => String(w.id) === String(id));
        if (currentWorker) {
          setWorker(currentWorker);
          setAttendance(attendanceRes.data.filter(a => a.workerName === currentWorker.name));
          setVisits(visitsRes.data.filter(v => v.workerName === currentWorker.name));
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
    <div className="max-w-6xl mx-auto">
      {/* Header Profile Section */}
      <div className="bg-zinc-900 text-white rounded-2xl p-8 mb-8 shadow-xl border border-zinc-800">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-zinc-900">
            <User size={48} strokeWidth={2.5} />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold mb-1">{worker.name}</h1>
            <p className="text-zinc-400 flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} /> {worker.username}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-zinc-800 p-4 rounded-xl text-center border border-zinc-700">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Visits</p>
              <p className="text-2xl font-bold text-green-500">{totalVisits}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-xl text-center border border-zinc-700">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Days</p>
              <p className="text-2xl font-bold text-green-500">{completedSessions}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-xl text-center border border-zinc-700">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Shops</p>
              <p className="text-2xl font-bold text-green-500">{uniqueShops}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics & Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <TrendingUp className="text-green-500" /> Stats Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <span className="text-zinc-400">Total Working Days</span>
                <span className="font-bold text-white">{attendance.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <span className="text-zinc-400">Total Shop Visits</span>
                <span className="font-bold text-white">{visits.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <span className="text-zinc-400">Avg Visits / Day</span>
                <span className="font-bold text-white">
                  {attendance.length > 0 ? (visits.length / attendance.length).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Calendar className="text-green-500" /> Recent Attendance
            </h2>
            <div className="space-y-3">
              {attendance.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${a.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="font-medium text-zinc-200">{new Date(a.startTime).toLocaleDateString()}</span>
                  <span className="text-zinc-500 ml-auto">
                    {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {attendance.length === 0 && <p className="text-zinc-500 italic">No attendance records</p>}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-800">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-white">
              <Briefcase className="text-green-500" /> Activity Timeline
            </h2>

            <div className="relative border-l-2 border-zinc-800 ml-4 space-y-8">
              {activityTimeline.map((item, index) => (
                <div key={item.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-zinc-900 shadow-sm ${
                    item.type === 'attendance' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />

                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {item.type === 'attendance' && (
                      <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-[10px] font-bold uppercase">
                        {item.status === 'working' ? 'Shift Started' : 'Shift Ended'}
                      </span>
                    )}
                  </div>

                  <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
                    {item.type === 'attendance' ? (
                      <div className="flex items-center gap-4">
                        <Camera className="text-zinc-500" size={20} />
                        <div>
                          <p className="font-bold text-zinc-100">Attendance Marked</p>
                          <p className="text-sm text-zinc-400">{item.status === 'working' ? 'Started work for the day' : 'Completed shift'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-500 font-bold">
                          <MapPin size={18} /> {item.shopName}
                        </div>
                        {item.notes && <p className="text-sm text-zinc-300 bg-zinc-900/50 p-2 rounded border border-zinc-800 italic">"{item.notes}"</p>}
                        {item.photo && (
                          <div className="relative w-32 h-32 group">
                            <img
                              src={item.photo.startsWith('http') ? item.photo : `${API_BASE_URL}/${item.photo.replace(/\\/g, '/')}`}
                              alt="Visit"
                              className="w-full h-full object-cover rounded-lg shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {activityTimeline.length === 0 && (
                <div className="pl-8 text-zinc-400 italic">No recent activity recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
