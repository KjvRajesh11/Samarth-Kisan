
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SetupPage from './pages/SetupPage';
import SignalPage from './pages/SignalPage';
import HistoryPage from './pages/HistoryPage';
import WeatherPage from './pages/WeatherPage';
import ActionTrackerPage from './pages/ActionTrackerPage';
import RiskMonitorPage from './pages/RiskMonitorPage';
import SimulatorPage from './pages/SimulatorPage';
import ChatPage from './pages/ChatPage';
import ScanPage from './pages/ScanPage';
import NotificationsPage from './pages/NotificationsPage';
import { Language, DICTIONARY } from './constants';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  T: typeof DICTIONARY['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

const LanguageSelector: React.FC = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="fixed top-4 right-4 z-[110] flex bg-white/90 backdrop-blur shadow-md border border-gray-100 rounded-full p-1 overflow-hidden">
      <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-full text-[8px] font-black ${lang === 'en' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>EN</button>
      <button onClick={() => setLang('hi')} className={`px-2 py-1 rounded-full text-[8px] font-black ${lang === 'hi' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>हिन्दी</button>
      <button onClick={() => setLang('te')} className={`px-2 py-1 rounded-full text-[8px] font-black ${lang === 'te' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>తెలుగు</button>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || 'en');
  const setLang = (l: Language) => { setLangState(l); localStorage.setItem('app_lang', l); };
  const T = DICTIONARY[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, T }}>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-green-100">
          <LanguageSelector />
          <div className="max-w-md mx-auto md:pb-8 md:pt-20">
            <Routes>
              <Route path="/" element={<SetupPage />} />
              <Route path="/signal" element={<SignalPage />} />
              <Route path="/risks" element={<RiskMonitorPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/tracker" element={<ActionTrackerPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/scan" element={<ScanPage />} />
            </Routes>
          </div>
          <Navbar />
        </div>
        <style>{`
          @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slide-up { animation: slide-up 0.5s ease-out; }
          .animate-fade-in { animation: fade-in 0.4s ease-out; }
        `}</style>
      </Router>
    </LanguageContext.Provider>
  );
};

export default App;
