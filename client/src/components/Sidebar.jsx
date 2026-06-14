import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LogOut, LayoutDashboard, Store, MapPin,
  ClipboardList, UserCheck, Users, Package,
  ShoppingCart, CreditCard, BarChart, ChevronLeft, ChevronRight
} from 'lucide-react';
import Brand from './Brand';

const Sidebar = ({ user, onLogout, isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const workerRole = localStorage.getItem('workerRole') || '';

  const navLinks = user?.role === 'owner' ? [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart },
    { name: 'Shops', path: '/shops', icon: Store },
    { name: 'Routes', path: '/routes', icon: MapPin },
    { name: 'Workers', path: '/workers', icon: Users },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'Attendance', path: '/attendance', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: ClipboardList },
  ] : (workerRole === 'Delivery Staff' ? [
    { name: 'Deliveries', path: '/', icon: Package },
    { name: 'Attendance', path: '/worker-attendance', icon: UserCheck },
  ] : [
    { name: 'My Routes', path: '/', icon: MapPin },
    { name: 'Orders', path: '/worker-orders', icon: ShoppingCart },
    { name: 'Attendance', path: '/worker-attendance', icon: UserCheck },
  ]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'w-20' : 'w-72'}`}>

        {/* Sidebar Header */}
        <div className="flex flex-col p-6 border-b border-slate-800 relative min-h-[140px] justify-center">
          {!isCollapsed ? (
            <div className="animate-in fade-in duration-500">
               <Brand size="md" className="!gap-4" />
               <p className="text-[10px] font-black text-green-500 tracking-[0.3em] uppercase mt-2 ml-1">Enterprise Portal</p>
            </div>
          ) : (
            <div className="flex justify-center animate-in zoom-in duration-300">
               <img src="/assets/logo.png" alt="VN" className="h-10 w-auto object-contain" />
            </div>
          )}

          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-600 text-zinc-900 rounded-full items-center justify-center shadow-lg hover:bg-green-500 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Close Button (Mobile) */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute right-4 top-6 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-220px)] custom-scrollbar">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${
                isActive(link.path)
                ? 'bg-green-600 text-zinc-950 font-bold shadow-lg shadow-green-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <link.icon className={`shrink-0 ${isCollapsed ? 'mx-auto' : ''} ${isActive(link.path) ? 'text-zinc-950' : 'group-hover:text-green-500'}`} size={22} />
              {!isCollapsed && <span className="text-sm truncate">{link.name}</span>}
              {isCollapsed && isActive(link.path) && (
                <div className="absolute left-0 w-1 h-6 bg-zinc-950 rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="shrink-0 group-hover:rotate-12 transition-transform" size={22} />
            {!isCollapsed && <span className="text-sm font-bold uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
