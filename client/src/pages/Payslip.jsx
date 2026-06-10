import React, { useRef } from 'react';
import { X, Printer, Download, CreditCard, User, Calendar, MapPin, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Payslip = ({ payroll, onClose }) => {
  const payslipRef = useRef();

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(payslipRef.current, {
      backgroundColor: '#09090b',
      scale: 2
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Payslip_${payroll.workerName}_${payroll.month}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-green-500" /> Employee Payslip
          </h2>
          <div className="flex items-center gap-3">
             <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 border border-slate-700 transition-all"
             >
               <Download size={16} /> Export PDF
             </button>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div ref={payslipRef} className="bg-zinc-950 p-10 rounded-2xl border border-slate-800 space-y-10">
             {/* Header */}
             <div className="flex justify-between items-start border-b border-slate-800 pb-8">
                <div>
                   <h1 className="text-2xl font-black text-white tracking-tighter">VARUN NUTRITION</h1>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sales & Delivery Management</p>
                </div>
                <div className="text-right">
                   <p className="text-slate-400 font-bold text-sm uppercase">Salary Slip</p>
                   <p className="text-green-500 font-black text-xl">{payroll.month}</p>
                </div>
             </div>

             {/* Worker Info */}
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Employee Details</p>
                   <div>
                      <p className="text-slate-400 text-xs font-bold mb-1">Name</p>
                      <p className="text-white font-bold text-lg">{payroll.workerName}</p>
                   </div>
                   <div>
                      <p className="text-slate-400 text-xs font-bold mb-1">Status</p>
                      <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-2 py-1 rounded border border-green-500/20">Present</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Attendance Summary</p>
                   <div>
                      <p className="text-slate-400 text-xs font-bold mb-1">Total Present Days</p>
                      <p className="text-white font-black text-2xl">{payroll.presentDays} <span className="text-slate-600 text-sm font-medium italic">Days</span></p>
                   </div>
                </div>
             </div>

             {/* Earnings Table */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Salary Breakdown</p>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                   <table className="w-full text-sm">
                      <thead className="bg-slate-900">
                         <tr>
                            <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">Description</th>
                            <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase text-[10px]">Rate</th>
                            <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase text-[10px]">Amount</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                         <tr>
                            <td className="px-6 py-4 text-white">Basic Salary (Daily × Days)</td>
                            <td className="px-6 py-4 text-right text-slate-400">₹{payroll.dailySalary}</td>
                            <td className="px-6 py-4 text-right text-white font-bold">₹{payroll.baseSalary.toLocaleString()}</td>
                         </tr>
                         <tr>
                            <td className="px-6 py-4 text-white">Additional Allowance</td>
                            <td className="px-6 py-4 text-right text-slate-400">₹{payroll.additionalAllowance}</td>
                            <td className="px-6 py-4 text-right text-white font-bold">₹{payroll.additionalAmount.toLocaleString()}</td>
                         </tr>
                         {payroll.bonus > 0 && (
                            <tr>
                               <td className="px-6 py-4 text-blue-400 font-medium italic">Performance Bonus / Incentives</td>
                               <td className="px-6 py-4 text-right text-slate-400">-</td>
                               <td className="px-6 py-4 text-right text-blue-400 font-bold">+ ₹{payroll.bonus.toLocaleString()}</td>
                            </tr>
                         )}
                         {payroll.deductions > 0 && (
                            <tr>
                               <td className="px-6 py-4 text-red-400 font-medium italic">Salary Deductions</td>
                               <td className="px-6 py-4 text-right text-slate-400">-</td>
                               <td className="px-6 py-4 text-right text-red-400 font-bold">- ₹{payroll.deductions.toLocaleString()}</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Footer Totals */}
             <div className="flex justify-between items-center bg-green-600/10 border-2 border-green-600/20 p-8 rounded-2xl">
                <div>
                   <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">Net Amount Payable</p>
                   <p className="text-3xl font-black text-green-500">₹{payroll.netSalary.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Signature of Authority</p>
                   <div className="h-10 w-32 border-b border-slate-700 ml-auto" />
                </div>
             </div>

             {payroll.notes && (
               <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl italic text-xs text-slate-400">
                  <p className="font-bold text-slate-500 uppercase text-[10px] not-italic mb-1">Remarks:</p>
                  "{payroll.notes}"
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
