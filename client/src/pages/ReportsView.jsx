import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Store, MessageSquare, ClipboardList } from 'lucide-react';

const ReportsView = () => {
  const [visits, setVisits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    const res = await axios.get('https://varun-nutrition.onrender.com/api/visits');
    setVisits(res.data);
  };

  const filteredVisits = visits.filter(v => 
    new Date(v.timestamp).toISOString().split('T')[0] === selectedDate
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Visit Reports</h1>
        <div className="flex items-center bg-white p-2 rounded-md shadow-sm">
          <Calendar className="w-5 h-5 mr-2 text-gray-500" />
          <input
            type="date"
            className="border-none focus:ring-0"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredVisits.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg shadow-sm">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No visit reports for {new Date(selectedDate).toLocaleDateString()}</p>
          </div>
        ) : (
          filteredVisits.map((visit) => (
            <div key={visit.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center">
                    <Store className="w-5 h-5 mr-2 text-blue-600" /> {visit.shopName}
                  </h3>
                  <p className="text-sm text-gray-500">{visit.workerName} • {new Date(visit.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              {visit.notes && (
                <div className="bg-gray-50 p-4 rounded-md flex items-start">
                  <MessageSquare className="w-4 h-4 mr-2 mt-1 text-gray-400" />
                  <div>
  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
    Notes
  </p>

  <p className="text-gray-700">{visit.notes}</p>

  {visit.photo && (
    <img
      src={`https://varun-nutrition.onrender.com/${visit.photo}`}
      alt="Visit"
      className="w-32 h-32 object-cover rounded mt-2"
    />
  )}
</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsView;
