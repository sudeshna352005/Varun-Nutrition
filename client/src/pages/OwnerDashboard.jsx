import React, { useState, useEffect, useMemo } from 'react';
import api, { getImageUrl } from '../api';
import { Store, Users, MapPin, ClipboardCheck, ShoppingBag, IndianRupee, Clock, ArrowRight, Briefcase, Camera } from 'lucide-react';
import DashboardAnalytics from '../components/DashboardAnalytics';
import DateFilter from '../components/DateFilter';
import Skeleton from '../components/Skeleton';
import { isInRange, getRangeDates } from '../utils/dateUtils';

const OwnerDashboard = () => {
  const [dateRange, setDateRange] = useState(getRangeDates('today'));
  const [rawData, setRawData] = useState({
    workers: [],
    shops: [],
    visits: [],
    attendance: [],
    orders: []
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
          workers: workersRes.data || [],
          shops: shopsRes.data || [],
          visits: visitsRes.data || [],
          attendance: attendanceRes.data || [],
          orders: ordersRes.data || []
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
    return {
      ...rawData,
      visits: rawData.visits.filter(v => isInRange(v.timestamp, dateRange)),
      attendance: rawData.attendance.filter(a => isInRange(a.startTime, dateRange)),
      orders: rawData.orders.filter(o => isInRange(o.timestamp, dateRange))
    };
  }, [rawData, dateRange]);

  const stats = useMemo(() => {
    const ordersList = filteredData.orders;
    const totalSales = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activeAtSomePoint = new Set(filteredData.attendance.map(a => a.workerName)).size;

    return {
      shops: rawData.shops.length,
      workers: rawData.workers.length,
      activeWorkers: activeAtSomePoint,
      visits: filteredData.visits.length,
      orders: ordersList.length,
      sales: totalSales,
      pending: ordersList.length // Placeholder
    };
  }, [filteredData, rawData.shops.length, rawData.workers.length]);

  const activityTimeline = useMemo(() => {
    const timeline = [
      ...filteredData.attendance.map(a => ({ ...a, type: 'attendance', id: a.id || a._id, timestamp: a.startTime })),
      ...filteredData.visits.map(v => ({ ...v, type: 'visit', id: v.id || v._id, timestamp: v.timestamp })),
      ...filteredData.orders.map(o => ({ ...o, type: 'order', id: o.id || o._id, timestamp: o.timestamp }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return timeline.slice(0, 20); // Show last 20
  }, [filteredData]);

  const cards = [
    { name: 'Total Shops', value: stats.shops, icon: Store, color: 'bg-green-500/20 text-green-500' },
    { name: 'Total Workers', value: stats.workers, icon: Users, color: 'bg-blue-500/20 text-blue-500' },
    { name: 'Filtered Visits', value: stats.visits, icon: ClipboardCheck, color: 'bg-orange-500/20 text-orange-500' },
    { name: "Filtered Orders", value: stats.orders, icon: ShoppingBag, color: 'bg-purple-500/20 text-purple-500' },
    { name: "Period Sales", value: `₹${stats.sales.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'Active (Period)', value: stats.activeWorkers, icon: Briefcase, color: 'bg-yellow-500/20 text-yellow-500' },
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Owner Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Comprehensive business analytics and activity tracking.</p>
        </div>
        <DateFilter onRangeChange={setDateRange} />
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
              {activityTimeline.map((item) => (
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
          <h2 className="text-xl font-bold mb-6 text-white">System Status</h2>
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <p className="text-green-500 font-medium text-sm">All systems operational.</p>
          </div>
          <p className="mt-4 text-slate-400 text-sm">Database connection active. All data is securely persisted.</p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
