import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import {
  Settings as SettingsIcon, User, Lock, Shield,
  Building, Download, Eye, EyeOff, Save, CheckCircle,
  AlertCircle, LogOut, RefreshCw, Camera
} from 'lucide-react';
import * as XLSX from 'xlsx';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Account Settings
  const [ownerInfo] = useState({ name: 'Varun Owner', username: 'owner' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);

  // Security Stats
  const [securityStats, setSecurityStats] = useState({ lastLogin: null, lastPasswordChange: null });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'Varun Nutritions',
    contactNumber: '',
    businessAddress: '',
    companyLogo: ''
  });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchSecurityStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      setSystemSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const res = await api.get('/api/owner/security-stats');
      setSecurityStats(res.data);
    } catch (err) {
      console.error("Failed to fetch security stats", err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/owner/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
      fetchSecurityStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('companyName', systemSettings.companyName);
      formData.append('contactNumber', systemSettings.contactNumber);
      formData.append('businessAddress', systemSettings.businessAddress);
      if (logoFile) formData.append('logo', logoFile);

      const res = await api.post('/api/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSystemSettings(res.data);
      setMessage({ type: 'success', text: 'System settings saved' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await api.get(`/api/export/${type}`);
      const ws = XLSX.utils.json_to_sheet(res.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type.toUpperCase());
      XLSX.writeFile(wb, `VN_${type.toUpperCase()}_EXPORT.xlsx`);
    } catch (err) {
      alert("Export failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-green-500" /> Settings & Security
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Configure your enterprise and account security.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold text-sm uppercase tracking-wider">{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto text-xs opacity-50 hover:opacity-100">DISMISS</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'system', label: 'System', icon: Building },
            { id: 'backup', label: 'Backup & Data', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm uppercase tracking-widest ${activeTab === tab.id ? 'bg-green-600 text-zinc-950 shadow-lg shadow-green-600/20' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'account' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                <User className="text-green-500" /> Account Settings
              </h2>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Owner Name</label>
                    <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl text-white font-bold">{ownerInfo.name}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                    <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl text-slate-400 font-bold">{ownerInfo.username}</div>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Change Password</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        required
                        placeholder="Current Password"
                        className="pl-12 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500 outline-none"
                        value={passwords.current}
                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          required
                          placeholder="New Password"
                          className="pl-12 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500 outline-none"
                          value={passwords.new}
                          onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          required
                          placeholder="Confirm New Password"
                          className="pl-12 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500 outline-none"
                          value={passwords.confirm}
                          onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-green-500 uppercase tracking-widest transition-colors"
                    >
                      {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
                    </button>
                  </div>
                  <button
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 text-zinc-950 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Last Login</p>
                    <p className="text-3xl font-black text-white">{securityStats.lastLogin ? new Date(securityStats.lastLogin).toLocaleDateString() : 'Never'}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                       {securityStats.lastLogin ? new Date(securityStats.lastLogin).toLocaleTimeString() : 'N/A'}
                    </p>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Last Password Update</p>
                    <p className="text-3xl font-black text-white">{securityStats.lastPasswordChange ? new Date(securityStats.lastPasswordChange).toLocaleDateString() : 'Never'}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                       {securityStats.lastPasswordChange ? new Date(securityStats.lastPasswordChange).toLocaleTimeString() : 'N/A'}
                    </p>
                 </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
                 <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                    <Shield className="text-green-500" /> Active Security
                 </h2>
                 <p className="text-slate-500 text-sm">Force security measures across all logged-in sessions.</p>
                 <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-700 hover:border-red-500/50">
                       <LogOut size={16} /> Logout from all devices
                    </button>
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-500 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-700 hover:border-yellow-500/50">
                       <RefreshCw size={16} /> Force global password reset
                    </button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-300">
               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                 <Building className="text-green-500" /> System Settings
               </h2>

               <form onSubmit={handleSystemSave} className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
                     <div className="relative group">
                        <div className="w-24 h-24 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 group-hover:border-green-500 transition-all flex items-center justify-center">
                           {systemSettings.companyLogo ? (
                             <img src={getImageUrl(systemSettings.companyLogo)} alt="Logo" className="w-full h-full object-contain" />
                           ) : (
                             <Building size={32} className="text-slate-600" />
                           )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-green-600 text-zinc-950 p-2 rounded-lg cursor-pointer shadow-xl hover:bg-green-500 transition-colors">
                           <Camera size={16} />
                           <input type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
                        </label>
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <h4 className="text-white font-bold">Company Branding</h4>
                        <p className="text-slate-500 text-xs mt-1 italic">Logo will be visible on invoices, reports and the main portal.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                       <input
                         type="text"
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                         value={systemSettings.companyName}
                         onChange={e => setSystemSettings({...systemSettings, companyName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                       <input
                         type="text"
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                         value={systemSettings.contactNumber}
                         onChange={e => setSystemSettings({...systemSettings, contactNumber: e.target.value})}
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Address</label>
                       <textarea
                         rows="3"
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                         value={systemSettings.businessAddress}
                         onChange={e => setSystemSettings({...systemSettings, businessAddress: e.target.value})}
                       />
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 text-zinc-950 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Save System Settings
                  </button>
               </form>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-300">
               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                 <Download className="text-green-500" /> Backup & Data
               </h2>
               <p className="text-slate-500 text-sm mb-10">Export your enterprise data to spreadsheet format for offline reporting and archival.</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'workers', label: 'Export Worker Directory', color: 'border-blue-500/20 hover:bg-blue-500/5' },
                    { id: 'attendance', label: 'Export Attendance Logs', color: 'border-green-500/20 hover:bg-green-500/5' },
                    { id: 'orders', label: 'Export All Orders', color: 'border-orange-500/20 hover:bg-orange-500/5' },
                    { id: 'payroll', label: 'Export Payroll History', color: 'border-purple-500/20 hover:bg-purple-500/5' },
                    { id: 'shops', label: 'Export Shop Directory', color: 'border-slate-500/20 hover:bg-slate-800' },
                  ].map(exportItem => (
                    <button
                      key={exportItem.id}
                      onClick={() => handleExport(exportItem.id)}
                      className={`flex items-center justify-between p-6 bg-slate-800/20 border ${exportItem.color} rounded-2xl transition-all group hover:scale-[1.02]`}
                    >
                       <span className="font-bold text-white uppercase tracking-widest text-xs">{exportItem.label}</span>
                       <Download size={20} className="text-slate-600 group-hover:text-white transition-colors" />
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
