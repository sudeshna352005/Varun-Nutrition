import React, { useState, useEffect } from 'react';
import api from '../api';
import { Store, Users, MapPin, ClipboardCheck } from 'lucide-react';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    shops: 0,
    routes: 0,
    activeWorkers: 0,
    todayVisits: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [shops, routes, attendance, visits] = await Promise.all([
        api.get('/api/shops'),
        api.get('/api/routes'),
        api.get('/api/attendance'),
        api.get('/api/visits')
      ]);

      const active = attendance.data.filter(a => a.status === 'working').length;
      const today = new Date().toLocaleDateString();
      const todayVisits = visits.data.filter(v => new Date(v.timestamp).toLocaleDateString() === today).length;

      setStats({
        shops: shops.data.length,
        routes: routes.data.length,
        activeWorkers: active,
        todayVisits: todayVisits
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { name: 'Total Shops', value: stats.shops, icon: Store, color: 'bg-green-500/20 text-green-500' },
    { name: 'Route Groups', value: stats.routes, icon: MapPin, color: 'bg-blue-500/20 text-blue-500' },
    { name: 'Active Workers', value: stats.activeWorkers, icon: Users, color: 'bg-purple-500/20 text-purple-500' },
    { name: 'Visits Today', value: stats.todayVisits, icon: ClipboardCheck, color: 'bg-orange-500/20 text-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Owner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{card.name}</p>
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
      
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-white">Quick Actions</h2>
          <div className="space-y-4">
            <a href="/shops" className="block w-full text-center py-4 bg-zinc-800 text-green-500 rounded-xl font-bold hover:bg-zinc-700 transition">Manage Shops</a>
            <a href="/routes" className="block w-full text-center py-4 bg-zinc-800 text-blue-500 rounded-xl font-bold hover:bg-zinc-700 transition">Configure Routes</a>
            <a href="/workers" className="block w-full text-center py-4 bg-zinc-800 text-purple-500 rounded-xl font-bold hover:bg-zinc-700 transition">Manage Workers</a>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-white">System Status</h2>
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <p className="text-green-500 font-medium text-sm">All systems operational.</p>
          </div>
          <p className="mt-4 text-zinc-400 text-sm">Database connection active. All data is securely persisted.</p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
