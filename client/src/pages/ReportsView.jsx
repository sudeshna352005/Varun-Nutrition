import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api';
import { Calendar, Store, MessageSquare, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReportsView = () => {
  const [visits, setVisits] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchVisits();
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    const res = await api.get('/api/workers');
    setWorkers(res.data);
  };

  const fetchVisits = async () => {
    const res = await api.get('/api/visits');
    setVisits(res.data);
  };

  const filteredVisits = visits.filter(v => 
    new Date(v.timestamp).toISOString().split('T')[0] === selectedDate
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Visit Reports</h1>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl shadow-lg focus-within:ring-2 focus-within:ring-green-500 transition-all">
          <Calendar className="w-5 h-5 mr-3 text-zinc-500" />
          <input
            type="date"
            className="bg-transparent border-none focus:ring-0 text-white text-sm outline-none cursor-pointer"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredVisits.length === 0 ? (
          <div className="bg-zinc-900 p-20 text-center rounded-2xl border border-zinc-800 shadow-xl">
            <ClipboardList className="w-16 h-16 mx-auto text-zinc-800 mb-6" />
            <p className="text-zinc-500 font-medium">No visit reports for {new Date(selectedDate).toLocaleDateString()}</p>
          </div>
        ) : (
          filteredVisits.map((visit) => (
            <div key={visit.id} className="bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-800 hover:border-zinc-700 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center text-white mb-1">
                    <Store className="w-5 h-5 mr-3 text-green-500" /> {visit.shopName}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-blue-500 uppercase tracking-widest">
                      {workers.find(w => w.name === visit.workerName) ? (
                        <Link to={`/worker/${workers.find(w => w.name === visit.workerName).id}`} className="hover:text-green-500 transition-colors">
                          {visit.workerName}
                        </Link>
                      ) : visit.workerName}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-sm text-zinc-400">{new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800">
                <div className="flex items-start gap-4">
                  <MessageSquare className="w-5 h-5 mt-1 text-zinc-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Notes & Evidence</p>
                    <p className="text-zinc-300 mb-4 leading-relaxed">{visit.notes || <span className="italic opacity-60">No notes provided</span>}</p>

                    {visit.photo && (
                      <div className="mt-4">
                        <img
                          src={`${API_BASE_URL}/${visit.photo.replace(/\\/g, '/')}`}
                          alt="Visit Evidence"
                          className="w-48 h-48 object-cover rounded-lg border border-zinc-700 shadow-md hover:scale-105 transition-transform cursor-zoom-in"
                        />
                      </div>
                    )}
                  </div>
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
