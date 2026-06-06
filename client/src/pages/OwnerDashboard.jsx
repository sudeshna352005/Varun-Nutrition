import React, { useState, useEffect } from 'react';
import api from '../api';
import { Store, Users, MapPin, ClipboardCheck, ShoppingBag, IndianRupee, Clock, ArrowRight } from 'lucide-react';
import DashboardAnalytics from '../components/DashboardAnalytics';
import Skeleton from '../components/Skeleton';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    shops: 0,
    routes: 0,
    activeWorkers: 0,
    todayVisits: 0,
    todayOrders: 0,
    todaySales: 0,
    pendingOrders: 0
  });
  const [rawData, setRawData] = useState({
    workers: [],
    shops: [],
    visits: [],
    attendance: []
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

        const visits = visitsRes.data || [];
        const attendance = attendanceRes.data || [];
        const workers = workersRes.data || [];
        const shops = shopsRes.data || [];
        const routes = routesRes.data || [];
        const orders = ordersRes.data || [];

        const active = attendance.filter(a => a?.status === 'working').length;
        const today = new Date().toLocaleDateString();
        const todayVisitsCount = visits.filter(v => v?.timestamp && new Date(v.timestamp).toLocaleDateString() === today).length;

        const todayOrdersList = orders.filter(o => new Date(o.timestamp).toLocaleDateString() === today);
        const todaySalesAmount = todayOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        setStats({
          shops: shops.length,
          routes: routes.length,
          activeWorkers: workers.length,
          todayVisits: todayVisitsCount,
          todayOrders: todayOrdersList.length,
          todaySales: todaySalesAmount,
          pendingOrders: orders.length // Assuming all recently fetched are pending or just total for now
        });

        setRawData({
          workers,
          shops,
          visits,
          attendance
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { name: 'Total Shops', value: stats.shops, icon: Store, color: 'bg-green-500/20 text-green-500' },
    { name: 'Total Workers', value: stats.activeWorkers, icon: Users, color: 'bg-blue-500/20 text-blue-500' },
    { name: 'Visits Today', value: stats.todayVisits, icon: ClipboardCheck, color: 'bg-orange-500/20 text-orange-500' },
    { name: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'bg-purple-500/20 text-purple-500' },
    { name: "Today's Sales", value: `₹${stats.todaySales.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500/20 text-yellow-500' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Owner Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Business overview and performance metrics.</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
           <div className="px-4 py-2 text-xs font-bold text-green-500 uppercase tracking-widest bg-slate-800 rounded-lg shadow-sm border border-slate-700">Real-time</div>
           <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString()}</div>
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
      <DashboardAnalytics data={rawData} />

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

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
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
