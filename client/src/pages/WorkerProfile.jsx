import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api, { getImageUrl } from '../api';
import { User, Calendar, MapPin, Camera, Clock, TrendingUp, Briefcase, ChevronRight, Mail, ShoppingBag, Play, CheckCircle, Package, Store } from 'lucide-react';

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
  const completedSessions = useMemo(() => attendanceArr.filter(a => a?.status === 'completed').length, [attendanceArr]);
  const uniqueShops = useMemo(() => new Set(visitsArr.map(v => v?.shopName).filter(Boolean)).size, [visitsArr]);
  const totalSales = useMemo(() => ordersArr.reduce((sum, o) => sum + (o?.totalAmount || 0), 0), [ordersArr]);

  const activityTimeline = useMemo(() => {
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
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [attendanceArr, visitsArr, ordersArr]);

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
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Days</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">{completedSessions}</p>
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
                <span className="text-slate-300 font-medium">Total Working Days</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">{attendanceArr.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Total Shop Visits</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">{visitsArr.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Avg Visits / Day</span>
                <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  {attendanceArr.length > 0 ? (visitsArr.length / attendanceArr.length).toFixed(1) : 0}
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

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-12">
              {(Array.isArray(activityTimeline) ? activityTimeline : []).map((item) => {
                let icon = <Clock size={16} />;
                let colorClass = 'bg-slate-500';
                let title = '';
                let details = null;

                switch(item.type) {
                  case 'attendance-start':
                    icon = <Play size={16} />;
                    colorClass = 'bg-purple-500';
                    title = 'START WORK';
                    details = <p className="text-sm text-slate-400">Attendance marked by <span className="font-bold text-white">{worker?.name || 'Worker'}</span></p>;
                    break;
                  case 'attendance-end':
                    icon = <CheckCircle size={16} />;
                    colorClass = 'bg-green-500';
                    title = 'WORK COMPLETED';
                    details = <p className="text-sm text-slate-400"><span className="font-bold text-white">{worker?.name || 'Worker'}</span> finished for the day</p>;
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
                          <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                             <img src={getImageUrl(item.photo)} alt="Visit" className="w-full h-full object-cover" />
                          </div>
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

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                       <h4 className={`text-xs font-black tracking-widest ${colorClass.replace('bg-', 'text-')} flex items-center gap-2`}>
                         {icon} {title}
                       </h4>
                       <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                         {new Date(item.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                       </span>
                    </div>

                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-xl backdrop-blur-sm">
                      {details}
                    </div>
                  </div>
                );
              })}
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
