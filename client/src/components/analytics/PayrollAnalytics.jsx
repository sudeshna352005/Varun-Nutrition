import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line
} from 'recharts';
import { CreditCard, Users, TrendingUp, DollarSign } from 'lucide-react';

const PayrollAnalytics = ({ payroll = [], workers = [], attendance = [] }) => {
  const stats = useMemo(() => {
    const payrollArr = Array.isArray(payroll) ? payroll : [];

    const totalCost = payrollArr.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalBonus = payrollArr.reduce((sum, p) => sum + (p.bonus || 0), 0);

    // Group by worker
    const workerMap = {};
    payrollArr.forEach(p => {
      if (!workerMap[p.workerName]) workerMap[p.workerName] = 0;
      workerMap[p.workerName] += p.netSalary || 0;
    });

    const workerCostData = Object.entries(workerMap)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);

    // Group by Month/Period
    const periodMap = {};
    payrollArr.forEach(p => {
      if (!periodMap[p.month]) periodMap[p.month] = 0;
      periodMap[p.month] += p.netSalary || 0;
    });

    const periodData = Object.entries(periodMap)
      .map(([month, cost]) => ({ month, cost }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top earners
    const topEarners = workerCostData.slice(0, 5);

    // Correlation: Attendance vs Salary
    const correlationData = payrollArr.map(p => ({
      name: p.workerName,
      days: p.presentDays || 0,
      salary: p.netSalary || 0
    }));

    return { totalCost, totalBonus, workerCostData, periodData, topEarners, correlationData };
  }, [payroll]);

  const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard size={20} className="text-green-500" /> Payroll & Cost Analytics
            </h3>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mt-1">Resource Expenditure</p>
         </div>
         <div className="flex gap-4">
            <div className="bg-slate-800/40 border border-slate-800 px-6 py-3 rounded-2xl">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Payout</p>
               <p className="text-xl font-black text-white">₹{stats.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 px-6 py-3 rounded-2xl">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Incentives</p>
               <p className="text-xl font-black text-blue-500">₹{stats.totalBonus.toLocaleString()}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cost Distribution by Worker</h4>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={stats.topEarners}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="cost"
                     >
                        {stats.topEarners.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        formatter={(val) => `₹${val.toLocaleString()}`}
                     />
                     <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Payroll Expenditure Trend</h4>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.periodData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                     <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                     <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        formatter={(val) => `₹${val.toLocaleString()}`}
                     />
                     <Bar dataKey="cost" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="pt-10 border-t border-slate-800">
         <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 text-center">Attendance vs. Salary Correlation</h4>
         <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={stats.correlationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#22c55e" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="days" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="Present Days" />
                  <Line yAxisId="right" type="monotone" dataKey="salary" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Net Salary (₹)" />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default PayrollAnalytics;
