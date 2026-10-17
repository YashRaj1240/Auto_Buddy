import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWrench, FaHistory, FaDownload } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

export default function Header({ language = 'en', onLanguageChange = () => {} }) {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

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

        {/* Nav & Install Button */}
        <nav className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all mr-2"
            >
              <FaDownload size={14} />
              Install App
            </button>
          )}
          
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5 text-xs mr-1 sm:mr-2 shadow-inner">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                language === 'hi'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="हिंदी में बदलें (Switch to Hindi)"
            >
              🇮🇳 हिंदी
            </button>
          </div>

          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${location.pathname === '/'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            <MdDashboard size={16} />
            <span className="hidden sm:inline">Diagnose</span>
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${location.pathname === '/history'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            <FaHistory size={14} />
            <span className="hidden sm:inline">History</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
