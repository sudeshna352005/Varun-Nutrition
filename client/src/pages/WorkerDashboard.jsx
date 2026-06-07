import React, { useState, useEffect } from 'react';
import api from '../api';
import { MapPin, CheckCircle, ChevronRight, MessageSquare, ExternalLink, Info, Search, Plus, X } from 'lucide-react';
import Skeleton from '../components/Skeleton';

const WorkerDashboard = ({ user }) => {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [createOrder, setCreateOrder] = useState(false);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const assignedRoutes = user.assignedRoutes || [];

  useEffect(() => {
    fetchData();
    checkWorkingStatus();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedShop]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const workerId = user.id || user._id;
      const [shopsRes, routesRes, visitsRes, productsRes] = await Promise.all([
        api.get(`/api/shops?workerId=${workerId}`),
        api.get(`/api/routes?workerId=${workerId}`),
        api.get(`/api/visits?workerName=${user.name}`),
        api.get('/api/products')
      ]);
    setShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
    setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
    setProducts(Array.isArray(productsRes.data) ? productsRes.data.filter(p => p.isActive) : []);
    const visits = Array.isArray(visitsRes.data) ? visitsRes.data : [];
      setVisitHistory(visits);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const checkWorkingStatus = async () => {
    try {
      const res = await api.get('/api/attendance');
      const attendanceArr = Array.isArray(res.data) ? res.data : [];
      const active = attendanceArr.find(a => a.workerName === user.name && a.status === 'working');
      setIsWorking(!!active);
    } catch (err) {
      console.error("Failed to check working status", err);
    }
  };

  const handleVisit = async () => {
    if (!isWorking) {
      alert('You must mark start work in Attendance before visiting shops.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('shopName', selectedShop.name);
      formData.append('workerName', user.name);
      formData.append('notes', notes);

      if (photo) {
        formData.append('photo', photo);
      }

      // Save visit
      await api.post('/api/visits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Save order if requested
      if (createOrder && orderItems.length > 0) {
        const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

        await api.post('/api/orders', {
          workerName: user.name,
          workerId: user.id || user._id,
          shopName: selectedShop.name,
          routeName: selectedShop.routeGroup,
          items: orderItems,
          totalQuantity,
          totalAmount,
          notes
        });
      }

      console.log("Visit/Order saved");
      setSelectedShop(null);
      setNotes('');
      setPhoto(null);
      setCreateOrder(false);
      setOrderItems([]);
      await fetchData();
    } catch (err) {
      console.error("Failed to save visit", err);
      alert("Error saving visit. Please try again.");
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', name: '', packSize: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];
    const item = { ...newItems[index] };

    if (field === 'productId') {
      const product = products.find(p => p.id === value || p._id === value);
      item.productId = value;
      item.name = product.name;
      item.packSize = product.packSize;
      item.price = product.defaultPrice;
    } else {
      item[field] = value;
    }

    item.total = item.quantity * item.price;
    newItems[index] = item;
    setOrderItems(newItems);
  };

  const hasVisitedToday = (shopName) => {
    const today = new Date().toLocaleDateString();
    const visitsArr = Array.isArray(visitHistory) ? visitHistory : [];
    return visitsArr.some(v => v.shopName === shopName && new Date(v.timestamp).toLocaleDateString() === today);
  };

  if (loading) return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-12 w-80 rounded-xl" />
          <Skeleton className="h-5 w-64 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full md:w-80 rounded-xl" />
      </div>
      <div className="space-y-12">
        {[1,2].map(i => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(j => <Skeleton key={j} className="h-32 rounded-2xl" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome, {user.name}</h1>
          <p className="text-slate-500">Here are your assigned routes and shops for today.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search routes or shops..."
            className="pl-12 block w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder-slate-600 shadow-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!isWorking && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-8 flex items-start">
          <Info className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-500 text-sm">
            <strong className="font-bold uppercase tracking-wider text-xs block mb-1">Attendance Required</strong>
            Please go to the <a href="/worker-attendance" className="underline font-bold">Attendance</a> page and mark "Start Work" to enable shop visits.
          </p>
        </div>
      )}

      <div className="space-y-12">
        {(Array.isArray(routes) ? routes : [])
          .filter(route => {
            const routeMatches = (route.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const shopsArr = Array.isArray(shops) ? shops : [];
            const shopMatches = shopsArr.some(s => s.routeGroup === route.name && (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
            return routeMatches || shopMatches;
          })
          .map(route => {
          const shopsArr = Array.isArray(shops) ? shops : [];
          let routeShops = shopsArr.filter(s => s.routeGroup === route.name);

          if (searchQuery) {
            const routeMatches = route.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!routeMatches) {
               routeShops = routeShops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }
          }

          if (routeShops.length === 0) return null;

          return (
            <div key={route.id}>
              <h2 className="text-xl font-bold text-green-500 flex items-center mb-6">
                <MapPin className="w-6 h-6 mr-2" /> {route.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routeShops.map(shop => (
                  <div 
                    key={shop.id} 
                    className={`bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex justify-between items-center transition-all ${
                      hasVisitedToday(shop.name) ? 'opacity-40' : 'hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{shop.name}</h3>
                      <p className="text-sm text-slate-500 mb-3">{shop.address}</p>
                      {shop.mapsLink && (
                        <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400 flex items-center transition-colors">
                          <ExternalLink className="w-3 h-3 mr-1" /> View Map
                        </a>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {hasVisitedToday(shop.name) ? (
                        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Visited</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedShop(shop)}
                          disabled={!isWorking}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                            isWorking 
                            ? 'bg-green-600 text-zinc-900 hover:bg-green-500 shadow-lg shadow-green-600/20'
                            : 'bg-slate-800 text-zinc-600 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          Mark Visit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedShop && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/50">
              <h2 className="text-2xl font-bold mb-1 text-white">Visit: {selectedShop.name}</h2>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Log visit details</p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <textarea
                placeholder="e.g., Stock checked, order placed for 50 units."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 h-32 focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-zinc-600 transition-all"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-all cursor-pointer"
                />
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="size-5 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500/20"
                    checked={createOrder}
                    onChange={(e) => setCreateOrder(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Create Order</span>
                </label>

                {createOrder && (
                  <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Items</p>
                      <button
                        onClick={addOrderItem}
                        type="button"
                        className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Product
                      </button>
                    </div>

                    {orderItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <select
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-green-500"
                            value={item.productId}
                            onChange={(e) => updateOrderItem(idx, 'productId', e.target.value)}
                          >
                            <option value="">Select Product</option>
                            {products.map(p => (
                              <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.packSize})</option>
                            ))}
                          </select>
                          <button onClick={() => removeOrderItem(idx)} className="text-red-500 p-1 hover:bg-red-500/10 rounded">
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Qty</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Price</label>
                            <input
                              type="number"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                              value={item.price}
                              onChange={(e) => updateOrderItem(idx, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total</label>
                            <div className="w-full py-1 text-xs font-bold text-green-500">₹{item.total.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {orderItems.length > 0 && (
                      <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400">Total Amount</p>
                        <p className="text-lg font-black text-green-500">₹{orderItems.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-slate-800/50">
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedShop(null)}
                  className="flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVisit}
                  className="flex-[2] px-6 py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Finish Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
