import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import ShopManagement from './pages/ShopManagement';
import RouteManagement from './pages/RouteManagement';
import AttendanceView from './pages/AttendanceView';
import ReportsView from './pages/ReportsView';
import WorkerDashboard from './pages/WorkerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import WorkerAttendance from './pages/WorkerAttendance';
import WorkerManagement from './pages/WorkerManagement';
import WorkerProfile from './pages/WorkerProfile';
import ProductManagement from './pages/ProductManagement';
import OrdersView from './pages/OrdersView';
import PayrollDashboard from './pages/PayrollDashboard';
import AnalyticsView from './pages/AnalyticsView';
import Settings from './pages/Settings';
import ReturnsDashboard from './pages/ReturnsDashboard';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [workerRole, setWorkerRole] = useState(localStorage.getItem('workerRole') || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role !== 'owner' && !workerRole) {
        if (user.role === 'Sales Worker' || user.role === 'Delivery Staff' || user.role === 'Sales & Delivery') {
          setWorkerRole(user.role);
          localStorage.setItem('workerRole', user.role);
        } else {
          fetchWorkerRole(user.id || user._id);
        }
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('workerRole');
      setWorkerRole('');
    }
  }, [user]);

  const fetchWorkerRole = async (id) => {
    try {
      const res = await api.get('/api/workers');
      const workers = Array.isArray(res.data) ? res.data : [];
      const current = workers.find(w => (w.id || w._id) === id);
      if (current) {
        setWorkerRole(current.role);
        localStorage.setItem('workerRole', current.role);
      }
    } catch (err) {
      console.error("Failed to fetch worker role", err);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
        {user && (
          <Sidebar
            user={user}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          {user && (
            <header className="lg:hidden p-4 flex items-center bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Menu size={24} />
              </button>
              <div className="ml-4 flex items-center gap-2">
                 <img src="/assets/logo.png" alt="VN" className="h-8 w-auto" />
                 <span className="font-bold text-sm">Varun Nutritions</span>
              </div>
            </header>
          )}

          <main className={`flex-1 overflow-y-auto ${user ? (isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72') : ''} transition-all duration-300`}>
             <div className={`max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-10`}>
              <Routes>
            <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              user ? (
                user.role === 'owner'
                ? <OwnerDashboard />
                : (workerRole === 'Delivery Staff'
                    ? <DeliveryDashboard user={user} />
                    : <WorkerDashboard user={user} />)
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
            <Route path="/payroll" element={user?.role === 'owner' ? <PayrollDashboard /> : <Navigate to="/" />} />
            <Route path="/analytics" element={user?.role === 'owner' ? <AnalyticsView /> : <Navigate to="/" />} />
            <Route path="/settings" element={user?.role === 'owner' ? <Settings /> : <Navigate to="/" />} />
            <Route path="/returns" element={user?.role === 'owner' ? <ReturnsDashboard /> : <Navigate to="/" />} />

            {/* Worker Routes */}
            <Route path="/worker-attendance" element={user && user.role !== 'owner' ? <WorkerAttendance user={user} /> : <Navigate to="/" />} />
            <Route path="/worker-orders" element={user && user.role !== 'owner' ? <OrdersView user={user} /> : <Navigate to="/" />} />
            <Route path="/worker-deliveries" element={user && (workerRole === 'Delivery Staff' || workerRole === 'Sales & Delivery') ? <DeliveryDashboard user={user} /> : <Navigate to="/" />} />
              </Routes>
             </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
