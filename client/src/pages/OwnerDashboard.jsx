import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../api';
import { Store, Users, MapPin, ClipboardCheck, ShoppingBag, IndianRupee, Clock, ArrowRight, Briefcase, Camera, Search, Filter, Download, AlertCircle, CheckCircle, Play, Package } from 'lucide-react';
import DashboardAnalytics from '../components/DashboardAnalytics';
import DateFilter from '../components/DateFilter';
import Skeleton from '../components/Skeleton';
import { isInRange, getRangeDates } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

const OwnerDashboard = () => {
  const [dateRange, setDateRange] = useState(getRangeDates('today'));
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [rawData, setRawData] = useState({
    workers: [],
    shops: [],
    visits: [],
    attendance: [],
    orders: [],
    routes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsRes, routesRes, attendanceRes, visitsRes, workersRes, ordersRes] = await Promise.all([
          api.get('/api/shops'),
          api.get('/api/routes'),
          api.get('/api/attendance'),
          api.get('/api/visits'),
          api.get('/api/workers'),
          api.get('/api/orders')
        ]);

        setRawData({
          workers: Array.isArray(workersRes.data) ? workersRes.data : [],
          shops: Array.isArray(shopsRes.data) ? shopsRes.data : [],
          visits: Array.isArray(visitsRes.data) ? visitsRes.data : [],
          attendance: Array.isArray(attendanceRes.data) ? attendanceRes.data : [],
          orders: Array.isArray(ordersRes.data) ? ordersRes.data : [],
          routes: Array.isArray(routesRes.data) ? routesRes.data : []
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const visitsArr = Array.isArray(rawData.visits) ? rawData.visits : [];
    const attendanceArr = Array.isArray(rawData.attendance) ? rawData.attendance : [];
    const ordersArr = Array.isArray(rawData.orders) ? rawData.orders : [];

    let visits = visitsArr.filter(v => v && v.timestamp && isInRange(v.timestamp, dateRange));
    let attendance = attendanceArr.filter(a => a && a.startTime && isInRange(a.startTime, dateRange));
    let orders = ordersArr.filter(o => o && o.timestamp && isInRange(o.timestamp, dateRange));

    if (selectedWorker) {
      visits = visits.filter(v => v && v.workerName === selectedWorker);
      attendance = attendance.filter(a => a && a.workerName === selectedWorker);
      orders = orders.filter(o => o && o.workerName === selectedWorker);
    }

    if (selectedRoute) {
      visits = visits.filter(v => v && v.routeName === selectedRoute);
      orders = orders.filter(o => o && o.routeName === selectedRoute);
    }

    return { ...rawData, visits, attendance, orders };
  }, [rawData, dateRange, selectedWorker, selectedRoute]);

  const stats = useMemo(() => {
    const ordersList = Array.isArray(filteredData.orders) ? filteredData.orders : [];
    const totalSales = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const attendanceList = Array.isArray(filteredData.attendance) ? filteredData.attendance : [];
    const activeAtSomePoint = new Set(attendanceList.map(a => a.workerName)).size;
    const visitsList = Array.isArray(filteredData.visits) ? filteredData.visits : [];

    return {
      shops: (rawData.shops || []).length,
      workers: (rawData.workers || []).length,
      activeWorkers: activeAtSomePoint,
      visits: visitsList.length,
      orders: ordersList.length,
      delivered: ordersList.filter(o => o.deliveryStatus === 'Delivered').length,
      sales: totalSales,
      pending: ordersList.filter(o => o.deliveryStatus === 'Pending').length
    };
  }, [filteredData, rawData.shops, rawData.workers]);

  const shopsNotVisited = useMemo(() => {
    const lastVisits = {};
    const visitsArr = Array.isArray(rawData.visits) ? rawData.visits : [];
    visitsArr.forEach(v => {
      const existing = lastVisits[v.shopName];
      if (!existing || new Date(v.timestamp) > new Date(existing)) {
        lastVisits[v.shopName] = v.timestamp;
      }
    });

    return (Array.isArray(rawData.shops) ? rawData.shops : [])
      .map(shop => ({
        ...shop,
        lastVisit: lastVisits[shop.name] || null,
        daysSince: lastVisits[shop.name]
          ? Math.floor((new Date() - new Date(lastVisits[shop.name])) / (1000 * 60 * 60 * 24))
          : 999
      }))
      .filter(s => s.daysSince > 7) // More than 7 days since last visit
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);
  }, [rawData.shops, rawData.visits]);

  const activityTimeline = useMemo(() => {
    const attendance = Array.isArray(filteredData.attendance) ? filteredData.attendance : [];
    const visits = Array.isArray(filteredData.visits) ? filteredData.visits : [];
    const orders = Array.isArray(filteredData.orders) ? filteredData.orders : [];

    const events = [];

    attendance.forEach(a => {
      if (a.startTime) {
        events.push({ ...a, type: 'attendance-start', id: `${a.id || a._id}-start`, timestamp: a.startTime });
      }
      if (a.endTime) {
        events.push({ ...a, type: 'attendance-end', id: `${a.id || a._id}-end`, timestamp: a.endTime });
      }
    });

    visits.forEach(v => {
      if (v.timestamp) {
        events.push({ ...v, type: 'visit', id: v.id || v._id, timestamp: v.timestamp });
      }
    });

    orders.forEach(o => {
      if (o.timestamp) {
        events.push({ ...o, type: 'order', id: o.id || o._id, timestamp: o.timestamp });
      }
      if (o.deliveryStatus === 'Delivered' && o.deliveredAt) {
        events.push({ ...o, type: 'delivery', id: `${o.id || o._id}-delivered`, timestamp: o.deliveredAt });
      }
    });

    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [filteredData]);

  const cards = [
    { name: 'Filtered Visits', value: stats.visits, icon: ClipboardCheck, color: 'bg-orange-500/20 text-orange-500' },
    { name: "Orders Received", value: stats.orders, icon: ShoppingBag, color: 'bg-purple-500/20 text-purple-500' },
    { name: "Orders Delivered", value: stats.delivered, icon: CheckCircle, color: 'bg-green-500/20 text-green-500' },
    { name: "Total Sales", value: `₹${stats.sales.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'Pending Orders', value: stats.pending, icon: Clock, color: 'bg-yellow-500/20 text-yellow-500' },
    { name: 'Active Workers', value: stats.activeWorkers, icon: Users, color: 'bg-blue-500/20 text-blue-500' },
  ];

  if (loading) return (
    <div className="space-y-10">
      <Skeleton className="h-12 w-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-[450px] w-full rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Owner Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Comprehensive business analytics and activity tracking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateFilter onRangeChange={setDateRange} />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-10 shadow-xl no-print">
        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Filter by Worker</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer"
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
              >
                <option value="">All Workers</option>
                {(Array.isArray(rawData.workers) ? rawData.workers : []).map(w => <option key={w.id || w._id} value={w.name}>{w.name}</option>)}
              </select>
           </div>
           <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Filter by Route</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer"
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
              >
                <option value="">All Routes</option>
                {(Array.isArray(rawData.routes) ? rawData.routes : []).map(r => <option key={r.id || r._id} value={r.name}>{r.name}</option>)}
              </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{card.name}</p>
                  <p className="text-3xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`${card.color.split(' ')[0]} p-4 rounded-xl ${card.color.split(' ')[1]}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Advanced Analytics Section */}
      <DashboardAnalytics data={filteredData} />

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <ArrowRight className="text-green-500" /> Quick Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Manage Shops', href: '/shops', desc: 'Add or edit outlets', color: 'border-green-500/20 hover:bg-green-500/5' },
            { label: 'Configure Routes', href: '/routes', desc: 'Route groups & assignments', color: 'border-blue-500/20 hover:bg-blue-500/5' },
            { label: 'Worker Center', href: '/workers', desc: 'Manage credentials & performance', color: 'border-purple-500/20 hover:bg-purple-500/5' },
            { label: 'Product Catalog', href: '/products', desc: 'Update prices & availability', color: 'border-orange-500/20 hover:bg-orange-500/5' },
          ].map(action => (
            <a
              key={action.href}
              href={action.href}
              className={`p-6 bg-slate-900 border ${action.color} rounded-2xl transition-all group hover:scale-[1.02] shadow-xl`}
            >
              <h3 className="font-bold text-white text-lg mb-1 group-hover:text-green-500 transition-colors">{action.label}</h3>
              <p className="text-slate-500 text-sm">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl h-full">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-white border-b border-slate-800 pb-4">
              <Clock className="text-green-500" /> Recent Activity Timeline
            </h2>

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-12 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar py-4">
              {(Array.isArray(activityTimeline) ? activityTimeline : []).map((item) => {
                let icon = <Clock size={16} />;
                let colorClass = 'bg-slate-500';
                let title = '';
                let details = null;

                const workerId = item.workerId || item.id || item._id; // Fallback if workerId not direct
                // Note: workers array is available in rawData.workers
                const workerObj = rawData.workers.find(w => w.name === item.workerName);
                const workerLink = workerObj ? `/worker/${workerObj.id || workerObj._id}` : null;

                switch(item.type) {
                  case 'attendance-start':
                    icon = <Play size={16} />;
                    colorClass = 'bg-purple-500';
                    title = 'START WORK';
                    details = (
                      <p className="text-sm text-slate-400">
                        Attendance marked by {workerLink ? <Link to={workerLink} className="font-bold text-white hover:text-green-500 transition-colors">{item.workerName}</Link> : <span className="font-bold text-white">{item.workerName}</span>}
                      </p>
                    );
                    break;
                  case 'attendance-end':
                    icon = <CheckCircle size={16} />;
                    colorClass = 'bg-green-500';
                    title = 'WORK COMPLETED';
                    details = (
                      <p className="text-sm text-slate-400">
                        {workerLink ? <Link to={workerLink} className="font-bold text-white hover:text-green-500 transition-colors">{item.workerName}</Link> : <span className="font-bold text-white">{item.workerName}</span>} finished for the day
                      </p>
                    );
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
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                          Visited by {workerLink ? <Link to={workerLink} className="text-slate-300 hover:text-green-500 transition-colors underline underline-offset-4 decoration-slate-800">{item.workerName}</Link> : item.workerName}
                        </p>
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
                          <p className="text-sm text-slate-300">Order placed at <span className="font-bold text-white">{item.shopName}</span></p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.totalQuantity} items • by {workerLink ? <Link to={workerLink} className="text-slate-400 hover:text-green-500 transition-colors">{item.workerName}</Link> : item.workerName}
                          </p>
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
                        <p className="text-sm text-slate-300">Delivered to <span className="font-bold text-white">{item.shopName}</span></p>
                        <p className="text-xs text-slate-500 mt-1">
                          Status marked as Delivered by {workerLink ? <Link to={workerLink} className="text-slate-400 hover:text-green-500 transition-colors">{item.workerName}</Link> : item.workerName}
                        </p>
                      </div>
                    );
                    break;
                }

                return (
                  <div key={item.id} className="relative pl-10 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-zinc-950 shadow-xl ${colorClass}`} />

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                       <h4 className={`text-xs font-black tracking-widest ${colorClass.replace('bg-', 'text-')} flex items-center gap-2`}>
                         {icon} {title}
                       </h4>
                       <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                         {new Date(item.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                       </span>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm group">
                      {details}
                    </div>
                  </div>
                );
              })}
              {activityTimeline.length === 0 && (
                <div className="text-center py-20">
                  <Clock className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-500 italic">No activity found for the selected period.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-1">
        
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
            <AlertCircle className="text-yellow-500" /> Shops Needing Visit
          </h2>
          <div className="space-y-4">
              {(Array.isArray(shopsNotVisited) ? shopsNotVisited : []).map((shop) => (
              <div key={shop.id || shop._id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white text-sm">{shop.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Last: {shop.lastVisit ? new Date(shop.lastVisit).toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${shop.daysSince > 14 ? 'text-red-500' : 'text-yellow-500'}`}>{shop.daysSince === 999 ? '∞' : shop.daysSince}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">Days</p>
                </div>
              </div>
            ))}
            {shopsNotVisited.length === 0 && <p className="text-slate-500 italic text-center py-4 text-sm">All shops recently visited.</p>}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default OwnerDashboard;
