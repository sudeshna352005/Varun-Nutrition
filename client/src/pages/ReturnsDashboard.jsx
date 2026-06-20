import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  RotateCcw, Search, Calendar, Filter,
  Download, ArrowRight, TrendingDown, Package,
  Store, User, MapPin
} from 'lucide-react';
import DateFilter from '../components/DateFilter';
import Skeleton from '../components/Skeleton';
import ReturnsAnalytics from '../components/analytics/ReturnsAnalytics';
import { isInRange, getRangeDates } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

const ReturnsDashboard = () => {
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getRangeDates('today'));
  const [searchTerm, setSearchQuery] = useState('');

  // Filters
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [returnsRes, ordersRes] = await Promise.all([
        api.get('/api/returns'),
        api.get('/api/orders')
      ]);
      setReturns(Array.isArray(returnsRes.data) ? returnsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (err) {
      console.error("Failed to fetch returns data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      const matchesSearch = (r.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = isInRange(r.createdAt, dateRange);
      const matchesShop = !selectedShop || r.shopName === selectedShop;
      const matchesRoute = !selectedRoute || r.routeName === selectedRoute;
      const matchesWorker = !selectedWorker || r.workerName === selectedWorker;
      const matchesReason = !selectedReason || r.reason === selectedReason;

      return matchesSearch && matchesDate && matchesShop && matchesRoute && matchesWorker && matchesReason;
    });
  }, [returns, searchTerm, dateRange, selectedShop, selectedRoute, selectedWorker, selectedReason]);

  const stats = useMemo(() => {
    const totalValue = filteredReturns.reduce((sum, r) => sum + (r.returnValue || 0), 0);
    const totalQty = filteredReturns.reduce((sum, r) => sum + (r.quantityReturned || 0), 0);

    // Most returned product
    const productCounts = {};
    filteredReturns.forEach(r => {
      productCounts[r.productName] = (productCounts[r.productName] || 0) + r.quantityReturned;
    });
    const mostReturned = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Return Rate (vs Delivered Orders in same period)
    const deliveredValue = orders
      .filter(o => o.deliveryStatus === 'Delivered' && isInRange(o.timestamp, dateRange))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const returnRate = deliveredValue > 0 ? ((totalValue / deliveredValue) * 100).toFixed(1) : 0;

    return {
      count: filteredReturns.length,
      value: totalValue,
      rate: returnRate,
      mostReturned
    };
  }, [filteredReturns, orders, dateRange]);

  const uniqueLists = useMemo(() => {
    return {
      shops: [...new Set(returns.map(r => r.shopName))],
      routes: [...new Set(returns.map(r => r.routeName))],
      workers: [...new Set(returns.map(r => r.workerName))],
      reasons: ['Damaged', 'Expired', 'Unsold Stock', 'Wrong Product', 'Packaging Issue', 'Customer Complaint', 'Other']
    };
  }, [returns]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredReturns);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Returns");
    XLSX.writeFile(wb, "VN_Returns_Report.xlsx");
  };

  if (loading) return (
    <div className="space-y-10">
      <Skeleton className="h-12 w-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <RotateCcw className="text-orange-500" /> Returns Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor and manage shop product returns.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateFilter onRangeChange={setDateRange} />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
           <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><RotateCcw size={20}/></div>
              <span className="text-3xl font-black text-white">{stats.count}</span>
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Returns</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
           <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><TrendingDown size={20}/></div>
              <span className="text-3xl font-black text-white">₹{stats.value.toLocaleString()}</span>
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Return Value</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
           <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Package size={20}/></div>
              <span className="text-3xl font-black text-white">{stats.rate}%</span>
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Return Rate %</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
           <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><ArrowRight size={20}/></div>
              <span className="text-lg font-black text-white truncate max-w-[150px]">{stats.mostReturned}</span>
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Most Returned Product</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <select
             className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
             value={selectedShop}
             onChange={e => setSelectedShop(e.target.value)}
           >
              <option value="">All Shops</option>
              {uniqueLists.shops.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <select
             className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
             value={selectedRoute}
             onChange={e => setSelectedRoute(e.target.value)}
           >
              <option value="">All Routes</option>
              {uniqueLists.routes.map(r => <option key={r} value={r}>{r}</option>)}
           </select>
           <select
             className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
             value={selectedWorker}
             onChange={e => setSelectedWorker(e.target.value)}
           >
              <option value="">All Workers</option>
              {uniqueLists.workers.map(w => <option key={w} value={w}>{w}</option>)}
           </select>
           <select
             className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
             value={selectedReason}
             onChange={e => setSelectedReason(e.target.value)}
           >
              <option value="">All Reasons</option>
              {uniqueLists.reasons.map(r => <option key={r} value={r}>{r}</option>)}
           </select>
        </div>
      </div>

      {/* Returns Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-slate-800/50">
                 <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Shop & Route</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Worker</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                 {filteredReturns.map((ret) => (
                   <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                         {new Date(ret.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-bold text-white">{ret.shopName}</div>
                         <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><MapPin size={10}/> {ret.routeName}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-medium text-slate-300">{ret.productName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-bold">{ret.quantityReturned}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{ret.reason}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-sm text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px]"><User size={12}/></div>
                            {ret.workerName}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-black text-green-500">
                         ₹{(ret.returnValue || 0).toLocaleString()}
                      </td>
                   </tr>
                 ))}
                 {filteredReturns.length === 0 && (
                   <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-slate-500 italic">No return records found.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* Analytics Section */}
      <ReturnsAnalytics returns={filteredReturns} />
    </div>
  );
};

export default ReturnsDashboard;
