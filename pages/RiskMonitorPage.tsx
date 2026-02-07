
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RuleOutput, FarmerProfile, WeatherData, SignalLevel } from '../types';
import { fetchWeather } from '../services/weatherService';
import { getActiveRisks } from '../services/decisionEngine';
import { useLanguage } from '../App';

const RiskMonitorPage: React.FC = () => {
  const navigate = useNavigate();
  const { T, lang } = useLanguage();
  const [risks, setRisks] = useState<RuleOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('farmer_profile');
    if (!saved) { navigate('/'); return; }
    const prof: FarmerProfile = JSON.parse(saved);

    const init = async () => {
      try {
        const w = await fetchWeather(prof.location);
        const activeRisks = getActiveRisks(prof, w, lang);
        setRisks(activeRisks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, lang]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        {/* Fixed: Replaced undefined RISK_MONITOR_TITLE with existing RISK_MONITOR_TAB */}
        <h2 className="text-xl font-black text-gray-800">{T.RISK_MONITOR_TAB}</h2>
        <p className="text-gray-400 font-bold text-xs uppercase mt-2 tracking-widest animate-pulse">Scanning Hazards...</p>
      </div>
    );
  }

  const getSeverityLabel = (level: SignalLevel) => {
    switch (level) {
      case SignalLevel.ALERT: return T.SEVERITY_HIGH;
      case SignalLevel.WARNING: return T.SEVERITY_MEDIUM;
      default: return T.SEVERITY_LOW;
    }
  };

  const getSeverityStyle = (level: SignalLevel) => {
    switch (level) {
      case SignalLevel.ALERT: return 'bg-red-50 text-red-700 border-red-200';
      case SignalLevel.WARNING: return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getIcon = (level: SignalLevel) => {
    switch (level) {
      case SignalLevel.ALERT: return '🚨';
      case SignalLevel.WARNING: return '⚠️';
      default: return '✅';
    }
  };

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-fade-in">
      <header className="flex justify-between items-center mb-8 pr-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
          >
            <span className="text-xl font-bold">←</span>
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1 block">Shield</span>
            {/* Fixed: Replaced undefined RISK_MONITOR_TITLE with existing RISK_MONITOR_TAB */}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.RISK_MONITOR_TAB}</h1>
          </div>
        </div>
      </header>

      {risks.length === 0 ? (
        <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-[32px] p-12 text-center animate-fade-in">
          <span className="text-6xl mb-6 block">🛡️</span>
          <h2 className="text-xl font-black text-green-900 uppercase tracking-tighter mb-2">{T.SAFE_TITLE}</h2>
          <p className="text-green-700 font-bold text-sm leading-relaxed">No critical field risks detected right now. Your crop is safe.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest px-2">Urgent Threat Assessment</p>
          {risks.map((risk, idx) => (
            <div 
              key={idx} 
              className={`bg-white rounded-[32px] p-6 shadow-sm border-2 relative overflow-hidden active:scale-[0.98] transition-all ${risk.level === SignalLevel.ALERT ? 'border-red-100' : 'border-amber-100'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${risk.level === SignalLevel.ALERT ? 'bg-red-50' : 'bg-amber-50'}`}>
                    {getIcon(risk.level)}
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${getSeverityStyle(risk.level)}`}>
                      {getSeverityLabel(risk.level)}
                    </span>
                    <h3 className="font-black text-gray-900 text-lg leading-tight mt-1">{risk.ruleKey?.replace('_', ' ') || 'Field Threat'}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Reason</span>
                  <p className="text-sm font-bold text-gray-800 leading-snug">{risk.reason}</p>
                </div>
                
                <div className={`p-4 rounded-2xl border ${risk.level === SignalLevel.ALERT ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                  <span className={`text-[8px] font-black uppercase block mb-1 ${risk.level === SignalLevel.ALERT ? 'text-red-600' : 'text-amber-600'}`}>Impact if Ignored</span>
                  <p className="text-xs font-bold text-gray-700 leading-relaxed">{risk.impact}</p>
                </div>

                <button 
                  onClick={() => navigate('/signal')}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all text-white ${risk.level === SignalLevel.ALERT ? 'bg-red-600' : 'bg-amber-500'}`}
                >
                  View Action Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reassurance Footer */}
      <footer className="mt-12 text-center px-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
          The Risk Monitor updates automatically as weather and crop stages change. Check back daily.
        </p>
      </footer>
    </div>
  );
};

export default RiskMonitorPage;
