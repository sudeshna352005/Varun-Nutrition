import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Store, MapPin, ClipboardList, UserCheck, Users } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navLinks = user?.role === 'owner' ? [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Shops', path: '/shops', icon: Store },
    { name: 'Routes', path: '/routes', icon: MapPin },
    { name: 'Workers', path: '/workers', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: ClipboardList },
  ] : [
    { name: 'My Routes', path: '/', icon: MapPin },
    { name: 'Attendance', path: '/worker-attendance', icon: UserCheck },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-xl">Varun Nutritions</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-green-500 transition-colors flex items-center"
                >
                  <link.icon className="w-4 h-4 mr-1" />
                  {link.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-red-500 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-800 hover:text-green-500 flex items-center"
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-slate-800 hover:text-red-500 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
