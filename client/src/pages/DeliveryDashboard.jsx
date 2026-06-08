import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Package, Search, Filter, Calendar, Check, X, Clock, ShoppingCart } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import { isInRange, getRangeDates } from '../utils/dateUtils';

const DeliveryDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(getRangeDates('today'));
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const deliveryStaffId = user.id || user._id;
      const response = await api.get(`/api/orders?deliveryStaffId=${deliveryStaffId}`);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch assigned orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await api.put(`/api/orders/${orderId}`, {
        deliveryStatus: 'Delivered',
        deliveredAt: new Date()
      });
      fetchOrders();
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

  if (loading) return <div className="text-center py-20 text-slate-500">Loading Assigned Deliveries...</div>;

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

      <div className="grid grid-cols-1 gap-6">
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
                onClick={() => handleMarkDelivered(order.id || order._id)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-zinc-900 rounded-xl text-sm font-black hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
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
    </div>
  );
};

export default DeliveryDashboard;
