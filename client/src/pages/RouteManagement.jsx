import React, { useState, useEffect } from 'react';
import api from '../api';
import { MapPin, Plus, List, Users, CheckCircle, Store } from 'lucide-react';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [shops, setShops] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [newRoute, setNewRoute] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rRes, sRes, wRes, vRes] = await Promise.all([
        api.get('/api/routes'),
        api.get('/api/shops'),
        api.get('/api/workers'),
        api.get('/api/visits')
      ]);
      setRoutes(rRes.data || []);
      setShops(sRes.data || []);
      setWorkers(wRes.data || []);
      setVisits(vRes.data || []);
    } catch (err) {
      console.error("Failed to fetch route data", err);
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRoute) return;
    await api.post('/api/routes', { name: newRoute });
    setNewRoute('');
    fetchData();
  };

  const getRouteCoverage = (routeName) => {
    const today = new Date().toLocaleDateString();
    const shopsArr = Array.isArray(shops) ? shops : [];
    const visitsArr = Array.isArray(visits) ? visits : [];

    const routeShops = shopsArr.filter(s => s.routeGroup === routeName);
    if (routeShops.length === 0) return 0;

    const visitedCount = routeShops.filter(s =>
      visitsArr.some(v => v.shopName === s.name && new Date(v.timestamp).toLocaleDateString() === today)
    ).length;

    return Math.round((visitedCount / routeShops.length) * 100);
  };

  const getAssignedWorkers = (routeName) => {
    const workersArr = Array.isArray(workers) ? workers : [];
    return workersArr.filter(w => w.assignedRoutes?.includes(routeName));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-white tracking-tight">Route Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1 space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-white uppercase tracking-wider text-sm">Create New Route</h2>
            <form onSubmit={handleAddRoute} className="flex gap-3">
              <input
                type="text"
                placeholder="Route Name"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
              />
              <button className="bg-green-600 text-zinc-900 p-3 rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-green-500 uppercase tracking-wider text-sm">Route List</h2>
            <ul className="space-y-3">
              {routes.map(route => {
                const assigned = getAssignedWorkers(route.name);
                const coverage = getRouteCoverage(route.name);
                return (
                  <li key={route.id} className="p-4 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700 group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-zinc-200 font-bold">
                        <MapPin className="w-4 h-4 mr-3 text-green-500" />
                        {route.name}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700 group-hover:border-green-500/30 group-hover:text-green-500 transition-colors">
                        {(Array.isArray(shops) ? shops : []).filter(s => s.routeGroup === route.name).length} Shops
                      </span>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <Users size={12} className="text-blue-500" />
                        {assigned.length > 0 ? assigned.map(w => w.name).join(', ') : 'No workers assigned'}
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle size={10} className="text-green-500" /> Today's Coverage
                          </span>
                          <span className="text-xs font-black text-white">{coverage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 border border-slate-700 overflow-hidden">
                          <div
                            className="bg-green-500 h-full transition-all duration-500"
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-8 text-white">Shops by Route</h2>
            <div className="space-y-10">
              {routes.map(route => (
                <div key={route.id}>
                  <h3 className="font-bold text-blue-500 border-b border-slate-800 pb-2 mb-4 flex items-center uppercase tracking-widest text-xs">
                    <List className="w-4 h-4 mr-2" /> {route.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Array.isArray(shops) ? shops : []).filter(s => s.routeGroup === route.name).length > 0 ? (
                      (Array.isArray(shops) ? shops : []).filter(s => s.routeGroup === route.name).map(shop => (
                        <div key={shop.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                          <p className="font-bold text-zinc-200">{shop.name}</p>
                          <p className="text-slate-500 text-xs mt-1">{shop.address}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-600 italic">No shops assigned to this route.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteManagement;
