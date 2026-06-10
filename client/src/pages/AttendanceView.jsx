import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import { User, Clock, Camera, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AttendanceView = () => {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchAttendance();
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/api/workers');
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch workers", err);
      setWorkers([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/api/attendance');
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
      setAttendance([]);
    }
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return '-';
    const diff = new Date(end) - new Date(start);
    const hours = diff / (1000 * 60 * 60);
    return `${hours.toFixed(1)} hrs`;
  };

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-8 text-white tracking-tight">Worker Attendance</h1>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Worker</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Selfie</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Start Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">End Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Total Hours</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 italic">No attendance records found.</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mr-3 text-slate-400 border border-slate-700">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-bold text-white">
                          {workers.find(w => w.name === record.workerName) ? (
                            <Link to={`/worker/${workers.find(w => w.name === record.workerName).id}`} className="hover:text-green-500 transition-colors">
                              {record.workerName}
                            </Link>
                          ) : record.workerName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {record.startPhoto ? (
                         <a href={getImageUrl(record.startPhoto)} target="_blank" rel="noopener noreferrer">
                           <img
                             src={getImageUrl(record.startPhoto)}
                             className="w-10 h-10 rounded-lg object-cover border border-slate-700 hover:border-green-500 transition-colors"
                             alt="Selfie"
                           />
                         </a>
                       ) : (
                         <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600">
                           <Camera size={16} />
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">{new Date(record.startTime).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-green-500 font-medium">
                        <Clock className="w-4 h-4 mr-2" /> {formatTime(record.startTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-400 font-medium">
                        <Clock className="w-4 h-4 mr-2" /> {formatTime(record.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-500">
                      {calculateHours(record.startTime, record.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-widest border ${
                        record.status === 'completed'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {record.status === 'completed' ? 'Completed' : 'Working'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {attendance.length === 0 ? (
          <div className="bg-slate-900 p-10 text-center rounded-2xl border border-slate-800 text-slate-500 italic">No attendance records found.</div>
        ) : (
          attendance.map((record) => (
            <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    {record.startPhoto && (
                      <a href={getImageUrl(record.startPhoto)} target="_blank" rel="noopener noreferrer" className="absolute -bottom-1 -right-1">
                        <img
                          src={getImageUrl(record.startPhoto)}
                          className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                          alt="Selfie"
                        />
                      </a>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-bold">
                       {workers.find(w => w.name === record.workerName) ? (
                         <Link to={`/worker/${workers.find(w => w.name === record.workerName).id}`} className="text-green-500">
                           {record.workerName}
                         </Link>
                       ) : record.workerName}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(record.startTime).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-widest border ${
                  record.status === 'completed'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}>
                  {record.status === 'completed' ? 'Done' : 'Live'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">In</p>
                    <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                       <Clock size={10} /> {formatTime(record.startTime)}
                    </p>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Out</p>
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                       <Clock size={10} /> {formatTime(record.endTime)}
                    </p>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Total</p>
                    <p className="text-xs font-black text-green-500">
                       {calculateHours(record.startTime, record.endTime)}
                    </p>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceView;
