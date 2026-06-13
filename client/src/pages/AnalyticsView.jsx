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

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [
        workersRes, shopsRes, routesRes,
        visitsRes, attendanceRes, ordersRes,
        payrollRes
      ] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/shops'),
        api.get('/api/routes'),
        api.get('/api/visits'),
        api.get('/api/attendance'),
        api.get('/api/orders'),
        api.get('/api/payroll')
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
      console.error("Failed to fetch analytics data", err);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart className="text-green-500" /> Sales Force Analytics
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">AI-powered business intelligence and forecasting.</p>
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

      {/* AI Summary Generator - Primary Placement */}
      <AiSummary data={data} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sales Forecasting */}
        <SalesForecast orders={data.orders} />

        {/* Productivity Heatmap */}
        <ProductivityHeatmap visits={data.visits} orders={data.orders} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Shop Visit Intelligence */}
        <ShopIntelligence
          shops={data.shops}
          visits={data.visits}
          orders={data.orders}
        />

        {/* Payroll Analytics */}
        <PayrollAnalytics
          payroll={data.payroll}
          workers={data.workers}
          attendance={data.attendance}
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
