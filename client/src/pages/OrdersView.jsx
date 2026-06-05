import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Search, Filter, Calendar, Edit2, Check, X, Plus } from 'lucide-react';

const OrdersView = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const isOwner = user?.role === 'owner';
      const params = isOwner ? {} : { workerId: user.id || user._id };

      const [ordersRes, shopsRes, routesRes, productsRes] = await Promise.all([
        api.get('/api/orders', { params }),
        api.get('/api/shops'),
        api.get('/api/routes'),
        api.get('/api/products')
      ]);

      setOrders(ordersRes.data || []);
      setShops(shopsRes.data || []);
      setRoutes(routesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch orders data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShop = !selectedShop || order.shopName === selectedShop;
    const matchesRoute = !selectedRoute || order.routeName === selectedRoute;
    const matchesDate = !selectedDate || new Date(order.timestamp).toLocaleDateString() === new Date(selectedDate).toLocaleDateString();
    return matchesSearch && matchesShop && matchesRoute && matchesDate;
  });

  const handleUpdateOrder = async () => {
    try {
      const orderId = editingOrder.id || editingOrder._id;
      const totalAmount = editingOrder.items.reduce((sum, i) => sum + i.total, 0);
      const totalQuantity = editingOrder.items.reduce((sum, i) => sum + i.quantity, 0);

      const updatedOrderData = { ...editingOrder, totalAmount, totalQuantity };
      delete updatedOrderData.id;
      delete updatedOrderData._id;

      await api.put(`/api/orders/${orderId}`, updatedOrderData);
      setEditingOrder(null);
      fetchData();
    } catch (err) {
      console.error("Failed to update order", err);
      alert("Failed to update order: " + (err.response?.data?.message || err.message));
    }
  };

  const updateEditingItem = (idx, field, value) => {
    const items = [...editingOrder.items];
    const item = { ...items[idx] };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value || p._id === value);
      item.productId = value;
      item.name = prod.name;
      item.packSize = prod.packSize;
      item.price = prod.defaultPrice;
    } else {
      item[field] = value;
    }

    item.total = item.quantity * item.price;
    items[idx] = item;
    setEditingOrder({ ...editingOrder, items });
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading Orders...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ShoppingCart className="text-green-500" /> {user.role === 'owner' ? 'All Orders' : 'My Orders'}
        </h1>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Shop/Worker..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-green-500"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
          >
            <option value="">All Shops</option>
            {shops.map(s => <option key={s.id || s._id} value={s.name}>{s.name}</option>)}
          </select>
          {user.role === 'owner' && (
            <select
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-green-500"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
            >
              <option value="">All Routes</option>
              {routes.map(r => <option key={r.id || r._id} value={r.name}>{r.name}</option>)}
            </select>
          )}
          <input
            type="date"
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-green-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id || order._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{order.shopName}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span className="text-blue-400">{order.workerName}</span>
                  <span>•</span>
                  <span>{order.routeName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(order.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Order Total</p>
                <p className="text-2xl font-black text-green-500">₹{order.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-white">
                        {item.name} <span className="text-slate-500 text-xs">({item.packSize})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-300">₹{item.price}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-500 font-bold">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {user.role === 'worker' && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setEditingOrder(JSON.parse(JSON.stringify(order)))}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-blue-400 rounded-lg text-sm font-bold hover:bg-slate-700 transition-all"
                >
                  <Edit2 size={16} /> Edit Order
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-20 text-center text-slate-500 italic">
            No orders found matching your filters.
          </div>
        )}
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Edit Order: {editingOrder.shopName}</h2>
              <button onClick={() => setEditingOrder(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Items</p>
                <button
                  onClick={() => setEditingOrder({ ...editingOrder, items: [...editingOrder.items, { productId: '', name: '', packSize: '', quantity: 1, price: 0, total: 0 }] })}
                  className="text-xs font-bold text-green-500 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {editingOrder.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700 relative">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Product</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={item.productId}
                      onChange={(e) => updateEditingItem(idx, 'productId', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.packSize})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={item.quantity}
                      onChange={(e) => updateEditingItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={item.price}
                      onChange={(e) => updateEditingItem(idx, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    onClick={() => setEditingOrder({ ...editingOrder, items: editingOrder.items.filter((_, i) => i !== idx) })}
                    className="absolute -right-2 -top-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700 mb-8">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total Amount</p>
              <p className="text-3xl font-black text-green-500">₹{editingOrder.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEditingOrder(null)}
                className="flex-1 px-6 py-4 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrder}
                className="flex-[2] px-6 py-4 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Check size={20} /> Update Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
