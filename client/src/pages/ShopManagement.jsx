import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Plus, Edit2, Trash2, MapPin, Phone, ExternalLink, Search, Filter, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import { isInRange, getRangeDates } from '../utils/dateUtils';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [visits, setVisits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [visitFilter, setVisitFilter] = useState('all'); // 'all', 'visited', 'not-visited', 'ordered-week', 'no-orders-month'
  const [dateRange, setDateRange] = useState(getRangeDates('today'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    routeGroup: '',
    mapsLink: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, rRes, vRes, oRes] = await Promise.all([
        api.get('/api/shops'),
        api.get('/api/routes'),
        api.get('/api/visits'),
        api.get('/api/orders')
      ]);
      setShops(sRes.data || []);
      setRoutes(rRes.data || []);
      setVisits(vRes.data || []);
      setOrders(oRes.data || []);
    } catch (err) {
      console.error("Failed to fetch shops data", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingShop) {
      await api.put(`/api/shops/${editingShop.id}`, formData);
    } else {
      await api.post('/api/shops', formData);
    }
    setIsModalOpen(false);
    setEditingShop(null);
    setFormData({ name: '', address: '', phone: '', routeGroup: '', mapsLink: '' });
    fetchData();
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData(shop);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      await api.delete(`/api/shops/${id}`);
      fetchData();
    }
  };

  const isVisitedToday = (shopName) => {
    const today = new Date().toLocaleDateString();
    return visits.some(v => v.shopName === shopName && new Date(v.timestamp).toLocaleDateString() === today);
  };

  const filteredShops = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return shops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            shop.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoute = !selectedRoute || shop.routeGroup === selectedRoute;

      const visited = isVisitedToday(shop.name);
      const orderedThisWeek = orders.some(o => o.shopName === shop.name && new Date(o.timestamp) >= startOfWeek);
      const noOrdersMonth = !orders.some(o => o.shopName === shop.name && new Date(o.timestamp) >= startOfMonth);

      let matchesVisit = true;
      if (visitFilter === 'visited') matchesVisit = visited;
      if (visitFilter === 'not-visited') matchesVisit = !visited;
      if (visitFilter === 'ordered-week') matchesVisit = orderedThisWeek;
      if (visitFilter === 'no-orders-month') matchesVisit = noOrdersMonth;

      return matchesSearch && matchesRoute && matchesVisit;
    });
  }, [shops, searchTerm, selectedRoute, visitFilter, visits, orders]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Shop Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-green-600 text-zinc-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Shop
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Shop Name/Address..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 size-4 text-slate-500" />
          <select
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
          >
            <option value="">All Routes</option>
            {routes.map(r => <option key={r.id || r._id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap bg-slate-900 border border-slate-800 rounded-xl p-1 lg:col-span-2">
          {['all', 'visited', 'not-visited', 'ordered-week', 'no-orders-month'].map(f => (
            <button
              key={f}
              onClick={() => setVisitFilter(f)}
              className={`flex-1 min-w-[80px] py-1.5 text-[9px] uppercase font-bold rounded-lg transition-all ${visitFilter === f ? 'bg-green-600 text-slate-900' : 'text-slate-500 hover:text-white'}`}
            >
              {f.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {filteredShops.length === 0 ? (
        <div className="bg-slate-900 p-20 text-center rounded-2xl border-2 border-dashed border-slate-800">
          <Store className="w-16 h-16 mx-auto text-zinc-700 mb-6" />
          <p className="text-xl text-slate-500 font-medium">No shops added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredShops.map((shop) => (
            <div key={shop.id} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 relative group hover:border-slate-700 transition-all shadow-xl">
              <div className="absolute top-4 left-4">
                {isVisitedToday(shop.name) ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle size={10} /> Visited Today
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <XCircle size={10} /> Not Visited
                  </span>
                )}
              </div>
              <div className="absolute top-6 right-6 space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(shop)} className="text-blue-500 hover:text-blue-400 p-2 bg-slate-800 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(shop.id)} className="text-red-500 hover:text-red-400 p-2 bg-slate-800 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 pr-16">{shop.name}</h3>
              <div className="space-y-3 text-zinc-300">
                <p className="flex items-start text-sm"><MapPin className="w-4 h-4 mr-3 text-green-500 flex-shrink-0 mt-1" /> {shop.address}</p>
                <p className="flex items-center text-sm"><Phone className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" /> {shop.phone}</p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-slate-800 text-zinc-200 border border-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {shop.routeGroup}
                  </span>
                </div>
                {shop.mapsLink && (
                  <a
                    href={shop.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-500 hover:text-blue-400 text-sm font-medium mt-4 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Google Maps
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shop Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                  <textarea
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all h-24"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Route Group</label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none"
                    value={formData.routeGroup}
                    onChange={(e) => setFormData({ ...formData, routeGroup: e.target.value })}
                  >
                    <option value="" className="bg-slate-900">Select a route</option>
                    {routes.map(r => <option key={r.id} value={r.name} className="bg-slate-900">{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Google Maps Link</label>
                  <input
                    type="url"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={formData.mapsLink}
                    onChange={(e) => setFormData({ ...formData, mapsLink: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingShop(null); }}
                  className="flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-6 py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
                >
                  {editingShop ? 'Save Changes' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder for Lucide Store icon if it's not imported properly in my snippet
const Store = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
);

export default ShopManagement;
