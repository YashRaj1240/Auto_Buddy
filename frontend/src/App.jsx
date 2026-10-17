import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Report from './pages/Report';
import History from './pages/History';
import Header from './components/Header';

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('mechai_lang') || 'en');

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('mechai_lang', lang);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header language={language} onLanguageChange={handleLanguageChange} />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <Routes>
            <Route path="/" element={<Home language={language} onLanguageChange={handleLanguageChange} />} />
            <Route path="/report/:sessionId" element={<Report />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
        <footer className="text-center py-6 text-slate-500 text-sm">
          Built by <span className="text-blue-400 font-semibold">TorqueIQ</span> · Google Cloud AI Builder Cup 2026
        </footer>
      </div>
    </Router>
  );
}

export default App;
