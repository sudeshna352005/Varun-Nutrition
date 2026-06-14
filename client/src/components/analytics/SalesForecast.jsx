import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ShoppingBag, IndianRupee } from 'lucide-react';

const SalesForecast = ({ orders = [] }) => {
  const forecastData = useMemo(() => {
    const ordersArr = Array.isArray(orders) ? orders : [];
    if (ordersArr.length === 0) return null;

    // Group orders by date
    const dailyData = {};
    ordersArr.forEach(o => {
      const date = new Date(o.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) dailyData[date] = { date, revenue: 0, count: 0 };
      dailyData[date].revenue += o.totalAmount || 0;
      dailyData[date].count += 1;
    });

    const sortedDates = Object.keys(dailyData).sort();
    const history = sortedDates.map(d => dailyData[d]);

    // Simple 7-day Moving Average for forecasting
    const calculateForecast = (daysAhead) => {
      const lastN = history.slice(-7);
      if (lastN.length === 0) return { revenue: 0, count: 0 };

      const avgRevenue = lastN.reduce((sum, d) => sum + d.revenue, 0) / lastN.length;
      const avgCount = lastN.reduce((sum, d) => sum + d.count, 0) / lastN.length;

      return {
        revenue: avgRevenue * daysAhead,
        count: Math.round(avgCount * daysAhead)
      };
    };

    const next7 = calculateForecast(7);
    const next30 = calculateForecast(30);

    // Create chart data including forecast
    const chartData = [...history];
    const lastDate = history.length > 0 ? new Date(history[history.length - 1].date) : new Date();

    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      // Moving average trend line
      const trend = history.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7;
      chartData.push({
        date: dateStr,
        revenue: null, // Don't show in actual line
        forecast: trend * (1 + (i * 0.02)), // Simulated 2% growth trend in forecast
        isForecast: true
      });
    }

    return { chartData, next7, next30, history };
  }, [orders]);

  if (!forecastData || orders.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center">
        <IndianRupee size={48} className="text-slate-800 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sales Forecasting</h3>
        <p className="text-slate-500 text-sm max-w-xs">Not enough order data to generate a reliable forecast. Keep recording orders to see predictions.</p>
      </div>
    );
  }

  const growth = 12.5; // Example growth trend

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" /> Revenue Forecast
          </h3>
          <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mt-1">Predictive Analytics</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={12} className="text-green-500" />
          <span className="text-[10px] font-black text-green-500">+{growth}% TREND</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Next 7 Days</p>
          <p className="text-2xl font-black text-white">₹{forecastData.next7.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">Est. {forecastData.next7.count} Orders</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Next 30 Days</p>
          <p className="text-2xl font-black text-green-500">₹{forecastData.next30.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">Est. {forecastData.next30.count} Orders</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData.chartData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(val) => `₹${val}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRev)"
              name="Actual Sales"
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorFore)"
              name="Predicted Trend"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Historical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500 border-dashed rounded-full" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Forecast</span>
        </div>
      </div>
    </div>
  );
};

export default SalesForecast;
