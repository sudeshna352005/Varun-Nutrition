import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Package, Plus, Edit2, CheckCircle, XCircle, Save, X, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import { isInRange, getRangeDates } from '../utils/dateUtils';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(getRangeDates('last30'));
  const [perfFilter, setPerfFilter] = useState('all'); // 'all', 'top', 'bottom', 'no-orders'
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: '', packSize: '', defaultPrice: '', isActive: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/orders')
      ]);
      setProducts(pRes.data || []);
      setOrders(oRes.data || []);
    } catch (err) {
      console.error("Failed to fetch products data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productId = currentProduct.id || currentProduct._id;
      const productData = { ...currentProduct };
      delete productData.id;
      delete productData._id;

      if (productId) {
        await api.put(`/api/products/${productId}`, productData);
      } else {
        await api.post('/api/products', productData);
      }
      setIsModalOpen(false);
      setCurrentProduct({ name: '', packSize: '', defaultPrice: '', isActive: true });
      fetchData();
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Failed to save product: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleStatus = async (product) => {
    try {
      const productId = product.id || product._id;
      await api.put(`/api/products/${productId}`, { isActive: !product.isActive });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const productStats = useMemo(() => {
    const stats = {};
    const productsArr = Array.isArray(products) ? products : [];
    const ordersArr = Array.isArray(orders) ? orders : [];

    productsArr.forEach(p => stats[p.id || p._id] = { count: 0, total: 0 });

    ordersArr.filter(o => isInRange(o.timestamp, dateRange)).forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (stats[item.productId]) {
            stats[item.productId].count += item.quantity;
            stats[item.productId].total += item.total;
          }
        });
      }
    });
    return stats;
  }, [products, orders, dateRange]);

  const filteredProducts = useMemo(() => {
    const productsArr = Array.isArray(products) ? products : [];
    let list = productsArr.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (perfFilter === 'no-orders') {
      list = list.filter(p => (productStats[p.id || p._id]?.count || 0) === 0);
    } else if (perfFilter === 'top') {
      list = [...list].sort((a, b) => (productStats[b.id || b._id]?.count || 0) - (productStats[a.id || a._id]?.count || 0)).slice(0, 5);
    } else if (perfFilter === 'bottom') {
      list = [...list].sort((a, b) => (productStats[a.id || a._id]?.count || 0) - (productStats[b.id || b._id]?.count || 0)).slice(0, 5);
    }

    return list;
  }, [products, searchTerm, perfFilter, productStats]);

  if (loading) return <div className="text-center py-20 text-slate-500">Loading Products...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Package className="text-green-500" /> Product Management
        </h1>
        <button
          onClick={() => {
            setCurrentProduct({ name: '', packSize: '', defaultPrice: '', isActive: true });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-zinc-900 font-extrabold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        <DateFilter onRangeChange={setDateRange} />
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-3 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Product..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full lg:w-auto">
          {['all', 'top', 'bottom', 'no-orders'].map(f => (
            <button
              key={f}
              onClick={() => setPerfFilter(f)}
              className={`flex-1 px-4 py-2 text-[9px] uppercase font-bold rounded-lg transition-all ${perfFilter === f ? 'bg-green-600 text-slate-900' : 'text-slate-500 hover:text-white'}`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Qty Sold</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Val</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id || product._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-white">{product.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{product.packSize} • ₹{product.defaultPrice}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                     <span className="text-sm font-bold text-slate-200">{productStats[product.id || product._id]?.count || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                     <span className="text-sm font-bold text-green-500">₹{(productStats[product.id || product._id]?.total || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-widest border ${
                      product.isActive
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => toggleStatus(product)}
                        title={product.isActive ? "Deactivate" : "Activate"}
                        className={`p-2 rounded-lg transition-colors ${product.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                      >
                        {product.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{currentProduct.id || currentProduct._id ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  placeholder="e.g. Ragi Flour"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pack Size</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  value={currentProduct.packSize}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, packSize: e.target.value })}
                  placeholder="e.g. 1 Kg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Price (₹)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono"
                  value={currentProduct.defaultPrice}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, defaultPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-6 py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
