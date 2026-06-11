import React, { useState, useEffect, useMemo } from 'react';
import api, { getImageUrl } from '../api';
import { Calendar, Store, MessageSquare, ClipboardList, Search, Filter, Download, Printer, User, MapPin, Camera, X, ChevronDown, ChevronUp, Clock, Play, CheckCircle, ShoppingBag, Package } from 'lucide-react';
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
  const [attendance, setAttendance] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const start = dateRange.start ? new Date(dateRange.start).toISOString().split('T')[0] : '';
      const end = dateRange.end ? new Date(dateRange.end).toISOString().split('T')[0] : '';
      const query = (start && end) ? `?startDate=${start}&endDate=${end}` : '';

      const [workersRes, shopsRes, routesRes, visitsRes, attendanceRes, ordersRes] = await Promise.all([
        api.get('/api/workers'),
        api.get('/api/shops'),
        api.get('/api/routes'),
        api.get(`/api/visits${query}`),
        api.get(`/api/attendance${query}`),
        api.get(`/api/orders${query}`)
      ]);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      setShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
      setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
      setAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const timelineEvents = useMemo(() => {
    const visitsArr = Array.isArray(visits) ? visits : [];
    const attendanceArr = Array.isArray(attendance) ? attendance : [];
    const ordersArr = Array.isArray(orders) ? orders : [];
    const shopsArr = Array.isArray(shops) ? shops : [];

    const events = [];

    attendanceArr.forEach(a => {
      if (a.startTime && isInRange(a.startTime, dateRange)) {
        events.push({ ...a, type: 'attendance-start', id: `${a.id || a._id}-start`, timestamp: a.startTime });
      }
      if (a.endTime && isInRange(a.endTime, dateRange)) {
        events.push({ ...a, type: 'attendance-end', id: `${a.id || a._id}-end`, timestamp: a.endTime });
      }
    });

    visitsArr.forEach(v => {
      if (v.timestamp && isInRange(v.timestamp, dateRange)) {
        events.push({ ...v, type: 'visit', id: v.id || v._id, timestamp: v.timestamp });
      }
    });

    ordersArr.forEach(o => {
      if (o.timestamp && isInRange(o.timestamp, dateRange)) {
        events.push({ ...o, type: 'order', id: o.id || o._id, timestamp: o.timestamp });
      }
      if (o.deliveryStatus === 'Delivered' && o.deliveredAt && isInRange(o.deliveredAt, dateRange)) {
        events.push({ ...o, type: 'delivery', id: `${o.id || o._id}-delivered`, timestamp: o.deliveredAt });
      }
    });

    const typeOrder = {
      'attendance-start': 1,
      'visit': 2,
      'order': 3,
      'delivery': 4,
      'attendance-end': 5
    };

    return events.filter(v => {
      const shop = shopsArr.find(s => s.name === v.shopName);

      const matchesSearch =
        (v.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.workerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesWorker = !selectedWorker || v.workerName === selectedWorker;
      const matchesShop = !selectedShop || v.shopName === selectedShop;
      const matchesRoute = !selectedRoute || (v.routeName === selectedRoute) || (shop && shop.routeGroup === selectedRoute);
      const matchesPhotos = !showOnlyPhotos || !!v.photo;
      const matchesType = visitType === 'all' ||
                         (visitType === 'with-notes' && v.notes?.trim()) ||
                         (visitType === 'without-notes' && !v.notes?.trim());

      return matchesSearch && matchesWorker && matchesShop && matchesRoute && matchesPhotos && matchesType;
    }).sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      if (dateA.toDateString() !== dateB.toDateString()) {
        return dateA - dateB;
      }
      return typeOrder[a.type] - typeOrder[b.type];
    });
  }, [visits, attendance, orders, shops, searchTerm, dateRange, selectedWorker, selectedShop, selectedRoute, showOnlyPhotos, visitType]);

  const groupedTimeline = useMemo(() => {
    const groups = {};
    timelineEvents.forEach(e => {
      const date = new Date(e.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return groups;
  }, [timelineEvents]);


  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Event', 'Shop Name', 'Worker Name', 'Notes', 'Photo URL'];
    const data = timelineEvents.map(v => [
      new Date(v.timestamp).toLocaleDateString(),
      new Date(v.timestamp).toLocaleTimeString(),
      v.type.toUpperCase(),
      v.shopName || '-',
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
    const data = timelineEvents.map(v => ({
      Date: new Date(v.timestamp).toLocaleDateString(),
      Time: new Date(v.timestamp).toLocaleTimeString(),
      Type: v.type.toUpperCase(),
      'Shop Name': v.shopName || '-',
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

  const stats = useMemo(() => ({
    total: timelineEvents.filter(e => e.type === 'visit').length,
    withPhotos: timelineEvents.filter(v => !!v.photo).length,
    uniqueShops: new Set(timelineEvents.filter(e => e.shopName).map(v => v.shopName)).size,
    uniqueWorkers: new Set(timelineEvents.map(v => v.workerName)).size
  }), [timelineEvents]);

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

      {/* Reports Timeline */}
      <div className="space-y-12 pb-20 mt-10">
        {Object.keys(groupedTimeline).length === 0 ? (
          <div className="bg-slate-900 p-20 text-center rounded-2xl border border-slate-800 shadow-xl">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-800 mb-6" />
            <p className="text-slate-500 font-medium italic">No activities match your filters.</p>
          </div>
        ) : (
          Object.keys(groupedTimeline).map(date => (
            <div key={date} className="space-y-8">
               <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/50 px-3 py-1 rounded-full border border-slate-800">
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 space-y-10 pb-4">
                {groupedTimeline[date].map((item) => {
                  let icon = <Clock size={16} />;
                  let colorClass = 'bg-slate-500';
                  let title = '';
                  let details = null;

                  switch(item.type) {
                    case 'attendance-start': {
                      const workerObj = workers.find(w => w.name === item.workerName);
                      const workerLink = workerObj ? `/worker/${workerObj.id || workerObj._id}` : null;
                      icon = <Play size={16} />;
                      colorClass = 'bg-purple-500';
                      title = 'START WORK';
                      details = (
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm text-slate-400">
                            Attendance marked by {workerLink ? <Link to={workerLink} className="font-bold text-white hover:text-green-500 transition-colors uppercase tracking-tight">{item.workerName}</Link> : <span className="font-bold text-white uppercase tracking-tight">{item.workerName}</span>}
                          </p>
                          {item.photo && (
                            <button onClick={() => setSelectedPhoto(item)} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 hover:border-green-500 transition-all shrink-0">
                              <img src={getImageUrl(item.photo)} className="w-full h-full object-cover" alt="Selfie" />
                            </button>
                          )}
                        </div>
                      );
                      break;
                    }
                    case 'attendance-end': {
                      const workerObj = workers.find(w => w.name === item.workerName);
                      const workerLink = workerObj ? `/worker/${workerObj.id || workerObj._id}` : null;
                      icon = <CheckCircle size={16} />;
                      colorClass = 'bg-green-500';
                      title = 'WORK COMPLETED';
                      details = (
                        <p className="text-sm text-slate-400">
                          {workerLink ? <Link to={workerLink} className="font-bold text-white hover:text-green-500 transition-colors uppercase tracking-tight">{item.workerName}</Link> : <span className="font-bold text-white uppercase tracking-tight">{item.workerName}</span>} finished for the day
                        </p>
                      );
                      break;
                    }
                    case 'visit': {
                      const workerObj = workers.find(w => w.name === item.workerName);
                      const workerLink = workerObj ? `/worker/${workerObj.id || workerObj._id}` : null;
                      icon = <Store size={16} />;
                      colorClass = 'bg-blue-500';
                      title = 'SHOP VISITED';
                      details = (
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <MapPin size={18} className="text-green-500" /> {item.shopName}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">
                                Route: {item.routeName || 'Unknown'} • Worker: {workerLink ? <Link to={workerLink} className="text-slate-400 hover:text-green-500 transition-colors">{item.workerName}</Link> : item.workerName}
                              </p>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-slate-300 italic border-l-2 border-slate-800 pl-4 py-1">{item.notes}</p>
                          )}
                          {item.photo && (
                            <button
                              onClick={() => setSelectedPhoto(item)}
                              className="relative block overflow-hidden rounded-xl bg-slate-800 w-full md:w-64 h-48 border border-slate-700 shadow-lg group"
                            >
                              <img
                                src={getImageUrl(item.photo)}
                                alt="Visit Evidence"
                                loading="lazy"
                                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye size={24} className="text-white" />
                              </div>
                            </button>
                          )}
                        </div>
                      );
                      break;
                    }
                    case 'order': {
                      const workerObj = workers.find(w => w.name === item.workerName);
                      const workerLink = workerObj ? `/worker/${workerObj.id || workerObj._id}` : null;
                      icon = <ShoppingBag size={16} />;
                      colorClass = 'bg-orange-500';
                      title = 'ORDER CREATED';
                      details = (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-slate-300 font-bold">Order placed at {item.shopName}</p>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">{item.totalQuantity} items • by {workerLink ? <Link to={workerLink} className="text-slate-400 hover:text-green-500 transition-colors">{item.workerName}</Link> : item.workerName}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-green-500">₹{(item.totalAmount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                      break;
                    }
                    case 'delivery': {
                      const workerObj = workers.find(w => w.name === item.workerName);
                      const workerLink = workerObj ? `/worker/${workerObj.id || workerObj._id}` : null;
                      icon = <Package size={16} />;
                      colorClass = 'bg-green-600';
                      title = 'DELIVERY COMPLETED';
                      details = (
                        <div>
                          <p className="text-sm text-slate-300 font-bold">Order Delivered to {item.shopName}</p>
                          <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Status: {item.deliveryStatus} • by {workerLink ? <Link to={workerLink} className="text-slate-400 hover:text-green-500 transition-colors">{item.workerName}</Link> : item.workerName}</p>
                        </div>
                      );
                      break;
                    }
                  }

                  return (
                    <div key={item.id} className="relative pl-10">
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-zinc-950 shadow-xl ${colorClass}`} />

                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                         <h4 className={`text-[10px] font-black tracking-widest ${colorClass.replace('bg-', 'text-')} flex items-center gap-2`}>
                           {icon} {title}
                         </h4>
                         <span className="text-[10px] font-bold text-slate-600">
                           {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>

                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-xl backdrop-blur-sm">
                        {details}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPhoto.type === 'visit' ? selectedPhoto.shopName : selectedPhoto.workerName}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {new Date(selectedPhoto.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative aspect-square md:aspect-[4/5] bg-black">
               {selectedPhoto.photo ? (
                 <img
                  src={getImageUrl(selectedPhoto.photo)}
                  className="w-full h-full object-contain"
                  alt="Activity Proof"
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                    <Camera size={64} strokeWidth={1} />
                    <p className="font-bold italic">Photo missing for this activity.</p>
                 </div>
               )}
            </div>

            <div className="p-6 bg-slate-800/50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Activity Type</p>
                  <p className="text-lg font-black text-white">{selectedPhoto.type.replace('-', ' ').toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Captured</p>
                  <p className="text-lg font-black text-green-500">{new Date(selectedPhoto.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
