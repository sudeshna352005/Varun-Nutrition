import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api';
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
    const res = await api.get('/api/workers');
    setWorkers(res.data);
  };

  const fetchAttendance = async () => {
    const res = await api.get('/api/attendance');
    setAttendance(res.data);
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Worker Attendance</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Worker</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Start Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">End Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Photo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-zinc-500 italic">No attendance records found.</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center mr-3 text-zinc-400 border border-zinc-700">
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
                      <div className="text-sm text-zinc-400">{new Date(record.startTime).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-green-500 font-medium">
                        <Clock className="w-4 h-4 mr-2" /> {formatTime(record.startTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-zinc-500 font-medium">
                        <Clock className="w-4 h-4 mr-2" /> {formatTime(record.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.photo ? (
                        <div className="relative group cursor-pointer inline-block">
                          <Camera className="w-6 h-6 text-blue-500 hover:text-blue-400 transition-colors" />
                          <div className="absolute hidden group-hover:block z-20 p-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl mt-2 -left-12">
                            <img src={`${API_BASE_URL}/${record.photo.replace(/\\/g, '/')}`} alt="Attendance" className="w-48 h-48 object-cover rounded-lg" />
                          </div>
                        </div>
                      ) : <span className="text-zinc-600">-</span>}
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
    </div>
  );
};

export default AttendanceView;
