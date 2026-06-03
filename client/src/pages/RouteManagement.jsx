import React, { useState, useEffect } from 'react';
import api from '../api';
import { MapPin, Plus, List } from 'lucide-react';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [shops, setShops] = useState([]);
  const [newRoute, setNewRoute] = useState('');

  useEffect(() => {
    fetchRoutes();
    fetchShops();
  }, []);

  const fetchRoutes = async () => {
    const res = await api.get('/api/routes');
    setRoutes(res.data);
  };

  const fetchShops = async () => {
    const res = await api.get('/api/shops');
    setShops(res.data);
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRoute) return;
    await api.post('/api/routes', { name: newRoute });
    setNewRoute('');
    fetchRoutes();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Route Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-white uppercase tracking-wider text-sm">Create New Route</h2>
            <form onSubmit={handleAddRoute} className="flex gap-3">
              <input
                type="text"
                placeholder="Route Name"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
              />
              <button className="bg-green-600 text-zinc-900 p-3 rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-green-500 uppercase tracking-wider text-sm">Route List</h2>
            <ul className="space-y-3">
              {routes.map(route => (
                <li key={route.id} className="flex items-center p-3 hover:bg-zinc-800 rounded-xl transition-colors border border-transparent hover:border-zinc-700 text-zinc-300">
                  <MapPin className="w-4 h-4 mr-3 text-green-500" />
                  {route.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-8 text-white">Shops by Route</h2>
            <div className="space-y-10">
              {routes.map(route => (
                <div key={route.id}>
                  <h3 className="font-bold text-blue-500 border-b border-zinc-800 pb-2 mb-4 flex items-center uppercase tracking-widest text-xs">
                    <List className="w-4 h-4 mr-2" /> {route.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shops.filter(s => s.routeGroup === route.name).length > 0 ? (
                      shops.filter(s => s.routeGroup === route.name).map(shop => (
                        <div key={shop.id} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all">
                          <p className="font-bold text-zinc-200">{shop.name}</p>
                          <p className="text-zinc-500 text-xs mt-1">{shop.address}</p>
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
