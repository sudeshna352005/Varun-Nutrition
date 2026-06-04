import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api';
import { Calendar, Store, MessageSquare, ClipboardList, Search, Filter, Download, Printer, User, MapPin, Camera, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ReportsView = () => {
  const [visits, setVisits] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [showOnlyPhotos, setShowOnlyPhotos] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [visitsRes, workersRes, shopsRes, routesRes] = await Promise.all([
        api.get('/api/visits'),
        api.get('/api/workers'),
        api.get('/api/shops'),
        api.get('/api/routes')
      ]);
      setVisits(visitsRes.data);
      setWorkers(workersRes.data);
      setShops(shopsRes.data);
      setRoutes(routesRes.data);
    } catch (err) {
      console.error("Failed to fetch reports data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(v => {
    const visitDate = v.timestamp.split('T')[0];
    const shop = shops.find(s => s.name === v.shopName);

    const matchesSearch =
      v.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate =
      (!startDate || visitDate >= startDate) &&
      (!endDate || visitDate <= endDate);

    const matchesWorker = !selectedWorker || v.workerName === selectedWorker;
    const matchesShop = !selectedShop || v.shopName === selectedShop;
    const matchesRoute = !selectedRoute || (shop && shop.routeGroup === selectedRoute);
    const matchesPhotos = !showOnlyPhotos || !!v.photo;

    return matchesSearch && matchesDate && matchesWorker && matchesShop && matchesRoute && matchesPhotos;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
    if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
    if (sortBy === 'shop-az') return a.shopName.localeCompare(b.shopName);
    if (sortBy === 'worker-az') return a.workerName.localeCompare(b.workerName);
    return 0;
  });

  const stats = {
    total: filteredVisits.length,
    withPhotos: filteredVisits.filter(v => !!v.photo).length,
    uniqueShops: new Set(filteredVisits.map(v => v.shopName)).size,
    uniqueWorkers: new Set(filteredVisits.map(v => v.workerName)).size
  };

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
    setStartDate('');
    setEndDate('');
    setSelectedWorker('');
    setSelectedShop('');
    setSelectedRoute('');
    setShowOnlyPhotos(false);
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading Reports...</div>;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-green-500 outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-600">-</span>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-green-500 outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
                {workers.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
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
                {routes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-700 bg-slate-800 text-green-500 focus:ring-offset-slate-900"
                  checked={showOnlyPhotos}
                  onChange={(e) => setShowOnlyPhotos(e.target.checked)}
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Only reports with photos</span>
              </label>
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
        {filteredVisits.length === 0 ? (
          <div className="bg-slate-900 p-20 text-center rounded-2xl border border-slate-800 shadow-xl">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-800 mb-6" />
            <p className="text-slate-500 font-medium italic">No reports match your current search or filters.</p>
          </div>
        ) : (
          filteredVisits.map((visit) => (
            <div key={visit.id} className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 hover:border-slate-700 transition-all break-inside-avoid group">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center text-white mb-2">
                    <Store className="w-5 h-5 mr-3 text-green-500" /> {visit.shopName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest">
                      <User size={14} className="text-blue-500" />
                      {workers.find(w => w.name === visit.workerName) ? (
                        <Link to={`/worker/${workers.find(w => w.name === visit.workerName).id}`} className="hover:text-green-500 transition-colors">
                          {visit.workerName}
                        </Link>
                      ) : visit.workerName}
                    </span>
                    <span className="hidden md:inline text-slate-700">•</span>
                    <span className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                      <Calendar size={14} className="text-slate-500" /> {new Date(visit.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Calendar size={14} className="opacity-0" /> {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {shops.find(s => s.name === visit.shopName) && (
                  <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 group-hover:border-slate-600 transition-all">
                    <MapPin size={10} className="text-green-500" /> {shops.find(s => s.name === visit.shopName).routeGroup}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/20 p-6 rounded-xl border border-slate-800 group-hover:bg-slate-800/30 transition-all">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={12} className="text-slate-400" /> Notes & Remarks
                    </p>
                    <p className="text-slate-200 leading-relaxed text-sm lg:text-base selection:bg-green-500/30">
                      {visit.notes || <span className="italic text-slate-600">No notes provided for this visit.</span>}
                    </p>
                  </div>

                  {visit.photo && (
                    <div className="flex-shrink-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Camera size={12} className="text-slate-400" /> Evidence Photo
                      </p>
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={visit.photo.startsWith('http') ? visit.photo : `${API_BASE_URL}/${visit.photo.replace(/\\/g, '/')}`}
                          alt="Visit Evidence"
                          className="w-full md:w-64 h-64 md:h-48 object-cover rounded-xl border border-slate-700 shadow-lg group-hover:scale-105 transition-all duration-500 cursor-zoom-in"
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
