
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../App';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { T } = useLanguage();

  const navItems = [
    { path: '/', label: T.CROP_SETUP, icon: '🌱' },
    { path: '/simulator', label: T.SIMULATOR_TAB, icon: '🧪' },
    { path: '/tracker', label: T.TRACKER_TAB, icon: '📋' },
    { path: '/notifications', label: T.NOTIFICATIONS_TAB, icon: '🔔' },
    { path: '/history', label: T.PAST_ALERTS, icon: '📜' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 min-w-[64px] h-full transition-colors ${
                isActive ? 'text-green-600 border-t-4 border-green-600 md:border-t-0 md:border-b-4' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  );
};

export default Navbar;
