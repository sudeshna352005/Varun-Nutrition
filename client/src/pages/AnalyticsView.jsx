import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  TrendingUp, Store, Zap, CreditCard,
  BarChart, Calendar, RefreshCw, AlertCircle
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import SalesForecast from '../components/analytics/SalesForecast';
import ShopIntelligence from '../components/analytics/ShopIntelligence';
import AiSummary from '../components/analytics/AiSummary';
import PayrollAnalytics from '../components/analytics/PayrollAnalytics';
import ProductivityHeatmap from '../components/analytics/ProductivityHeatmap';

const AnalyticsView = () => {
  const [data, setData] = useState({
    workers: [],
    shops: [],
    routes: [],
    visits: [],
    attendance: [],
    orders: [],
    payroll: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('weekly');
  const [error, setError] = useState(null);

  const filteredData = useMemo(() => {
    if (!data) return data;

    const now = new Date();
    const todayStr = now.toDateString();

    let visits = Array.isArray(data.visits) ? data.visits : [];
    let orders = Array.isArray(data.orders) ? data.orders : [];
    let attendance = Array.isArray(data.attendance) ? data.attendance : [];
    let payroll = Array.isArray(data.payroll) ? data.payroll : [];

    if (period === 'daily') {
      visits = visits.filter(v => v.timestamp && new Date(v.timestamp).toDateString() === todayStr);
      orders = orders.filter(o => o.timestamp && new Date(o.timestamp).toDateString() === todayStr);
      attendance = attendance.filter(a => a.startTime && new Date(a.startTime).toDateString() === todayStr);
    } else if (period === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      visits = visits.filter(v => v.timestamp && new Date(v.timestamp) >= sevenDaysAgo);
      orders = orders.filter(o => o.timestamp && new Date(o.timestamp) >= sevenDaysAgo);
      attendance = attendance.filter(a => a.startTime && new Date(a.startTime) >= sevenDaysAgo);
    } else if (period === 'monthly') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      visits = visits.filter(v => {
        if (!v.timestamp) return false;
        const d = new Date(v.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      orders = orders.filter(o => {
        if (!o.timestamp) return false;
        const d = new Date(o.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      attendance = attendance.filter(a => {
        if (!a.startTime) return false;
        const d = new Date(a.startTime);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const monthStr = now.toISOString().slice(0, 7);
      payroll = payroll.filter(p => p.month === monthStr);
    }

    return { ...data, visits, orders, attendance, payroll };
  }, [data, period]);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [
        workersRes, shopsRes, routesRes,
        visitsRes, attendanceRes, ordersRes,
        payrollRes
      ] = await Promise.all([
        api.get('/api/workers').catch(e => ({ data: [], error: e })),
        api.get('/api/shops').catch(e => ({ data: [], error: e })),
        api.get('/api/routes').catch(e => ({ data: [], error: e })),
        api.get('/api/visits').catch(e => ({ data: [], error: e })),
        api.get('/api/attendance').catch(e => ({ data: [], error: e })),
        api.get('/api/orders').catch(e => ({ data: [], error: e })),
        api.get('/api/payroll').catch(e => ({ data: [], error: e }))
      ]);

      setData({
        workers: Array.isArray(workersRes.data) ? workersRes.data : [],
        shops: Array.isArray(shopsRes.data) ? shopsRes.data : [],
        routes: Array.isArray(routesRes.data) ? routesRes.data : [],
        visits: Array.isArray(visitsRes.data) ? visitsRes.data : [],
        attendance: Array.isArray(attendanceRes.data) ? attendanceRes.data : [],
        orders: Array.isArray(ordersRes.data) ? ordersRes.data : [],
        payroll: Array.isArray(payrollRes.data) ? payrollRes.data : []
      });
    } catch (err) {
      console.error("Critical failure in analytics data fetch", err);
      setError("Some data could not be loaded. Analytics may be incomplete.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-10 p-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart className="text-green-500" /> Sales Force Analytics
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">AI-powered business intelligence and forecasting.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
             {['daily', 'weekly', 'monthly'].map(p => (
               <button
                 key={p}
                 onClick={() => setPeriod(p)}
                 className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${period === p ? 'bg-green-600 text-zinc-900 shadow-lg shadow-green-600/20' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 {p}
               </button>
             ))}
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in duration-300">
           <AlertCircle size={18} />
           {error}
        </div>
      )}

      {/* AI Summary Generator - Primary Placement */}
      <AiSummary data={filteredData} period={period} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sales Forecasting */}
        <SalesForecast orders={filteredData.orders} />

        {/* Productivity Heatmap */}
        <ProductivityHeatmap visits={filteredData.visits} orders={filteredData.orders} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Shop Visit Intelligence */}
        <ShopIntelligence
          shops={filteredData.shops}
          visits={filteredData.visits}
          orders={filteredData.orders}
        />

        {/* Payroll Analytics */}
        <PayrollAnalytics
          payroll={filteredData.payroll}
          workers={filteredData.workers}
          attendance={filteredData.attendance}
        />
      </div>

      {data.orders.length < 5 && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="text-blue-500 shrink-0" />
          <div>
            <h4 className="text-blue-500 font-bold">Limited Data Insight</h4>
            <p className="text-blue-500/70 text-sm mt-1">Analytics accuracy improves as you log more shop visits and orders. Forecasting currently uses moving average models based on available history.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
