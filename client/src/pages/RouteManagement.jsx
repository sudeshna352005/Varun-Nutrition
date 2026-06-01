import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    const res = await axios.get('http://localhost:5000/api/routes');
    setRoutes(res.data);
  };

  const fetchShops = async () => {
    const res = await axios.get('http://localhost:5000/api/shops');
    setShops(res.data);
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRoute) return;
    await axios.post('http://localhost:5000/api/routes', { name: newRoute });
    setNewRoute('');
    fetchRoutes();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Route Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Route</h2>
            <form onSubmit={handleAddRoute} className="flex gap-2">
              <input
                type="text"
                placeholder="Route Name"
                className="flex-1 border rounded px-3 py-2"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
              />
              <button className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">Route List</h2>
            <ul className="space-y-2">
              {routes.map(route => (
                <li key={route.id} className="flex items-center p-2 hover:bg-gray-50 rounded border-b">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {route.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Shops by Route</h2>
            {routes.map(route => (
              <div key={route.id} className="mb-6 last:mb-0">
                <h3 className="font-bold text-blue-600 border-b pb-1 mb-3 flex items-center">
                  <List className="w-4 h-4 mr-2" /> {route.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shops.filter(s => s.routeGroup === route.name).length > 0 ? (
                    shops.filter(s => s.routeGroup === route.name).map(shop => (
                      <div key={shop.id} className="text-sm p-3 bg-gray-50 rounded border">
                        <p className="font-semibold">{shop.name}</p>
                        <p className="text-gray-500 text-xs">{shop.address}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No shops assigned to this route.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteManagement;
