import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit2, Trash2, User, Lock, Mail, MapPin, Eye, EyeOff, Search, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'route-assigned', 'no-route'
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Sales Worker',
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
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch routes", err);
      setRoutes([]);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/api/workers');
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch workers", err);
      setWorkers([]);
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
      setFormData({ name: '', username: '', password: '', role: 'Sales Worker', assignedRoutes: [] });
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
      role: worker.role || 'Sales Worker',
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

  const filteredWorkers = (Array.isArray(workers) ? workers : []).filter(w => {
    const matchesSearch = (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.username || '').toLowerCase().includes(searchTerm.toLowerCase());

    const hasRoutes = w.assignedRoutes && w.assignedRoutes.length > 0;
    let matchesStatus = true;
    if (statusFilter === 'route-assigned') matchesStatus = hasRoutes;
    if (statusFilter === 'no-route') matchesStatus = !hasRoutes;

    let matchesRole = true;
    const workerRole = w.role || 'Sales Worker'; // Fallback for legacy workers
    if (roleFilter !== 'all') matchesRole = workerRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

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
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full md:w-auto">
            {['all', 'route-assigned', 'no-route'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 px-3 py-1.5 text-[9px] uppercase font-bold rounded-lg transition-all ${statusFilter === f ? 'bg-green-600 text-slate-900' : 'text-slate-500 hover:text-white'}`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full md:w-auto">
            {['all', 'Sales Worker', 'Delivery Staff'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`flex-1 px-3 py-1.5 text-[9px] uppercase font-bold rounded-lg transition-all ${roleFilter === r ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {r === 'all' ? 'All Roles' : r.split(' ')[0]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-green-600 text-zinc-900 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Worker
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Password Info</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(Array.isArray(filteredWorkers) ? filteredWorkers : []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500 italic">No workers found.</td>
                </tr>
              ) : (
                (Array.isArray(filteredWorkers) ? filteredWorkers : []).map((worker) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        (worker.role || 'Sales Worker') === 'Delivery Staff' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {worker.role || 'Sales Worker'}
                      </span>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {(Array.isArray(filteredWorkers) ? filteredWorkers : []).length === 0 ? (
          <div className="bg-slate-900 p-10 text-center rounded-2xl border border-slate-800 text-slate-500 italic">No workers found.</div>
        ) : (
          (Array.isArray(filteredWorkers) ? filteredWorkers : []).map((worker) => (
            <div key={worker.id || worker._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <Link to={`/worker/${worker.id || worker._id}`} className="flex items-center text-green-500 font-bold">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mr-3 border border-slate-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg">{worker.name}</p>
                    <p className="text-xs text-slate-500 font-normal">{worker.username}</p>
                  </div>
                </Link>
                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                  (worker.role || 'Sales Worker') === 'Delivery Staff' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {worker.role || 'Sales Worker'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-slate-500" />
                  <span className="font-mono text-[10px] text-slate-500">
                    {visiblePasswords[worker.id || worker._id] ? worker.password : '••••••••'}
                  </span>
                  <button
                    onClick={() => togglePasswordVisibility(worker.id || worker._id)}
                    className="p-1 text-slate-600 hover:text-green-500"
                  >
                    {visiblePasswords[worker.id || worker._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(worker)} className="p-2 bg-slate-800 text-blue-500 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(worker)} className="p-2 bg-slate-800 text-red-500 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <select
                      className="pl-12 block w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="Sales Worker">Sales Worker</option>
                      <option value="Delivery Staff">Delivery Staff</option>
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none">
                       <User size={16} className="text-slate-600" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {formData.role === 'Delivery Staff' ? 'Assign Delivery Areas' : 'Assign Routes'}
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-2 max-h-40 overflow-y-auto p-2 bg-slate-800 rounded-xl border border-slate-700">
                    {(Array.isArray(routes) ? routes : []).map(route => (
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
