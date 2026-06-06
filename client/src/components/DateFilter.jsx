import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getRangeDates } from '../utils/dateUtils';

const DateFilter = ({ onRangeChange }) => {
  const [selectedPreset, setSelectedPreset] = useState('today');
  const [isCustom, setIsCustom] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'Last 30 Days', value: 'last30' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Custom', value: 'custom' },
  ];

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const range = getRangeDates(preset);
      onRangeChange(range);
    }
  };

  const handleCustomChange = (e) => {
    const newRange = { ...customRange, [e.target.name]: e.target.value };
    setCustomRange(newRange);
    if (newRange.start && newRange.end) {
      onRangeChange({
        start: new Date(newRange.start),
        end: new Date(new Date(newRange.end).setHours(23, 59, 59, 999))
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
      <div className="flex flex-wrap gap-1 p-1 bg-slate-800/50 rounded-xl">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePresetChange(p.value)}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              selectedPreset === p.value ? 'bg-green-600 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
          <input
            type="date"
            name="start"
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-green-500 outline-none"
            value={customRange.start}
            onChange={handleCustomChange}
          />
          <span className="text-slate-600">-</span>
          <input
            type="date"
            name="end"
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-green-500 outline-none"
            value={customRange.end}
            onChange={handleCustomChange}
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;
