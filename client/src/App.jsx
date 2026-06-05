import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import ShopManagement from './pages/ShopManagement';
import RouteManagement from './pages/RouteManagement';
import AttendanceView from './pages/AttendanceView';
import ReportsView from './pages/ReportsView';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerAttendance from './pages/WorkerAttendance';
import WorkerManagement from './pages/WorkerManagement';
import WorkerProfile from './pages/WorkerProfile';
import ProductManagement from './pages/ProductManagement';
import OrdersView from './pages/OrdersView';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className="container mx-auto py-6 px-4">
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              user ? (
                user.role === 'owner' ? <OwnerDashboard /> : <WorkerDashboard user={user} />
              ) : <Navigate to="/login" />
            } />

            {/* Owner Routes */}
            <Route path="/shops" element={user?.role === 'owner' ? <ShopManagement /> : <Navigate to="/" />} />
            <Route path="/routes" element={user?.role === 'owner' ? <RouteManagement /> : <Navigate to="/" />} />
            <Route path="/attendance" element={user?.role === 'owner' ? <AttendanceView /> : <Navigate to="/" />} />
            <Route path="/reports" element={user?.role === 'owner' ? <ReportsView /> : <Navigate to="/" />} />
            <Route path="/workers" element={user?.role === 'owner' ? <WorkerManagement /> : <Navigate to="/" />} />
            <Route path="/worker/:id" element={user?.role === 'owner' ? <WorkerProfile /> : <Navigate to="/" />} />
            <Route path="/products" element={user?.role === 'owner' ? <ProductManagement /> : <Navigate to="/" />} />
            <Route path="/orders" element={user?.role === 'owner' ? <OrdersView user={user} /> : <Navigate to="/" />} />

            {/* Worker Routes */}
            <Route path="/worker-attendance" element={user?.role === 'worker' ? <WorkerAttendance user={user} /> : <Navigate to="/" />} />
            <Route path="/worker-orders" element={user?.role === 'worker' ? <OrdersView user={user} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
