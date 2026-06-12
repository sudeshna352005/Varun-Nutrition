import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Zap, Clock, Calendar } from 'lucide-react';

const ProductivityHeatmap = ({ visits = [], orders = [] }) => {
  const heatmapData = useMemo(() => {
    const visitsArr = Array.isArray(visits) ? visits : [];
    const ordersArr = Array.isArray(orders) ? orders : [];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = days.map(day => ({ name: day, visits: 0, orders: 0 }));

    visitsArr.forEach(v => {
      const dayIdx = new Date(v.timestamp).getDay();
      dayMap[dayIdx].visits += 1;
    });

    ordersArr.forEach(o => {
      const dayIdx = new Date(o.timestamp).getDay();
      dayMap[dayIdx].orders += 1;
    });

    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
    const hourMap = hours.map(h => ({
      hour: `${h}:00`,
      visits: 0,
      orders: 0,
      label: h >= 12 ? (h === 12 ? '12 PM' : `${h-12} PM`) : `${h} AM`
    }));

    visitsArr.forEach(v => {
      const hr = new Date(v.timestamp).getHours();
      if (hr >= 8 && hr <= 21) {
        hourMap[hr - 8].visits += 1;
      }
    });

    ordersArr.forEach(o => {
      const hr = new Date(o.timestamp).getHours();
      if (hr >= 8 && hr <= 21) {
        hourMap[hr - 8].orders += 1;
      }
    });

    return { dayMap, hourMap };
  }, [visits, orders]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
       <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" /> Productivity Heatmap
          </h3>
          <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mt-1">Temporal Analysis</p>
        </div>
      </div>

      <div className="space-y-10">
         <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Calendar size={14} /> Weekly Distribution
            </h4>
            <div className="h-56">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData.dayMap}>
                     <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                     <Bar dataKey="visits" fill="#22c55e" radius={[4, 4, 0, 0]} name="Visits" />
                     <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Clock size={14} /> Hourly Peak Periods
            </h4>
            <div className="h-56">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData.hourMap}>
                     <XAxis dataKey="label" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                     <Bar dataKey="visits" stackId="a" fill="#1e293b" stroke="#334155" radius={[4, 4, 0, 0]} name="Visits" />
                     <Bar dataKey="orders" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} name="Orders Produced" />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
         <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Peak Day</p>
            <p className="text-sm font-bold text-white">
               {heatmapData.dayMap.sort((a, b) => b.orders - a.orders)[0].name}
            </p>
         </div>
         <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Peak Hour</p>
            <p className="text-sm font-bold text-white">
               {heatmapData.hourMap.sort((a, b) => b.orders - a.orders)[0].label}
            </p>
         </div>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;
