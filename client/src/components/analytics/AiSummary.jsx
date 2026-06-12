import React, { useState, useMemo } from 'react';
import { Zap, Brain, Sparkles, ChevronRight, BarChart, TrendingUp, User, MapPin } from 'lucide-react';

const AiSummary = ({ data }) => {
  const [isGenerating, setIsWorking] = useState(false);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('weekly');

  const generateInsights = () => {
    setIsWorking(true);

    // Simulate AI delay
    setTimeout(() => {
      const { visits, orders, workers, routes, shops } = data;

      const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Best performing worker logic
      const workerStats = {};
      orders.forEach(o => {
        workerStats[o.workerName] = (workerStats[o.workerName] || 0) + (o.totalAmount || 0);
      });
      const bestWorkerName = Object.keys(workerStats).sort((a, b) => workerStats[b] - workerStats[a])[0] || 'N/A';

      // Route insights
      const routeStats = {};
      orders.forEach(o => {
        routeStats[o.routeName] = (routeStats[o.routeName] || 0) + (o.totalAmount || 0);
      });
      const mostProductiveRoute = Object.keys(routeStats).sort((a, b) => routeStats[b] - routeStats[a])[0] || 'N/A';

      const insights = {
        title: `${period.toUpperCase()} PERFORMANCE INSIGHTS`,
        timestamp: new Date().toLocaleString(),
        metrics: [
          { label: 'Network Reach', value: `${visits.length} Visits`, detail: `Across ${new Set(visits.map(v => v.shopName)).size} unique shops` },
          { label: 'Revenue Generated', value: `₹${totalSales.toLocaleString()}`, detail: `${orders.length} orders recorded` },
          { label: 'Force Efficiency', value: bestWorkerName, detail: `Top grossing sales worker this ${period}`, icon: User },
          { label: 'Optimal Corridor', value: mostProductiveRoute, detail: `Highest order volume recorded here`, icon: MapPin }
        ],
        observation: `Business activity is ${totalSales > 10000 ? 'trending upwards' : 'stable'}. The conversion rate from visit to order is approximately ${visits.length > 0 ? Math.round((orders.length / visits.length) * 100) : 0}%.`,
        recommendations: [
          `Prioritize follow-ups for ${shops.length - new Set(visits.map(v => v.shopName)).size} shops that were not visited this period.`,
          `Analyze ${bestWorkerName}'s route strategy to replicate successful patterns across the team.`,
          `Review low-volume shops in ${mostProductiveRoute} to maximize existing route efficiency.`
        ]
      };

      setSummary(insights);
      setIsWorking(false);
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-green-500/20">
            <Brain size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">AI Summary Generator</h2>
            <p className="text-slate-400 text-sm">Automated business intelligence & performance reporting.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </select>
          <button
            onClick={generateInsights}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-zinc-950 rounded-xl font-black hover:bg-green-500 transition-all shadow-xl shadow-green-600/20 disabled:opacity-50"
          >
            {isGenerating ? <Zap size={18} className="animate-pulse" /> : <Sparkles size={18} />}
            {isGenerating ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      {summary ? (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {summary.metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-xl font-black text-white mb-1">{m.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{m.detail}</p>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-2xl border-l-4 border-l-green-500">
                   <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <TrendingUp size={14} /> Strategic Observation
                   </h3>
                   <p className="text-slate-300 leading-relaxed italic">"{summary.observation}"</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-yellow-500" /> Actionable Recommendations
                  </h3>
                  <div className="space-y-3">
                    {summary.recommendations.map((r, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-800 group hover:border-slate-700 transition-all">
                        <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 border border-slate-700 group-hover:text-green-500 group-hover:border-green-500/30 transition-all">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-6 rounded-2xl border border-slate-800 h-fit">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Report Metadata</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs pb-4 border-b border-slate-900">
                       <span className="text-slate-500 font-medium">Model</span>
                       <span className="text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">VN-Analytics-v1</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-4 border-b border-slate-900">
                       <span className="text-slate-500 font-medium">Engine</span>
                       <span className="text-slate-300 font-bold">Heuristic Inference</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 font-medium">Last Run</span>
                       <span className="text-slate-400 font-mono">{summary.timestamp.split(',')[1]}</span>
                    </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-slate-900">
                    <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      Export Analysis <ChevronRight size={14} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="p-20 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-700 mb-6">
              <BarChart size={32} />
           </div>
           <h3 className="text-xl font-bold text-slate-300 mb-2">No active analysis found.</h3>
           <p className="text-slate-500 text-sm max-w-sm">Click the button above to analyze your business data and generate AI-powered insights and strategic recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default AiSummary;
