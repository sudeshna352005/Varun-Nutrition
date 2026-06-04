import React, { useState, useEffect } from 'react';
import api from '../api';
import { MapPin, CheckCircle, ChevronRight, MessageSquare, ExternalLink, Info } from 'lucide-react';

const WorkerDashboard = ({ user }) => {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);

  useEffect(() => {
    fetchData();
    checkWorkingStatus();
  }, []);

  const fetchData = async () => {
    const [shopsRes, routesRes, visitsRes] = await Promise.all([
      api.get('/api/shops'),
      api.get('/api/routes'),
      api.get('/api/visits')
    ]);
    setShops(shopsRes.data);
    setRoutes(routesRes.data);
    setVisitHistory(visitsRes.data.filter(v => v.workerName === user.name));
    console.log("Visit History:", visitsRes.data);
  };

  const checkWorkingStatus = async () => {
    const res = await api.get('/api/attendance');
    const active = res.data.find(a => a.workerName === user.name && a.status === 'working');
    setIsWorking(!!active);
  };

  const handleVisit = async () => {
    if (!isWorking) {
      alert('You must mark start work in Attendance before visiting shops.');
      return;
    }
    const formData = new FormData();

formData.append('shopName', selectedShop.name);
formData.append('workerName', user.name);
formData.append('notes', notes);

if (photo) {
  formData.append('photo', photo);
}

    await api.post(
      '/api/visits',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    console.log("Visit saved");
    setSelectedShop(null);
    setNotes('');
    setPhoto(null);
    await fetchData();
  };

  const hasVisitedToday = (shopName) => {
    const today = new Date().toLocaleDateString();
    return visitHistory.some(v => v.shopName === shopName && new Date(v.timestamp).toLocaleDateString() === today);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user.name}</h1>
        <p className="text-slate-500">Here are your assigned routes and shops for today.</p>
      </div>

      {!isWorking && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-8 flex items-start">
          <Info className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-500 text-sm">
            <strong className="font-bold uppercase tracking-wider text-xs block mb-1">Attendance Required</strong>
            Please go to the <a href="/worker-attendance" className="underline font-bold">Attendance</a> page and mark "Start Work" to enable shop visits.
          </p>
        </div>
      )}

      <div className="space-y-12">
        {routes.map(route => {
          const routeShops = shops.filter(s => s.routeGroup === route.name);
          if (routeShops.length === 0) return null;

          return (
            <div key={route.id}>
              <h2 className="text-xl font-bold text-green-500 flex items-center mb-6">
                <MapPin className="w-6 h-6 mr-2" /> {route.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routeShops.map(shop => (
                  <div 
                    key={shop.id} 
                    className={`bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex justify-between items-center transition-all ${
                      hasVisitedToday(shop.name) ? 'opacity-40' : 'hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{shop.name}</h3>
                      <p className="text-sm text-slate-500 mb-3">{shop.address}</p>
                      {shop.mapsLink && (
                        <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400 flex items-center transition-colors">
                          <ExternalLink className="w-3 h-3 mr-1" /> View Map
                        </a>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {hasVisitedToday(shop.name) ? (
                        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Visited</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedShop(shop)}
                          disabled={!isWorking}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                            isWorking 
                            ? 'bg-green-600 text-zinc-900 hover:bg-green-500 shadow-lg shadow-green-600/20'
                            : 'bg-slate-800 text-zinc-600 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          Mark Visit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedShop && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-white">Visit: {selectedShop.name}</h2>
            <p className="text-slate-500 text-sm mb-6 uppercase tracking-wider font-bold">Log visit details</p>
            
            <textarea
              placeholder="e.g., Stock checked, order placed for 50 units."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 h-32 mb-6 focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-zinc-600 transition-all"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-all cursor-pointer"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedShop(null)}
                className="flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleVisit}
                className="flex-[2] px-6 py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" /> Finish Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
