import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit2, Trash2, User, Lock, Mail, MapPin, Eye, EyeOff, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    assignedRoutes: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (workerId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  useEffect(() => {
    fetchWorkers();
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/api/routes');
      setRoutes(res.data);
    } catch (err) {
      console.error("Failed to fetch routes", err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/api/workers');
      setWorkers(res.data);
    } catch (err) {
      console.error("Failed to fetch workers", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting worker data:", JSON.stringify(formData, null, 2));
    try {
      if (editingWorker) {
        const workerId = editingWorker.id || editingWorker._id;
        console.log("Updating worker ID:", workerId);
        const res = await api.put(`/api/workers/${workerId}`, formData);
        console.log("Update response received:", JSON.stringify(res.data, null, 2));
      } else {
        const res = await api.post('/api/workers', formData);
        console.log("Create response:", res.data);
      }
      setIsModalOpen(false);
      setEditingWorker(null);
      setFormData({ name: '', username: '', password: '', assignedRoutes: [] });
      setShowPassword(false);
      fetchWorkers();
    } catch (err) {
      console.error("Failed to save worker", err);
    }
  };

  const handleEdit = (worker) => {
    console.log("Editing worker:", worker.name, "Current assignedRoutes:", worker.assignedRoutes);
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      username: worker.username,
      password: '', // Clear password field when editing to avoid sending back the hash
      assignedRoutes: Array.isArray(worker.assignedRoutes) ? [...worker.assignedRoutes] : []
    });
    setIsModalOpen(true);
  };

  const handleRouteChange = (routeName) => {
    setFormData(prev => {
      const currentRoutes = prev.assignedRoutes || [];
      if (currentRoutes.includes(routeName)) {
        return { ...prev, assignedRoutes: currentRoutes.filter(r => r !== routeName) };
      } else {
        return { ...prev, assignedRoutes: [...currentRoutes, routeName] };
      }
    });
  };

  const handleDelete = async (worker) => {
    const workerId = worker.id || worker._id;
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await api.delete(`/api/workers/${workerId}`);
        fetchWorkers();
      } catch (err) {
        console.error("Failed to delete worker", err);
      }
    }
  };

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Worker Management</h1>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Name/Username..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-green-600 text-zinc-900 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Worker
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Password Info</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-500 italic">No workers found.</td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr key={worker.id || worker._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/worker/${worker.id || worker._id}`} className="flex items-center text-green-500 hover:text-green-400 font-bold">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mr-3 text-slate-400 border border-slate-700">
                          <User className="w-4 h-4" />
                        </div>
                        {worker.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 font-medium">
                      {worker.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] truncate max-w-[100px]">
                          {visiblePasswords[worker.id || worker._id] ? worker.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(worker.id || worker._id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-600 hover:text-green-500 transition-colors"
                          title="View Hashed/Stored Password"
                        >
                          {visiblePasswords[worker.id || worker._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(worker)} className="text-blue-500 hover:text-blue-400 p-2 hover:bg-slate-800 rounded-lg transition-colors mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(worker)} className="text-red-500 hover:text-red-400 p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">{editingWorker ? 'Edit Worker' : 'Add New Worker'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      className="pl-12 block w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      className="pl-12 block w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      placeholder="e.g. john_doe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {editingWorker ? 'Password (Leave blank to keep current)' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editingWorker}
                      className="pl-12 pr-12 block w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Routes</label>
                  <div className="grid grid-cols-2 gap-3 mt-2 max-h-40 overflow-y-auto p-2 bg-slate-800 rounded-xl border border-slate-700">
                    {routes.map(route => (
                      <label key={route.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-offset-slate-900"
                          checked={formData.assignedRoutes.includes(route.name)}
                          onChange={() => handleRouteChange(route.name)}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                          <MapPin size={14} className="text-slate-500" /> {route.name}
                        </span>
                      </label>
                    ))}
                    {routes.length === 0 && <p className="text-xs text-slate-500 italic col-span-2">No routes found.</p>}
                  </div>
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingWorker(null); }}
                  className="flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-6 py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
                >
                  {editingWorker ? 'Save Changes' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManagement;
