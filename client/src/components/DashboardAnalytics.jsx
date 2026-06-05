import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, MapPin, CheckCircle } from 'lucide-react';

const DashboardAnalytics = ({ data }) => {
  const { workers, shops, visits, attendance } = data;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Colors for charts
  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444', '#06b6d4'];

  // 1. Visits per Day (Line Chart) - last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const visitsByDayData = last7Days.map(date => ({
    name: new Date(date).toLocaleDateString([], { weekday: 'short' }),
    visits: visits.filter(v => v.timestamp.startsWith(date)).length
  }));

  // 2. Worker Performance (Bar Chart)
  const workerPerformanceData = workers.map(w => ({
    name: w.name,
    visits: visits.filter(v => v.workerName === w.name).length
  })).sort((a, b) => b.visits - a.visits).slice(0, 5);

  // 3. Route Coverage (Pie Chart)
  const routeCounts = visits.reduce((acc, v) => {
    const shop = shops.find(s => s.name === v.shopName);
    const route = shop ? shop.routeGroup : 'Unknown';
    acc[route] = (acc[route] || 0) + 1;
    return acc;
  }, {});

  const routeCoverageData = Object.keys(routeCounts).map(name => ({
    name,
    value: routeCounts[name]
  }));

  // 4. Attendance Trend (Area Chart)
  const attendanceTrendData = last7Days.map(date => ({
    name: new Date(date).toLocaleDateString([], { weekday: 'short' }),
    present: new Set(attendance.filter(a => a.startTime.startsWith(date)).map(a => a.workerName)).size
  }));

  // Key Metrics
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const visitsToday = visits.filter(v => v.timestamp.startsWith(today)).length;
  const visitsThisMonth = visits.filter(v => v.timestamp.startsWith(thisMonth)).length;

  const presentTodayCount = new Set(attendance.filter(a => a.startTime.startsWith(today)).map(a => a.workerName)).size;
  const attendanceTodayPct = workers.length > 0 ? Math.round((presentTodayCount / workers.length) * 100) : 0;

  const avgVisitsPerWorker = workers.length > 0 ? (visits.length / workers.length).toFixed(1) : 0;

  // Top Performer
  const topWorker = workerPerformanceData[0]?.name || 'N/A';

  // Most Active Route
  const topRoute = routeCoverageData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A';

  // Most Visited Shop
  const shopCounts = visits.reduce((acc, v) => {
    acc[v.shopName] = (acc[v.shopName] || 0) + 1;
    return acc;
  }, {});
  const topShop = Object.keys(shopCounts).sort((a, b) => shopCounts[b] - shopCounts[a])[0] || 'N/A';

  return (
    <div className="space-y-8 mt-12">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <TrendingUp className="text-green-500" /> Advanced Analytics
      </h2>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Performance Highlights</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Visits This Month</span>
              <span className="text-white font-bold text-xl">{visitsThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Attendance Today</span>
              <span className="text-green-500 font-bold">{attendanceTodayPct}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Visits / Worker</span>
              <span className="text-blue-500 font-bold">{avgVisitsPerWorker}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Leaderboard</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Top Worker</span>
              <span className="text-purple-500 font-bold">{topWorker}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Most Active Route</span>
              <span className="text-orange-500 font-bold">{topRoute}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Top Shop</span>
              <span className="text-green-500 font-bold truncate max-w-[150px]">{topShop}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Today's Pulse</p>
          <div className="text-5xl font-black text-white mb-1">{visitsToday}</div>
          <p className="text-slate-400 text-xs uppercase font-bold">Total Visits Today</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visits per Day */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-[400px]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Visits Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visitsByDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#22c55e' }}
              />
              <Line type="monotone" dataKey="visits" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Worker Performance */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-[400px]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Top Workers Performance</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workerPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} hide />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="visits" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Route Coverage */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl min-h-[450px] lg:h-[400px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Route Coverage</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={routeCoverageData}
                  innerRadius={isMobile ? 45 : 60}
                  outerRadius={isMobile ? 75 : 100}
                  paddingAngle={5}
                  dataKey="value"
                  cx="50%"
                  cy={isMobile ? "35%" : "50%"}
                >
                  {routeCoverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Legend
                  layout="vertical"
                  align={isMobile ? 'center' : 'right'}
                  verticalAlign={isMobile ? 'bottom' : 'middle'}
                  iconSize={10}
                  wrapperStyle={isMobile ? {
                    paddingTop: '10px',
                    width: '100%',
                    left: 0,
                    bottom: 0
                  } : {
                    paddingLeft: '20px'
                  }}
                  formatter={(value) => <span className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-tight">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-[400px]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Attendance Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={attendanceTrendData}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="present" stroke="#a855f7" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
