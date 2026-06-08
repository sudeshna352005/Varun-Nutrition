import React, { useState, useEffect, useMemo } from 'react';
import api, { getImageUrl } from '../api';
import { Calendar, Store, MessageSquare, ClipboardList, Search, Filter, Download, Printer, User, MapPin, Camera, X, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Skeleton from '../components/Skeleton';
import DateFilter from '../components/DateFilter';
import { isInRange, getRangeDates } from '../utils/dateUtils';

const ReportsView = () => {
  const [visits, setVisits] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(getRangeDates('last30'));
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [visitType, setVisitType] = useState('all'); // 'all', 'with-notes', 'without-notes'
  const [showOnlyPhotos, setShowOnlyPhotos] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workersRes, shopsRes, routesRes, visitsRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/shops'),
        api.get('/api/routes'),
        api.get('/api/visits')
      ]);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      setShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
      setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = useMemo(() => {
    const visitsArr = Array.isArray(visits) ? visits : [];
    const shopsArr = Array.isArray(shops) ? shops : [];

    return visitsArr.filter(v => {
      const shop = shopsArr.find(s => s.name === v.shopName);

      const matchesSearch =
        (v.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.workerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = isInRange(v.timestamp, dateRange);
      const matchesWorker = !selectedWorker || v.workerName === selectedWorker;
      const matchesShop = !selectedShop || v.shopName === selectedShop;
      const matchesRoute = !selectedRoute || (shop && shop.routeGroup === selectedRoute);
      const matchesPhotos = !showOnlyPhotos || !!v.photo;
      const matchesType = visitType === 'all' ||
                         (visitType === 'with-notes' && v.notes?.trim()) ||
                         (visitType === 'without-notes' && !v.notes?.trim());

      return matchesSearch && matchesDate && matchesWorker && matchesShop && matchesRoute && matchesPhotos && matchesType;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'shop-az') return (a.shopName || '').localeCompare(b.shopName || '');
      if (sortBy === 'worker-az') return (a.workerName || '').localeCompare(b.workerName || '');
      return 0;
    });
  }, [visits, shops, searchTerm, dateRange, selectedWorker, selectedShop, selectedRoute, showOnlyPhotos, visitType, sortBy]);

  const stats = useMemo(() => ({
    total: filteredVisits.length,
    withPhotos: filteredVisits.filter(v => !!v.photo).length,
    uniqueShops: new Set(filteredVisits.map(v => v.shopName)).size,
    uniqueWorkers: new Set(filteredVisits.map(v => v.workerName)).size
  }), [filteredVisits]);

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Shop Name', 'Worker Name', 'Notes', 'Photo URL'];
    const data = filteredVisits.map(v => [
      new Date(v.timestamp).toLocaleDateString(),
      new Date(v.timestamp).toLocaleTimeString(),
      v.shopName,
      v.workerName,
      v.notes || '',
      v.photo || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...data].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reports_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const data = filteredVisits.map(v => ({
      Date: new Date(v.timestamp).toLocaleDateString(),
      Time: new Date(v.timestamp).toLocaleTimeString(),
      'Shop Name': v.shopName,
      'Worker Name': v.workerName,
      Notes: v.notes || '',
      'Photo URL': v.photo || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, `reports_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => window.print();

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange(getRangeDates('last30'));
    setSelectedWorker('');
    setSelectedShop('');
    setSelectedRoute('');
    setVisitType('all');
    setShowOnlyPhotos(false);
  };

  if (loading) return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center mb-10">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="space-y-8 mt-10">
        {[1,2,3].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ClipboardList className="text-green-500" /> Visit Reports
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${showFilters ? 'bg-green-600 text-slate-900 shadow-lg shadow-green-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Filter size={18} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2" />
          <button onClick={exportCSV} title="Export CSV" className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
            <Download size={18} />
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-bold border border-slate-700">
            <Download size={18} /> Export Excel
          </button>
          <button onClick={handlePrint} title="Print Report" className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-6 no-print animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 block">Quick Date Select</label>
              <DateFilter onRangeChange={setDateRange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-[2]">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Search Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Shop, Worker, Notes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

            {/* Worker Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Filter by Worker</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer"
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
              >
                <option value="">All Workers</option>
                {(Array.isArray(workers) ? workers : []).map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>

            {/* Route Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Filter by Route</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer"
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
              >
                <option value="">All Routes</option>
                {(Array.isArray(routes) ? routes : []).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-700 bg-slate-800 text-green-500 focus:ring-offset-slate-900"
                  checked={showOnlyPhotos}
                  onChange={(e) => setShowOnlyPhotos(e.target.checked)}
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Photos Only</span>
              </label>

              <div className="flex bg-slate-800 p-1 rounded-lg">
                {['all', 'with-notes', 'without-notes'].map(t => (
                  <button
                    key={t}
                    onClick={() => setVisitType(t)}
                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${visitType === t ? 'bg-green-600 text-zinc-900' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sort By:</span>
                <div className="flex bg-slate-800 rounded-lg p-1">
                   {['newest', 'oldest', 'shop-az'].map(option => (
                     <button
                       key={option}
                       onClick={() => setSortBy(option)}
                       className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${sortBy === option ? 'bg-green-600 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                     >
                       {option.replace('-', ' ')}
                     </button>
                   ))}
                </div>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X size={14} /> Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-l-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Reports</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-l-blue-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">With Photos</p>
          <p className="text-2xl font-bold text-blue-500">{stats.withPhotos}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-l-green-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Unique Shops</p>
          <p className="text-2xl font-bold text-green-500">{stats.uniqueShops}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-l-purple-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Workers</p>
          <p className="text-2xl font-bold text-purple-500">{stats.uniqueWorkers}</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-6 print:space-y-8 pb-10">
        {(Array.isArray(filteredVisits) ? filteredVisits : []).length === 0 ? (
          <div className="bg-slate-900 p-10 md:p-20 text-center rounded-2xl border border-slate-800 shadow-xl">
            <ClipboardList className="w-12 h-12 md:w-16 md:h-16 mx-auto text-slate-800 mb-6" />
            <p className="text-slate-500 font-medium italic text-sm md:text-base">No reports match your current search or filters.</p>
          </div>
        ) : (
          (Array.isArray(filteredVisits) ? filteredVisits : []).map((visit) => (
            <div key={visit.id} className="bg-slate-900 p-5 md:p-8 rounded-2xl shadow-xl border border-slate-800 hover:border-slate-700 transition-all break-inside-avoid group">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold flex items-center text-white mb-2">
                    <Store className="w-5 h-5 mr-3 text-green-500 shrink-0" /> {visit.shopName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                      <User size={14} className="text-blue-500" />
                      {(() => {
                        const worker = workers.find(w => w.name === visit.workerName);
                        return worker ? (
                          <Link to={`/worker/${worker.id || worker._id}`} className="hover:text-green-500 transition-colors">
                            {visit.workerName}
                          </Link>
                        ) : visit.workerName;
                      })()}
                    </span>
                    <span className="hidden md:inline text-slate-700">•</span>
                    <span className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Calendar size={14} className="text-slate-500" /> {new Date(visit.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock size={14} className="text-slate-600" /> {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {(() => {
                  const shop = (Array.isArray(shops) ? shops : []).find(s => s.name === visit.shopName);
                  return shop ? (
                    <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 group-hover:border-slate-600 transition-all">
                      <MapPin size={10} className="text-green-500" /> {shop.routeGroup}
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="bg-slate-800/20 p-4 md:p-6 rounded-xl border border-slate-800 group-hover:bg-slate-800/30 transition-all">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                  <div className="flex-1 order-2 lg:order-1">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={12} className="text-slate-400" /> Notes & Remarks
                    </p>
                    <p className="text-slate-200 leading-relaxed text-sm selection:bg-green-500/30">
                      {visit.notes || <span className="italic text-slate-600">No notes provided for this visit.</span>}
                    </p>
                  </div>

                  {visit.photo && (
                    <div className="flex-shrink-0 order-1 lg:order-2 mb-4 lg:mb-0">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Camera size={12} className="text-slate-400" /> Evidence Photo
                      </p>
                      <div className="relative overflow-hidden rounded-xl bg-slate-800 max-w-xs md:max-w-none">
                        <img
                          src={getImageUrl(visit.photo)}
                          alt="Visit Evidence"
                          loading="lazy"
                          className="w-full md:w-64 h-48 md:h-48 object-cover rounded-xl border border-slate-700 shadow-lg group-hover:scale-105 transition-all duration-500 cursor-zoom-in"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default ReportsView;
