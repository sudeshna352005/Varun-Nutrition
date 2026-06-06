import React, { useState } from 'react';
import api from '../api';
import Brand from '../components/Brand';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/api/login', { username, password });
      onLogin(response.data);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Invalid username or password');
      } else if (err.request) {
        setError('Server is not responding. Please check your internet or try again later.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center mt-20 px-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Brand size="md" />
        </div>
        {error && <p className="text-red-500 mb-6 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white transition-all"
              placeholder="Enter username"
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white transition-all pr-12"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-zinc-900 font-bold py-3 rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
          >
            Sign In
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
          <p>Demo Credentials:</p>
          <p>Owner: owner / owner123</p>
          <p>Worker: worker / worker123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
