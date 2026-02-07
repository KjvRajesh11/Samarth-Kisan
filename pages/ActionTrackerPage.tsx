
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertRecord, SignalLevel } from '../types';
import { getAlertHistory, updateActionStatus } from '../services/decisionEngine';
import { useLanguage } from '../App';

const ActionTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<AlertRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'logbook'>('pending');
  const { T } = useLanguage();

  useEffect(() => {
    setHistory(getAlertHistory());
  }, []);

  const handleStatusToggle = (id: string, status: 'TAKEN' | 'NOT_TAKEN') => {
    updateActionStatus(id, status);
    setHistory(prev => prev.map(h => h.id === id ? { ...h, actionTaken: status } : h));
  };

  const pendingActions = history.filter(h => h.level !== SignalLevel.SAFE && h.actionTaken === 'PENDING');
  const pastLog = history.filter(h => h.actionTaken !== 'PENDING' || h.level === SignalLevel.SAFE);

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-fade-in">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
          >
            ←
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1 block">Activity</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.TRACKER_TITLE}</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
            activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
          }`}
        >
          {T.TRACKER_PENDING} ({pendingActions.length})
        </button>
        <button 
          onClick={() => setActiveTab('logbook')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
            activeTab === 'logbook' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
          }`}
        >
          {T.TRACKER_LOGBOOK}
        </button>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-6">
          {pendingActions.length === 0 ? (
            <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center shadow-sm">
              <span className="text-5xl mb-6 block opacity-40">✅</span>
              <p className="text-gray-500 font-black uppercase tracking-tighter text-sm">All Tasks Done</p>
            </div>
          ) : (
            pendingActions.map((record) => (
              <div key={record.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                      {new Date(record.timestamp).toLocaleDateString()} • {record.stage}
                    </span>
                    <h3 className="font-black text-gray-900 text-lg leading-tight">{record.crop} Alert</h3>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                  <span className="text-[8px] font-black text-green-600 uppercase block mb-1">{T.RECOMMENDED_ACTION}</span>
                  <p className="text-xs text-gray-800 font-bold leading-relaxed">{record.action}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatusToggle(record.id, 'TAKEN')}
                    className="flex-1 py-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100 active:scale-95"
                  >
                    Mark Done
                  </button>
                  <button 
                    onClick={() => handleStatusToggle(record.id, 'NOT_TAKEN')}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase active:scale-95"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="relative">
          {pastLog.length === 0 ? (
             <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center shadow-sm">
                <span className="text-5xl mb-6 block opacity-40">📓</span>
                <p className="text-gray-500 font-black uppercase tracking-tighter text-sm">Empty History</p>
             </div>
          ) : (
            <>
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-100 rounded-full" />
              <div className="space-y-8 relative">
                {pastLog.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-2xl z-10 shadow-sm ${
                      log.actionTaken === 'TAKEN' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-white border border-gray-200'
                    }`}>
                      {log.actionTaken === 'TAKEN' ? '✅' : log.level === SignalLevel.SAFE ? '🌱' : '⚠️'}
                    </div>
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex-1 relative active:scale-[0.98] transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleDateString()} • {log.stage}
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-sm mb-2 leading-snug">{log.reason}</h3>
                      <div className={`text-[10px] font-black uppercase ${
                        log.actionTaken === 'TAKEN' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {log.actionTaken === 'TAKEN' ? T.ACTION_TAKEN : log.actionTaken === 'NOT_TAKEN' ? T.ACTION_NOT_TAKEN : 'Safe'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionTrackerPage;
