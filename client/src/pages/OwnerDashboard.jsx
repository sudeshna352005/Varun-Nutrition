import React, { useState, useEffect, useMemo } from 'react';
import api, { getImageUrl } from '../api';
import { Store, Users, MapPin, ClipboardCheck, ShoppingBag, IndianRupee, Clock, ArrowRight, Briefcase, Camera, Search, Filter, Download, AlertCircle, CheckCircle } from 'lucide-react';
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
      visits = visits.filter(v => v.workerName === selectedWorker);
      attendance = attendance.filter(a => a.workerName === selectedWorker);
      orders = orders.filter(o => o.workerName === selectedWorker);
    }

    if (selectedRoute) {
      visits = visits.filter(v => v.routeName === selectedRoute);
      orders = orders.filter(o => o.routeName === selectedRoute);
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
      delivered: ordersList.filter(o => o.status === 'delivered').length,
      sales: totalSales,
      pending: ordersList.filter(o => o.status === 'pending').length
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

    return rawData.shops
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

    const timeline = [
      ...attendance.map(a => ({ ...a, type: 'attendance', id: a.id || a._id, timestamp: a.startTime })),
      ...visits.map(v => ({ ...v, type: 'visit', id: v.id || v._id, timestamp: v.timestamp })),
      ...orders.map(o => ({ ...o, type: 'order', id: o.id || o._id, timestamp: o.timestamp }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return timeline.slice(0, 20); // Show last 20
  }, [filteredData]);

  const cards = [
    { name: 'Filtered Visits', value: stats.visits, icon: ClipboardCheck, color: 'bg-orange-500/20 text-orange-500' },
    { name: "Orders Received", value: stats.orders, icon: ShoppingBag, color: 'bg-purple-500/20 text-purple-500' },
    { name: "Orders Delivered", value: stats.delivered, icon: CheckCircle, color: 'bg-green-500/20 text-green-500' },
    { name: "Total Sales", value: `₹${stats.sales.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'Pending Orders', value: stats.pending, icon: Clock, color: 'bg-yellow-500/20 text-yellow-500' },
    { name: 'Active Workers', value: stats.activeWorkers, icon: Users, color: 'bg-blue-500/20 text-blue-500' },
  ];

  const exportDashboard = () => {
    const data = [
      ['Dashboard Statistics'],
      ['Metric', 'Value'],
      ['Total Visits', stats.visits],
      ['Orders Received', stats.orders],
      ['Total Sales', stats.sales],
      ['Active Workers', stats.activeWorkers],
      [],
      ['Recent Activity'],
      ['Timestamp', 'Type', 'Worker', 'Target/Shop', 'Amount'],
      ...activityTimeline.map(item => [
        new Date(item.timestamp).toLocaleString(),
        item.type.toUpperCase(),
        item.workerName,
        item.shopName || '-',
        item.totalAmount || '-'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Analytics");
    XLSX.writeFile(wb, `dashboard_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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
          <button onClick={exportDashboard} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-bold border border-slate-700">
            <Download size={18} /> Export Data
          </button>
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

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {(Array.isArray(activityTimeline) ? activityTimeline : []).map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative pl-8">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 shadow-md ${
                    item.type === 'attendance' ? 'bg-blue-500' : item.type === 'order' ? 'bg-purple-500' : 'bg-green-500'
                  }`} />

                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="text-blue-400 font-bold text-xs uppercase">{item.workerName}</span>
                    </div>
                    {item.type === 'order' && (
                      <span className="text-green-500 font-black text-sm">₹{item.totalAmount.toFixed(0)}</span>
                    )}
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                    {item.type === 'attendance' ? (
                      <div className="flex items-center gap-3">
                        <Camera size={14} className="text-blue-400" />
                        <p className="text-sm text-slate-300">Marked attendance: <span className="font-bold text-white capitalize">{item.status}</span></p>
                      </div>
                    ) : item.type === 'order' ? (
                      <div className="flex items-center gap-3">
                        <ShoppingBag size={14} className="text-purple-400" />
                        <p className="text-sm text-slate-300">Placed order at <span className="font-bold text-white">{item.shopName}</span> ({item.totalQuantity} items)</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-white font-bold">
                          <MapPin size={14} className="text-green-500" /> {item.shopName}
                        </div>
                        {item.photo && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700">
                             <img src={getImageUrl(item.photo)} alt="Visit" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {activityTimeline.length === 0 && <p className="text-slate-500 italic text-center py-10">No activity found for the selected period.</p>}
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
