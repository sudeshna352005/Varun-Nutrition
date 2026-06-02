import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      axios.get('https://varun-nutrition.onrender.com/api/shops'),
      axios.get('https://varun-nutrition.onrender.com/api/routes'),
      axios.get('https://varun-nutrition.onrender.com/api/visits')
    ]);
    setShops(shopsRes.data);
    setRoutes(routesRes.data);
    setVisitHistory(visitsRes.data.filter(v => v.workerName === user.name));
  };

  const checkWorkingStatus = async () => {
    const res = await axios.get('https://varun-nutrition.onrender.com/api/attendance');
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

await axios.post(
  'https://varun-nutrition.onrender.com/api/visits',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
);
console.log("Visit saved");
window.location.reload();
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
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-gray-600">Here are your assigned routes and shops for today.</p>
      </div>

      {!isWorking && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 flex items-start">
          <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <p className="text-yellow-700">
            <strong>Attendance Required:</strong> Please go to the <a href="/worker-attendance" className="underline font-bold">Attendance</a> page and mark "Start Work" to enable shop visits.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {routes.map(route => {
          const routeShops = shops.filter(s => s.routeGroup === route.name);
          if (routeShops.length === 0) return null;

          return (
            <div key={route.id}>
              <h2 className="text-lg font-bold text-blue-700 flex items-center mb-4">
                <MapPin className="w-5 h-5 mr-2" /> {route.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routeShops.map(shop => (
                  <div 
                    key={shop.id} 
                    className={`bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center ${
                      hasVisitedToday(shop.name) ? 'opacity-60 bg-gray-50' : ''
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-gray-900">{shop.name}</h3>
                      <p className="text-sm text-gray-500">{shop.address}</p>
                      {shop.mapsLink && (
                        <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center mt-1">
                          <ExternalLink className="w-3 h-3 mr-1" /> View Map
                        </a>
                      )}
                    </div>
                    <div>
                      {hasVisitedToday(shop.name) ? (
                        <span className="flex items-center text-green-600 font-medium text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" /> Visited
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedShop(shop)}
                          disabled={!isWorking}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            isWorking 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Visit: {selectedShop.name}</h2>
            <p className="text-gray-500 text-sm mb-4">Add notes about your visit below.</p>
            
            <textarea
              placeholder="e.g., Stock checked, order placed for 50 units."
              
              className="w-full border rounded-md p-3 h-32 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <input
  type="file"
  accept="image/*"
  onChange={(e) => setPhoto(e.target.files[0])}
  className="w-full border rounded-md p-2 mb-4"
/>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedShop(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleVisit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Complete Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
