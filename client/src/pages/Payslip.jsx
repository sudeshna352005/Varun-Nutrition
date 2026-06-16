import React, { useRef } from 'react';
import { X, Printer, Download, CreditCard, User, Calendar, MapPin, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Payslip = ({ payroll, onClose }) => {
  const payslipRef = useRef();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDownloadPDF = async () => {
    if (!payslipRef.current) return;

    try {
      setIsExporting(true);

      // Ensure the element is visible and has dimensions
      const element = payslipRef.current;
      const { width, height } = element.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        throw new Error("Payslip element has no dimensions. Please ensure it is visible.");
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        logging: false,
        // Ignore any chart elements that might be present in the DOM but not in the payslip
        ignoreElements: (el) => el.classList.contains('recharts-wrapper') || el.tagName === 'svg' && !el.closest('.lucide')
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${payroll.workerName}_${payroll.month}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert(`Failed to export PDF: ${err.message || "Unknown error"}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
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
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                isExporting
                ? 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
             >
               {isExporting ? (
                 <div className="h-4 w-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
               ) : (
                 <Download size={16} />
               )}
               {isExporting ? 'Exporting...' : 'Export PDF'}
             </button>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Apply inline styles with hex colors to avoid oklch parsing issues in html2canvas */}
          <div
            ref={payslipRef}
            style={{ backgroundColor: '#09090b', color: '#f4f4f5', borderColor: '#1e293b' }}
            className="p-10 rounded-2xl border space-y-10"
          >
             {/* Header */}
             <div style={{ borderColor: '#1e293b' }} className="flex justify-between items-start border-b pb-8">
                <div>
                   <h1 style={{ color: '#ffffff' }} className="text-2xl font-black tracking-tighter">VARUN NUTRITION</h1>
                   <p style={{ color: '#64748b' }} className="text-xs font-bold uppercase tracking-widest mt-1">Sales & Delivery Management</p>
                </div>
                <div className="text-right">
                   <p style={{ color: '#94a3b8' }} className="font-bold text-sm uppercase">Salary Slip</p>
                   <p style={{ color: '#22c55e' }} className="font-black text-xl">{payroll.month}</p>
                </div>
             </div>

             {/* Worker Info */}
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                   <p style={{ color: '#64748b' }} className="text-[10px] font-black uppercase tracking-[0.2em]">Employee Details</p>
                   <div>
                      <p style={{ color: '#94a3b8' }} className="text-xs font-bold mb-1">Name</p>
                      <p style={{ color: '#ffffff' }} className="font-bold text-lg">{payroll.workerName}</p>
                   </div>
                   <div>
                      <p style={{ color: '#94a3b8' }} className="text-xs font-bold mb-1">Status</p>
                      <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }} className="text-[10px] font-black uppercase px-2 py-1 rounded border">Present</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <p style={{ color: '#64748b' }} className="text-[10px] font-black uppercase tracking-[0.2em]">Attendance Summary</p>
                   <div>
                      <p style={{ color: '#94a3b8' }} className="text-xs font-bold mb-1">Total Present Days</p>
                      <p style={{ color: '#ffffff' }} className="font-black text-2xl">{payroll.presentDays} <span style={{ color: '#475569' }} className="text-sm font-medium italic">Days</span></p>
                   </div>
                </div>
             </div>

             {/* Earnings Table */}
             <div className="space-y-4">
                <p style={{ color: '#64748b' }} className="text-[10px] font-black uppercase tracking-[0.2em]">Salary Breakdown</p>
                <div style={{ borderColor: '#1e293b' }} className="border rounded-xl overflow-hidden">
                   <table className="w-full text-sm">
                      <thead style={{ backgroundColor: '#0f172a' }}>
                         <tr>
                            <th style={{ color: '#94a3b8' }} className="px-6 py-3 text-left font-bold uppercase text-[10px]">Description</th>
                            <th style={{ color: '#94a3b8' }} className="px-6 py-3 text-right font-bold uppercase text-[10px]">Rate</th>
                            <th style={{ color: '#94a3b8' }} className="px-6 py-3 text-right font-bold uppercase text-[10px]">Amount</th>
                         </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'transparent' }}>
                         <tr style={{ borderBottomWidth: '1px', borderBottomColor: '#0f172a' }}>
                            <td style={{ color: '#ffffff', padding: '1rem 1.5rem' }}>Basic Salary (Daily × Days)</td>
                            <td style={{ color: '#94a3b8', padding: '1rem 1.5rem', textAlign: 'right' }}>₹{payroll.dailySalary}</td>
                            <td style={{ color: '#ffffff', padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>₹{payroll.baseSalary.toLocaleString()}</td>
                         </tr>
                         <tr style={{ borderBottomWidth: '1px', borderBottomColor: '#0f172a' }}>
                            <td style={{ color: '#ffffff', padding: '1rem 1.5rem' }}>Additional Allowance</td>
                            <td style={{ color: '#94a3b8', padding: '1rem 1.5rem', textAlign: 'right' }}>₹{payroll.additionalAllowance}</td>
                            <td style={{ color: '#ffffff', padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>₹{payroll.additionalAmount.toLocaleString()}</td>
                         </tr>
                         {payroll.bonus > 0 && (
                            <tr style={{ borderBottomWidth: '1px', borderBottomColor: '#0f172a' }}>
                               <td style={{ color: '#60a5fa', padding: '1rem 1.5rem', fontStyle: 'italic' }}>Performance Bonus / Incentives</td>
                               <td style={{ color: '#94a3b8', padding: '1rem 1.5rem', textAlign: 'right' }}>-</td>
                               <td style={{ color: '#60a5fa', padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>+ ₹{payroll.bonus.toLocaleString()}</td>
                            </tr>
                         )}
                         {payroll.deductions > 0 && (
                            <tr style={{ borderBottomWidth: '1px', borderBottomColor: '#0f172a' }}>
                               <td style={{ color: '#f87171', padding: '1rem 1.5rem', fontStyle: 'italic' }}>Salary Deductions</td>
                               <td style={{ color: '#94a3b8', padding: '1rem 1.5rem', textAlign: 'right' }}>-</td>
                               <td style={{ color: '#f87171', padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>- ₹{payroll.deductions.toLocaleString()}</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Footer Totals */}
             <div style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.2)' }} className="flex justify-between items-center border-2 p-8 rounded-2xl">
                <div>
                   <p style={{ color: 'rgba(34, 197, 94, 0.6)' }} className="text-[10px] font-black uppercase tracking-widest">Net Amount Payable</p>
                   <p style={{ color: '#22c55e' }} className="text-3xl font-black">₹{payroll.netSalary.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase mb-2">Signature of Authority</p>
                   <div style={{ borderColor: '#334155' }} className="h-10 w-32 border-b ml-auto" />
                </div>
             </div>

             {payroll.notes && (
               <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#94a3b8' }} className="p-4 border rounded-xl italic text-xs">
                  <p style={{ color: '#64748b' }} className="font-bold uppercase text-[10px] not-italic mb-1">Remarks:</p>
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
