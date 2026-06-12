import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  CreditCard, Search, Calendar, Download, Plus, Minus,
  FileText, CheckCircle, Clock, AlertCircle, TrendingUp,
  Printer, X, Save
} from 'lucide-react';
import DateFilter from '../components/DateFilter';
import { getRangeDates, isInRange } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Payslip from './Payslip';

const PayrollDashboard = () => {
  const [payroll, setPayroll] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterMode, setFilterMode] = useState('month'); // 'month' or 'custom'
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [showPayslip, setShowPayslip] = useState(null);

  useEffect(() => {
    fetchWorkers();
    fetchPayroll();
  }, [month, dateRange, filterMode]);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/api/workers');
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      let url = '/api/payroll';
      if (filterMode === 'month') {
        url += `?month=${month}`;
      } else {
        url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const res = await api.get(url);
      setPayroll(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      const payload = filterMode === 'month'
        ? { month }
        : { customStartDate: dateRange.start, customEndDate: dateRange.end };
      await api.post('/api/payroll/calculate', payload);
      fetchPayroll();
    } catch (err) {
      console.error(err);
      alert("Failed to calculate payroll.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayroll = async (e) => {
    e.preventDefault();
    try {
      const id = editingPayroll.id || editingPayroll._id;
      await api.put(`/api/payroll/${id}`, editingPayroll);
      setEditingPayroll(null);
      fetchPayroll();
    } catch (err) { console.error(err); }
  };

  const filteredPayroll = useMemo(() => {
    return payroll.filter(p =>
      p.workerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payroll, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredPayroll.reduce((sum, p) => sum + p.netSalary, 0);
    const bonus = filteredPayroll.reduce((sum, p) => sum + (p.bonus || 0), 0);
    const deductions = filteredPayroll.reduce((sum, p) => sum + (p.deductions || 0), 0);
    return { total, bonus, deductions };
  }, [filteredPayroll]);

  const exportExcel = () => {
    const label = filterMode === 'month' ? month : `${dateRange.start}_to_${dateRange.end}`;
    const data = filteredPayroll.map(p => ({
      'Worker Name': p.workerName,
      'Payroll Period': p.month,
      'Present Days': p.presentDays,
      'Daily Salary': p.dailySalary,
      'Allowance': p.additionalAllowance,
      'Base Salary': p.baseSalary,
      'Addl Amount': p.additionalAmount,
      'Bonus': p.bonus,
      'Deductions': p.deductions,
      'Net Salary': p.netSalary,
      'Status': p.status.toUpperCase()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `Payroll_${label}.xlsx`);
  };

  const exportPDF = () => {
    const label = filterMode === 'month' ? month : `${dateRange.start} to ${dateRange.end}`;
    const doc = new jsPDF();
    doc.text(`Payroll Report - ${label}`, 14, 15);

    const tableColumn = ["Worker", "Period", "Days", "Daily", "Allowance", "Bonus", "Ded.", "Net Salary"];
    const tableRows = filteredPayroll.map(p => [
      p.workerName,
      p.month,
      p.presentDays,
      p.dailySalary,
      p.additionalAllowance,
      p.bonus,
      p.deductions,
      `INR ${p.netSalary.toLocaleString()}`
    ]);

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save(`Payroll_${month}.pdf`);
  };

  if (loading && payroll.length === 0) return <div className="text-center py-20 text-slate-500 italic font-medium">Loading Payroll Data...</div>;

  const setQuickFilter = (type) => {
    const now = new Date();
    let start, end;
    setFilterMode('custom');

    switch(type) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'firstHalf':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), 15);
        break;
      case 'secondHalf':
        start = new Date(now.getFullYear(), now.getMonth(), 16);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last7':
        start = new Date();
        start.setDate(now.getDate() - 7);
        end = now;
        break;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <CreditCard className="text-green-500" /> Payroll Management
        </h1>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setFilterMode('month')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'month' ? 'bg-green-600 text-zinc-900' : 'text-slate-500 hover:text-white'}`}
            >
              Month
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'custom' ? 'bg-green-600 text-zinc-900' : 'text-slate-500 hover:text-white'}`}
            >
              Custom Range
            </button>
          </div>

          {filterMode === 'month' ? (
            <input
              type="month"
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="bg-green-600 text-zinc-900 px-6 py-2 rounded-xl font-bold hover:bg-green-500 transition-all flex items-center gap-2 shadow-lg shadow-green-600/20"
          >
            <TrendingUp size={18} /> Recalculate
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
         {[
           { label: 'This Month', type: 'thisMonth' },
           { label: 'Last Month', type: 'lastMonth' },
           { label: '1st - 15th', type: 'firstHalf' },
           { label: '16th - End', type: 'secondHalf' },
           { label: 'Last 7 Days', type: 'last7' }
         ].map(f => (
           <button
            key={f.type}
            onClick={() => setQuickFilter(f.type)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-green-500 hover:border-green-500/50 transition-all uppercase tracking-widest"
           >
             {f.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Payout</p>
          <p className="text-3xl font-black text-white">₹{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Bonuses</p>
          <p className="text-3xl font-black text-blue-500">₹{stats.bonus.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Deductions</p>
          <p className="text-3xl font-black text-red-500">₹{stats.deductions.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Worker..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none placeholder-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button onClick={exportExcel} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors border border-slate-700">
               <Download size={18} />
             </button>
             <button onClick={exportPDF} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors border border-slate-700">
               <FileText size={18} />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Worker</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Present</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Daily + Addl</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Bonus</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ded.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Net Salary</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPayroll.map(p => (
                <tr key={p.id || p._id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{p.workerName}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">{p.month}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded border border-green-500/20">{p.presentDays} Days</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-xs text-white font-medium">₹{p.dailySalary} + ₹{p.additionalAllowance}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">₹{p.dailySalary + p.additionalAllowance} Total</p>
                  </td>
                  <td className="px-6 py-4 text-right text-blue-400 font-bold">₹{p.bonus || 0}</td>
                  <td className="px-6 py-4 text-right text-red-400 font-bold">₹{p.deductions || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-lg font-black text-white">₹{p.netSalary.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button
                        onClick={() => setEditingPayroll({...p})}
                        className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-green-500 transition-colors border border-slate-700"
                        title="Edit Bonus/Deductions"
                       >
                         <Plus size={16} />
                       </button>
                       <button
                        onClick={() => setShowPayslip(p)}
                        className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-blue-500 transition-colors border border-slate-700"
                        title="View Payslip"
                       >
                         <Printer size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayroll.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-slate-600 italic">No payroll records found for this period. Click 'Recalculate' to generate.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPayroll && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Adjust Payroll: {editingPayroll.workerName}</h2>
              <button onClick={() => setEditingPayroll(null)} className="text-slate-500 hover:text-white transition-colors"><X/></button>
            </div>

            <form onSubmit={handleUpdatePayroll} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bonus (₹)</label>
                   <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                    value={editingPayroll.bonus}
                    onChange={(e) => setEditingPayroll({...editingPayroll, bonus: parseFloat(e.target.value) || 0})}
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Deductions (₹)</label>
                   <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                    value={editingPayroll.deductions}
                    onChange={(e) => setEditingPayroll({...editingPayroll, deductions: parseFloat(e.target.value) || 0})}
                   />
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes/Remarks</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500 h-24"
                  value={editingPayroll.notes || ''}
                  onChange={(e) => setEditingPayroll({...editingPayroll, notes: e.target.value})}
                  placeholder="e.g. Festival bonus, Late coming deduction..."
                />
              </div>
              <button type="submit" className="w-full bg-green-600 text-zinc-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-all shadow-lg shadow-green-600/20">
                <Save size={18}/> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslip && (
        <Payslip payroll={showPayslip} onClose={() => setShowPayslip(null)} />
      )}
    </div>
  );
};

export default PayrollDashboard;
