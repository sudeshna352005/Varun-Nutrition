import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Package, Search, Filter, Calendar, Check, X, Clock, ShoppingCart, MapPin, CheckCircle, ExternalLink, Info } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import { isInRange, getRangeDates } from '../utils/dateUtils';
import CameraCapture from '../components/CameraCapture';

const DeliveryDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(getRangeDates('today'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [isWorking, setIsWorking] = useState(false);
  const [completingOrder, setCompletingOrder] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);

  useEffect(() => {
    fetchData();
    checkWorkingStatus();
  }, []);

  const fetchData = async () => {
    try {
      const deliveryStaffId = user.id || user._id;
      const [ordersRes, shopsRes, routesRes] = await Promise.all([
        api.get(`/api/orders?deliveryStaffId=${deliveryStaffId}`),
        api.get(`/api/shops?workerId=${deliveryStaffId}`),
        api.get(`/api/routes?workerId=${deliveryStaffId}`)
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
    } catch (err) {
      console.error("Failed to fetch delivery data", err);
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

  const handleMarkDelivered = async () => {
    if (!deliveryPhoto) {
      alert('Visit proof photo is mandatory.');
      return;
    }

    try {
      const orderId = completingOrder.id || completingOrder._id;

      // 1. Log as a visit proof
      const formData = new FormData();
      formData.append('shopName', completingOrder.shopName);
      formData.append('workerName', user.name);
      formData.append('workerRole', user.role || 'Delivery Staff');
      formData.append('routeName', completingOrder.routeName);
      formData.append('notes', deliveryNotes || 'Order Delivered');
      formData.append('photo', deliveryPhoto);

      await api.post('/api/visits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. Update order status
      await api.put(`/api/orders/${orderId}`, {
        deliveryStatus: 'Delivered',
        deliveredAt: new Date(),
        notes: deliveryNotes
      });

      setCompletingOrder(null);
      setDeliveryNotes('');
      setDeliveryPhoto(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to update delivery status", err);
      alert("Failed to update delivery status: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = (order.shopName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.deliveryStatus === statusFilter;
      const matchesDate = isInRange(order.timestamp, dateRange);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.deliveryStatus === 'Pending').length,
      delivered: orders.filter(o => o.deliveryStatus === 'Delivered').length
    };
  }, [orders]);

  if (loading) return <div className="text-center py-20 text-slate-500">Loading Delivery Dashboard...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Package className="text-green-500" /> Delivery Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Manage your assigned shop deliveries.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
          <DateFilter onRangeChange={setDateRange} />

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Shop..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['all', 'Pending', 'Delivered'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status
                  ? 'bg-green-600 text-zinc-900 shadow-lg'
                  : 'text-slate-500 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><ShoppingCart size={20}/></div>
            <span className="text-3xl font-black text-white">{stats.total}</span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Assigned</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><Clock size={20}/></div>
            <span className="text-3xl font-black text-white">{stats.pending}</span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Deliveries</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><Check size={20}/></div>
            <span className="text-3xl font-black text-white">{stats.delivered}</span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Delivered Orders</p>
        </div>
      </div>

      {!isWorking && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start">
          <Info className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-500 text-sm">
            <strong className="font-bold uppercase tracking-wider text-xs block mb-1">Attendance Required</strong>
            Please go to the <a href="/worker-attendance" className="underline font-bold">Attendance</a> page and mark "Start Work" to enable delivery actions.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-green-500" /> Assigned Orders
          </h2>
        {filteredOrders.map((order) => (
          <div key={order.id || order._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{order.shopName}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    order.deliveryStatus === 'Delivered' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                  }`}>
                    {order.deliveryStatus}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span className="text-blue-400">Route: {order.routeName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(order.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-green-500">₹{order.totalAmount.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{order.totalQuantity} items</p>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-800 mb-6">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item</th>
                    <th className="px-4 py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-white">
                        {item.name} <span className="text-slate-500 text-xs">({item.packSize})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-300 font-bold">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {order.deliveryStatus === 'Pending' && (
              <button
                onClick={() => setCompletingOrder(order)}
                disabled={!isWorking}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-black transition-all shadow-lg ${
                  isWorking
                  ? 'bg-green-600 text-zinc-900 hover:bg-green-500 shadow-green-600/20'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Check size={18} /> MARK AS DELIVERED
              </button>
            )}

            {order.deliveryStatus === 'Delivered' && (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 text-xs font-bold uppercase tracking-widest">
                <Check size={16}/> Delivered on {new Date(order.deliveredAt || order.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        ))}

          {filteredOrders.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-20 text-center text-slate-500 italic">
              No deliveries found matching your filters.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-green-500" /> My Routes & Shops
          </h2>
          <div className="space-y-8">
            {(Array.isArray(routes) ? routes : []).map(route => {
              const routeShops = (Array.isArray(shops) ? shops : []).filter(s => s.routeGroup === route.name);
              if (routeShops.length === 0) return null;

              return (
                <div key={route.id || route._id} className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{route.name}</h3>
                  <div className="space-y-3">
                    {routeShops.map(shop => (
                      <div key={shop.id || shop._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-green-500 transition-colors">{shop.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{shop.address}</p>
                          </div>
                          {shop.mapsLink && (
                            <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-lg text-blue-500 hover:text-white transition-all">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {completingOrder && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 text-center">
              <h2 className="text-2xl font-bold text-white">Deliver Order</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{completingOrder.shopName}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delivery Notes</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 h-24 text-white outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any notes about the delivery..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </div>

              <CameraCapture
                onCapture={setDeliveryPhoto}
                label="Proof of Delivery"
                required
              />
            </div>

            <div className="p-6 border-t border-slate-800/50 flex gap-4">
              <button
                onClick={() => setCompletingOrder(null)}
                className="flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkDelivered}
                className="flex-[2] px-6 py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
