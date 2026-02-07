
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertRecord, SignalLevel } from '../types';
import { getAlertHistory } from '../services/decisionEngine';
import { useLanguage } from '../App';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);

  useEffect(() => {
    // Show only Warnings and Alerts as "Notifications"
    const urgent = getAlertHistory().filter(h => h.level !== SignalLevel.SAFE).slice(0, 15);
    setAlerts(urgent);
  }, []);

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-fade-in">
      <header className="flex justify-between items-center mb-8 pr-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm">
            ←
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">Live Updates</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.NOTIFICATIONS_TITLE}</h1>
          </div>
        </div>
      </header>

      {alerts.length === 0 ? (
        <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center shadow-sm">
          <span className="text-6xl mb-6 block">🔔</span>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">No New Alerts</h2>
          <p className="text-gray-400 font-bold text-sm leading-relaxed px-4">Your field is currently quiet. We will notify you here of any changes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => navigate('/signal')}
              className={`p-5 rounded-[32px] border-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                alert.level === SignalLevel.ALERT ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  alert.level === SignalLevel.ALERT ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {alert.level} • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[8px] font-black text-gray-400">{new Date(alert.timestamp).toLocaleDateString()}</span>
              </div>
              <h3 className="font-black text-gray-900 text-sm leading-snug mb-2">{alert.reason}</h3>
              <p className="text-[10px] font-bold text-gray-600 flex items-center gap-1 uppercase">
                🎯 {T.RECOMMENDED_ACTION}: <span className="underline">{alert.action.substring(0, 30)}...</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
