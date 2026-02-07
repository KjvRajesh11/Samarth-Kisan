
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertRecord, SignalLevel } from '../types';
import { getAlertHistory } from '../services/decisionEngine';
import { useLanguage } from '../App';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<AlertRecord[]>([]);
  const { lang, T } = useLanguage();

  useEffect(() => {
    setHistory(getAlertHistory());
  }, []);

  const clearHistory = () => {
    const confirmMsg = lang === 'hi' 
      ? 'क्या आप वाकई अपना अलर्ट इतिहास मिटाना चाहते हैं?' 
      : 'Are you sure you want to clear your alert history?';
    if (confirm(confirmMsg)) {
      localStorage.removeItem('samarth_kisan_history');
      setHistory([]);
    }
  };

  const getSignalColor = (level: SignalLevel) => {
    switch (level) {
      case SignalLevel.SAFE: return 'bg-green-500';
      case SignalLevel.WARNING: return 'bg-yellow-500';
      case SignalLevel.ALERT: return 'bg-red-500';
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto animate-fade-in">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
          >
            <span className="text-xl font-bold">←</span>
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.HISTORY_TITLE}</h1>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-red-600 text-[10px] font-black uppercase tracking-widest p-2 bg-red-50 rounded-lg"
          >
            {T.CLEAR}
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <p className="text-gray-500 font-bold">{T.NO_HISTORY}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div 
              key={record.id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4"
            >
              <div className={`w-3 h-auto rounded-full ${getSignalColor(record.level)} shrink-0`} />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-gray-800 text-sm">{record.crop} - {record.stage}</h3>
                  <span className="text-[8px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium mb-2">{record.reason}</p>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-[8px] font-black text-green-600 uppercase block mb-1">{T.ACTION_TAKEN}</span>
                  <p className="text-[10px] text-gray-700 font-bold leading-tight">{record.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
