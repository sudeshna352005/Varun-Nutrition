import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
        axios.get('http://localhost:5000/api/shops'),
        axios.get('http://localhost:5000/api/routes'),
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/visits')
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
    { name: 'Total Shops', value: stats.shops, icon: Store, color: 'bg-blue-500' },
    { name: 'Route Groups', value: stats.routes, icon: MapPin, color: 'bg-green-500' },
    { name: 'Active Workers', value: stats.activeWorkers, icon: Users, color: 'bg-purple-500' },
    { name: 'Visits Today', value: stats.todayVisits, icon: ClipboardCheck, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Owner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <a href="/shops" className="block w-full text-center py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition">Manage Shops</a>
            <a href="/routes" className="block w-full text-center py-3 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition">Configure Routes</a>
            <a href="/attendance" className="block w-full text-center py-3 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition">View Attendance</a>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <p className="text-gray-600">All systems operational. Data is currently being stored in-memory for this demo.</p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
