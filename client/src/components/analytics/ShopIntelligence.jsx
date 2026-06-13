import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Cell as ReCell,
  PieChart, Pie, Legend
} from 'recharts';
import { Store, TrendingUp, AlertCircle, ShoppingBag, Target } from 'lucide-react';

const ShopIntelligence = ({ shops = [], visits = [], orders = [] }) => {
  const stats = useMemo(() => {
    if (!Array.isArray(shops)) return null;
    const shopMap = {};
    shops.forEach(s => {
      shopMap[s.name] = {
        name: s.name,
        visits: 0,
        orders: 0,
        revenue: 0,
        route: s.routeGroup
      };
    });

    visits.forEach(v => {
      if (shopMap[v.shopName]) shopMap[v.shopName].visits += 1;
    });

    orders.forEach(o => {
      if (shopMap[o.shopName]) {
        shopMap[o.shopName].orders += 1;
        shopMap[o.shopName].revenue += o.totalAmount || 0;
      }
    });

    const shopList = Object.values(shopMap);

    const mostVisited = [...shopList].sort((a, b) => b.visits - a.visits).slice(0, 5);
    const topRevenue = [...shopList].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const neverVisited = shops.filter(s => !visits.some(v => v.shopName === s.name));
    const visitedNoOrders = shopList.filter(s => s.visits > 0 && s.orders === 0);

    const conversionData = shopList
      .filter(s => s.visits > 0)
      .map(s => ({
        name: s.name,
        conversion: Math.round((s.orders / s.visits) * 100),
        visits: s.visits,
        orders: s.orders
      }))
      .sort((a, b) => b.conversion - a.conversion);

    const highConversion = conversionData.slice(0, 5);
    const lowConversion = conversionData.slice(-5).reverse();

    return {
      shopList, mostVisited, topRevenue,
      neverVisited, visitedNoOrders,
      highConversion, lowConversion
    };
  }, [shops, visits, orders]);

  const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6'];

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Conversion Leaders</p>
          <div className="mt-4 space-y-4">
            {stats.highConversion.slice(0, 3).map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-xs text-white font-medium truncate max-w-[120px]">{s.name}</span>
                <span className="text-xs font-bold text-green-500">{s.conversion}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Attention Needed</p>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Never Visited</span>
              <span className="text-xs font-bold text-red-500">{stats.neverVisited.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">No Conversion</span>
              <span className="text-xs font-bold text-orange-500">{stats.visitedNoOrders.length}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                  <Target size={24} />
               </div>
               <div>
                  <h4 className="text-white font-bold">Overall Visit Conversion</h4>
                  <p className="text-slate-500 text-xs">Targeting 60% order generation per visit</p>
               </div>
               <div className="ml-auto text-right">
                  <p className="text-2xl font-black text-white">
                    {visits.length > 0 ? Math.round((orders.length / visits.length) * 100) : 0}%
                  </p>
               </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <Store size={18} className="text-green-500" /> Visit Frequency Analysis
           </h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mostVisited}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                   <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                   />
                   <Bar dataKey="visits" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <TrendingUp size={18} className="text-blue-500" /> Revenue Contribution
           </h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie
                    data={stats.topRevenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                   >
                     {stats.topRevenue.map((entry, index) => (
                       <ReCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                   />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ShopIntelligence;
