import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api, { getImageUrl } from '../api';
import { User, Calendar, MapPin, Camera, Clock, TrendingUp, Briefcase, ChevronRight, Mail, ShoppingBag, Play, CheckCircle, Package, Store, X, Eye } from 'lucide-react';

const WorkerProfile = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [visits, setVisits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const workersRes = await api.get('/api/workers');
        const workersArr = Array.isArray(workersRes.data) ? workersRes.data : [];
        const currentWorker = workersArr.find(w => String(w.id || w._id) === String(id));

        if (currentWorker) {
          setWorker(currentWorker);
          const [attendanceRes, visitsRes, ordersRes] = await Promise.all([
            api.get('/api/attendance'),
            api.get(`/api/visits?workerName=${currentWorker.name}`),
            api.get(`/api/orders?workerName=${currentWorker.name}`)
          ]);
          const att = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
          setAttendance(att.filter(a => a?.workerName === currentWorker.name));
          setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
          setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        }
      } catch (err) {
        console.error("Error fetching worker profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const visitsArr = useMemo(() => Array.isArray(visits) ? visits : [], [visits]);
  const attendanceArr = useMemo(() => Array.isArray(attendance) ? attendance : [], [attendance]);
  const ordersArr = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

  const totalVisits = visitsArr.length;
  const uniqueWorkingDays = useMemo(() => {
    const dates = attendanceArr
      .filter(a => a.status === 'completed')
      .map(a => new Date(a.startTime).toDateString());
    return new Set(dates).size;
  }, [attendanceArr]);
  const uniqueShops = useMemo(() => new Set(visitsArr.map(v => v?.shopName).filter(Boolean)).size, [visitsArr]);
  const totalSales = useMemo(() => ordersArr.reduce((sum, o) => sum + (o?.totalAmount || 0), 0), [ordersArr]);

  const groupedActivity = useMemo(() => {
    const events = [];
    attendanceArr.forEach(a => {
      if (a.startTime) events.push({ ...a, type: 'attendance-start', id: `${a.id || a._id}-start`, timestamp: a.startTime });
      if (a.endTime) events.push({ ...a, type: 'attendance-end', id: `${a.id || a._id}-end`, timestamp: a.endTime });
    });
    visitsArr.forEach(v => {
      if (v.timestamp) events.push({ ...v, type: 'visit', id: v.id || v._id, timestamp: v.timestamp });
    });
    ordersArr.forEach(o => {
      if (o.timestamp) events.push({ ...o, type: 'order', id: o.id || o._id, timestamp: o.timestamp });
      if (o.deliveryStatus === 'Delivered' && o.deliveredAt) {
        events.push({ ...o, type: 'delivery', id: `${o.id || o._id}-delivered`, timestamp: o.deliveredAt });
      }
    });

    // Sort events in workflow order
    const typeOrder = {
      'attendance-start': 1,
      'visit': 2,
      'order': 3,
      'delivery': 4,
      'attendance-end': 5
    };

    const sortedEvents = events.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      if (dateA.toDateString() !== dateB.toDateString()) {
        return dateA - dateB;
      }
      return typeOrder[a.type] - typeOrder[b.type];
    });

    // Group by date
    const groups = {};
    sortedEvents.forEach(e => {
      const date = new Date(e.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return groups;
  }, [attendanceArr, visitsArr, ordersArr]);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Early returns must come AFTER all hooks (useState, useEffect, useMemo)
  if (loading) return <div className="text-center py-20 text-slate-500">Loading profile...</div>;
  if (!worker) return <div className="text-center py-20 text-red-500 italic">Worker not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header Profile Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 mb-8 shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-green-500/20">
            <User size={48} strokeWidth={2.5} />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tighter">{worker.name}</h1>
            <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 font-medium">
              <Mail size={16} className="text-green-500" /> {worker.username}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Visits</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">{totalVisits}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Working Days</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">{uniqueWorkingDays}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Shops</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">{uniqueShops}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700 shadow-inner">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Sales</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">₹{totalSales.toLocaleString()}</p>
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
                <span className="text-slate-300 font-medium">Unique Working Days</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">{uniqueWorkingDays}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Total Shop Visits</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">{visitsArr.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Avg Visits / Day</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  {uniqueWorkingDays > 0 ? (visitsArr.length / uniqueWorkingDays).toFixed(1) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Sales Per Day</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  ₹{uniqueWorkingDays > 0 ? (totalSales / uniqueWorkingDays).toFixed(0) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Total Sales</span>
                <span className="font-bold text-green-500 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">₹{totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Avg Order Value</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  ₹{ordersArr.length > 0 ? (totalSales / ordersArr.length).toFixed(0) : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Calendar className="text-green-500" /> Recent Attendance
            </h2>
            <div className="space-y-3">
              {(Array.isArray(attendance) ? attendance : []).slice(0, 5).map(a => (
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

            <div className="space-y-12">
              {Object.keys(groupedActivity).length === 0 && (
                <div className="text-slate-500 italic py-10 text-center">No recent activity recorded.</div>
              )}
              {Object.keys(groupedActivity).map(date => (
                <div key={date} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-800"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/50 px-3 py-1 rounded-full border border-slate-800">
                      {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="h-px flex-1 bg-slate-800"></div>
                  </div>

                  <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-4">
                    {groupedActivity[date].map((item) => {
                      let icon = <Clock size={16} />;
                      let colorClass = 'bg-slate-500';
                      let title = '';
                      let details = null;

                      switch(item.type) {
                        case 'attendance-start':
                          icon = <Play size={16} />;
                          colorClass = 'bg-purple-500';
                          title = 'START WORK';
                          details = (
                            <div className="flex items-center justify-between">
                               <p className="text-sm text-slate-400">Attendance marked at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               {item.photo && (
                                 <button onClick={() => setSelectedPhoto(item)} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-green-500 transition-all">
                                   <img src={getImageUrl(item.photo)} className="w-full h-full object-cover" alt="Selfie" />
                                 </button>
                               )}
                            </div>
                          );
                          break;
                        case 'attendance-end':
                          icon = <CheckCircle size={16} />;
                          colorClass = 'bg-green-500';
                          title = 'WORK COMPLETED';
                          details = <p className="text-sm text-slate-400">Shift ended at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>;
                          break;
                        case 'visit':
                          icon = <Store size={16} />;
                          colorClass = 'bg-blue-500';
                          title = 'SHOP VISITED';
                          details = (
                            <div className="space-y-3">
                              <p className="text-sm text-slate-300 font-bold flex items-center gap-2">
                                <MapPin size={14} className="text-green-500" /> {item.shopName}
                              </p>
                              {item.notes && (
                                <div className="relative pl-4 border-l-2 border-slate-800 py-1">
                                  <p className="text-sm text-slate-300 italic">"{item.notes}"</p>
                                </div>
                              )}
                              {item.photo && (
                                <button onClick={() => setSelectedPhoto(item)} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:border-green-500 transition-all">
                                   <img src={getImageUrl(item.photo)} alt="Visit" className="w-full h-full object-cover" />
                                </button>
                              )}
                            </div>
                          );
                          break;
                        case 'order':
                          icon = <ShoppingBag size={16} />;
                          colorClass = 'bg-orange-500';
                          title = 'ORDER CREATED';
                          details = (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm text-slate-300 font-bold">Order placed at {item.shopName}</p>
                                <p className="text-xs text-slate-500 mt-1">{item.totalQuantity} items</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-lg font-black text-green-500">₹{(item.totalAmount || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                          break;
                        case 'delivery':
                          icon = <Package size={16} />;
                          colorClass = 'bg-green-600';
                          title = 'DELIVERY COMPLETED';
                          details = (
                            <div>
                              <p className="text-sm text-slate-300 font-bold">Delivered to {item.shopName}</p>
                              <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Status: {item.deliveryStatus}</p>
                            </div>
                          );
                          break;
                      }

                      return (
                        <div key={item.id} className="relative pl-10">
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-zinc-950 shadow-xl ${colorClass}`} />

                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                             <h4 className={`text-[10px] font-black tracking-widest ${colorClass.replace('bg-', 'text-')} flex items-center gap-2`}>
                               {icon} {title}
                             </h4>
                             <span className="text-[10px] font-bold text-slate-600">
                               {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>

                          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-xl backdrop-blur-sm">
                            {details}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPhoto.type === 'visit' ? selectedPhoto.shopName : worker.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {new Date(selectedPhoto.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                  alt="Activity Proof"
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                    <Camera size={64} strokeWidth={1} />
                    <p className="font-bold italic">Photo missing for this activity.</p>
                 </div>
               )}
            </div>

            <div className="p-6 bg-slate-800/50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Activity Type</p>
                  <p className="text-lg font-black text-white">{selectedPhoto.type.replace('-', ' ').toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Captured</p>
                  <p className="text-lg font-black text-green-500">{new Date(selectedPhoto.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;
