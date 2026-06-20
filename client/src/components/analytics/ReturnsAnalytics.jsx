import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line
} from 'recharts';
import { RotateCcw, TrendingDown, Package, MapPin } from 'lucide-react';

const ReturnsAnalytics = ({ returns = [] }) => {
  const stats = useMemo(() => {
    const returnsArr = Array.isArray(returns) ? returns : [];
    if (returnsArr.length === 0) return null;

    // 1. Most Returned Products
    const productMap = {};
    returnsArr.forEach(r => {
      productMap[r.productName] = (productMap[r.productName] || 0) + r.quantityReturned;
    });
    const productData = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // 2. Returns by Route
    const routeMap = {};
    returnsArr.forEach(r => {
      routeMap[r.routeName] = (routeMap[r.routeName] || 0) + r.returnValue;
    });
    const routeData = Object.entries(routeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Returns by Shop
    const shopMap = {};
    returnsArr.forEach(r => {
      shopMap[r.shopName] = (shopMap[r.shopName] || 0) + r.returnValue;
    });
    const shopData = Object.entries(shopMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // 4 & 5. Trends (Daily)
    const trendMap = {};
    returnsArr.forEach(r => {
      const date = new Date(r.createdAt).toLocaleDateString();
      if (!trendMap[date]) trendMap[date] = { date, count: 0, value: 0 };
      trendMap[date].count += r.quantityReturned;
      trendMap[date].value += r.returnValue;
    });
    const trendData = Object.values(trendMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    return { productData, routeData, shopData, trendData };
  }, [returns]);

  const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308'];

  if (!stats) return null;

  return (
    <div className="space-y-8 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
             <RotateCcw size={20} className="text-orange-500" /> Returns Trend
           </h3>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Return Value (₹)" />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Units Returned" />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Most Returned Products */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
             <Package size={20} className="text-blue-500" /> Top Returned Products
           </h3>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.productData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Bar dataKey="qty" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Units" />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Returns by Route */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
             <MapPin size={20} className="text-green-500" /> Value by Route
           </h3>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={stats.routeData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {stats.routeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      formatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <Legend />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Returns by Shop */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
             <Store size={20} className="text-purple-500" /> High Return Shops
           </h3>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.shopData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      formatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} name="Return Value (₹)" />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsAnalytics;
