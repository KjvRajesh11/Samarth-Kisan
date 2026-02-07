
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertRecord, FarmerProfile } from '../types';
import { getAlertHistory } from '../services/decisionEngine';
import { useLanguage } from '../App';

const LogbookPage: React.FC = () => {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const [logs, setLogs] = useState<AlertRecord[]>([]);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('farmer_profile');
    if (saved) setProfile(JSON.parse(saved));
    
    // Logbook is essentially alert history plus action records
    setLogs(getAlertHistory());
  }, []);

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-fade-in">
      <header className="mb-8 pr-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
          >
            <span className="text-xl font-bold">←</span>
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1 block">Diary</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.LOGBOOK_TITLE}</h1>
          </div>
        </div>
      </header>

      {profile && (
        <div className="bg-green-600 rounded-3xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 text-9xl">🚜</div>
          <h2 className="text-lg font-black uppercase mb-1">{profile.crop} Farm</h2>
          <p className="text-xs font-bold text-green-100 uppercase tracking-widest">Started: {new Date(profile.sowingDate).toLocaleDateString()}</p>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-12 text-center">
          <span className="text-5xl mb-6 block opacity-40">📓</span>
          <p className="text-gray-500 font-black uppercase tracking-tighter text-sm">{T.NO_HISTORY}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-100 rounded-full" />

          <div className="space-y-8 relative">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-2xl z-10 shadow-sm ${
                  log.actionTaken === 'TAKEN' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-white border border-gray-200'
                }`}>
                  {log.actionTaken === 'TAKEN' ? '✅' : '📢'}
                </div>
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex-1 relative active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(log.timestamp).toLocaleDateString()} • {log.stage}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-2">{log.reason}</h3>
                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[8px] font-black text-green-600 uppercase block mb-1">Advice</span>
                      <p className="text-[10px] text-gray-700 font-bold leading-tight">{log.action}</p>
                    </div>
                    {log.actionTaken && (
                      <div className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                        log.actionTaken === 'TAKEN' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <span>{log.actionTaken === 'TAKEN' ? '✓' : '○'}</span>
                        {log.actionTaken === 'TAKEN' ? T.ACTION_TAKEN : T.ACTION_NOT_TAKEN}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogbookPage;
