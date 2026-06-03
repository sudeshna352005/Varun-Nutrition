import React, { useState } from 'react';
import api from '../api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/login', { username, password });
      onLogin(response.data);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex items-center justify-center mt-20 px-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-green-500">Varun Nutritions</h2>
        {error && <p className="text-red-500 mb-6 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white transition-all"
              placeholder="Enter username"
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white transition-all"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-zinc-900 font-bold py-3 rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
          >
            Sign In
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
          <p>Demo Credentials:</p>
          <p>Owner: owner / owner123</p>
          <p>Worker: worker / worker123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
