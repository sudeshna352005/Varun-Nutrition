import React, { useState, useEffect } from 'react';
import api from '../api';
import { Store, Users, MapPin, ClipboardCheck } from 'lucide-react';
import DashboardAnalytics from '../components/DashboardAnalytics';
import Skeleton from '../components/Skeleton';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    shops: 0,
    routes: 0,
    activeWorkers: 0,
    todayVisits: 0
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
        const [shopsRes, routesRes, attendanceRes, visitsRes, workersRes] = await Promise.all([
          api.get('/api/shops'),
          api.get('/api/routes'),
          api.get('/api/attendance'),
          api.get('/api/visits'),
          api.get('/api/workers')
        ]);

        const visits = visitsRes.data || [];
        const attendance = attendanceRes.data || [];
        const workers = workersRes.data || [];
        const shops = shopsRes.data || [];
        const routes = routesRes.data || [];

        const active = attendance.filter(a => a?.status === 'working').length;
        const today = new Date().toLocaleDateString();
        const todayVisitsCount = visits.filter(v => v?.timestamp && new Date(v.timestamp).toLocaleDateString() === today).length;

        setStats({
          shops: shops.length,
          routes: routes.length,
          activeWorkers: active,
          todayVisits: todayVisitsCount
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
    { name: 'Route Groups', value: stats.routes, icon: MapPin, color: 'bg-blue-500/20 text-blue-500' },
    { name: 'Active Workers', value: stats.activeWorkers, icon: Users, color: 'bg-purple-500/20 text-purple-500' },
    { name: 'Visits Today', value: stats.todayVisits, icon: ClipboardCheck, color: 'bg-orange-500/20 text-orange-500' },
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
    <div>
      <h1 className="text-4xl font-extrabold mb-8 text-white tracking-tight">Owner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-white">Quick Actions</h2>
          <div className="space-y-4">
            <a href="/shops" className="block w-full text-center py-4 bg-slate-800 text-green-500 rounded-xl font-bold hover:bg-slate-700 transition">Manage Shops</a>
            <a href="/routes" className="block w-full text-center py-4 bg-slate-800 text-blue-500 rounded-xl font-bold hover:bg-slate-700 transition">Configure Routes</a>
            <a href="/workers" className="block w-full text-center py-4 bg-slate-800 text-purple-500 rounded-xl font-bold hover:bg-slate-700 transition">Manage Workers</a>
          </div>
        </div>
        
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
