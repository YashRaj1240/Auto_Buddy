import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWrench, FaHistory } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

export default function Header() {
  const location = useLocation();

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center
                          group-hover:bg-blue-500 transition-colors">
            <FaWrench className="text-white text-sm" />
          </div>
          <div>
            <span className="font-bold text-lg text-white font-['Space_Grotesk']">
              Mech<span className="text-blue-400">AI</span>
            </span>
            <span className="text-xs text-slate-400 block leading-none">by TorqueIQ</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${location.pathname === '/'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            <MdDashboard size={16} />
            Diagnose
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${location.pathname === '/history'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            <FaHistory size={14} />
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
