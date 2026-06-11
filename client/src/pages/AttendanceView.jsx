import React, { useState, useEffect, useMemo } from 'react';
import api, { getImageUrl } from '../api';
import { User, Clock, Camera, CheckCircle, Search, Calendar, Filter, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const AttendanceView = () => {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchAttendance();
    fetchWorkers();
  }, [workerFilter, statusFilter, dateRange]);

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
      let url = '/api/attendance?';
      if (workerFilter !== 'all') url += `workerName=${workerFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (dateRange.start && dateRange.end) url += `startDate=${dateRange.start}&endDate=${dateRange.end}&`;

      const res = await api.get(url);
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

  const filteredAttendance = useMemo(() => {
    return attendance.filter(a =>
      a.workerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attendance, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setWorkerFilter('all');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Worker Attendance</h1>
        <button
          onClick={resetFilters}
          className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <X size={14} /> Reset Filters
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Worker..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <User className="absolute left-3 top-3 size-4 text-slate-500" />
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none"
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
          >
            <option value="all">All Workers</option>
            {workers.map(w => (
              <option key={w.id || w._id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="relative flex items-center gap-2">
          <Calendar className="absolute left-3 top-3 size-4 text-slate-500" />
          <input
            type="date"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-2 py-2.5 text-xs text-white focus:ring-2 focus:ring-green-500 outline-none"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          />
          <span className="text-slate-600">-</span>
          <input
            type="date"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-xs text-white focus:ring-2 focus:ring-green-500 outline-none"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-3 size-4 text-slate-500" />
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="working">Working</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

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
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500 italic">No attendance records found.</td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record.id || record._id} className="hover:bg-slate-800/30 transition-colors">
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
                       {record.photo ? (
                         <button
                          onClick={() => setSelectedPhoto(record)}
                          className="relative group"
                         >
                           <img
                             src={getImageUrl(record.photo)}
                             className="w-12 h-12 rounded-xl object-cover border border-slate-700 group-hover:border-green-500 transition-all shadow-lg"
                             alt="Selfie"
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <Eye size={16} className="text-white" />
                           </div>
                         </button>
                       ) : (
                         <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 border border-slate-700">
                           <Camera size={18} />
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
        {filteredAttendance.length === 0 ? (
          <div className="bg-slate-900 p-10 text-center rounded-2xl border border-slate-800 text-slate-500 italic">No attendance records found.</div>
        ) : (
          filteredAttendance.map((record) => (
            <div key={record.id || record._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <button
                      onClick={() => record.photo && setSelectedPhoto(record)}
                      className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 overflow-hidden"
                    >
                      {record.photo ? (
                         <img
                          src={getImageUrl(record.photo)}
                          className="w-full h-full object-cover"
                          alt="Selfie"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </button>
                    {record.photo && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-slate-900">
                        <CheckCircle size={8} className="text-white" />
                      </div>
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
      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPhoto.workerName}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {new Date(selectedPhoto.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative aspect-square md:aspect-[4/5] bg-black">
               {selectedPhoto.photo ? (
                 <img
                  src={getImageUrl(selectedPhoto.photo)}
                  className="w-full h-full object-contain"
                  alt="Attendance Selfie"
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                    <Camera size={64} strokeWidth={1} />
                    <p className="font-bold italic">Attendance photo missing for this session.</p>
                 </div>
               )}
            </div>

            <div className="p-6 bg-slate-800/50 grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clock In</p>
                  <p className="text-lg font-black text-green-500">{formatTime(selectedPhoto.startTime)}</p>
               </div>
               <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clock Out</p>
                  <p className="text-lg font-black text-slate-400">{formatTime(selectedPhoto.endTime)}</p>
               </div>
               <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Duration</p>
                    <p className="text-lg font-black text-white">{calculateHours(selectedPhoto.startTime, selectedPhoto.endTime)}</p>
                  </div>
                  <span className={`px-4 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${
                    selectedPhoto.status === 'completed'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {selectedPhoto.status}
                  </span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
