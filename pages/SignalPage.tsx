
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerProfile, WeatherData, RuleOutput, SignalLevel, AlertRecord, StageProgress, Transaction, MarketPrice, CropType } from '../types';
import { fetchWeather } from '../services/weatherService';
import { analyzeCropStatus, saveAlertToHistory, updateFeedback, getStageProgress } from '../services/decisionEngine';
import { getMarketPrice } from '../services/marketService';
import { generateSpeech, playTTS } from '../services/aiService';
import { useLanguage } from '../App';
import CropTimeline from '../components/CropTimeline';

const SignalPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang, T } = useLanguage();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [result, setResult] = useState<RuleOutput | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [progress, setProgress] = useState<StageProgress | null>(null);
  const [market, setMarket] = useState<MarketPrice | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('farmer_profile');
    if (!saved) { navigate('/'); return; }
    const prof: FarmerProfile = JSON.parse(saved);
    setProfile(prof);

    const init = async () => {
      try {
        let w: WeatherData;
        if (navigator.onLine) {
          w = await fetchWeather(prof.location);
          localStorage.setItem('last_weather', JSON.stringify(w));
        } else {
          w = JSON.parse(localStorage.getItem('last_weather') || '{}');
        }
        setWeather(w);

        const analysis = analyzeCropStatus(prof, w, lang);
        setResult(analysis);
        
        const prog = getStageProgress(prof.sowingDate, prof.crop);
        setProgress(prog);

        const m = getMarketPrice(prof.crop, prof.location);
        setMarket(m);

        const id = Math.random().toString(36).substr(2, 9);
        setCurrentId(id);
        const record: AlertRecord = {
          id,
          crop: prof.crop,
          stage: prof.stage,
          location: prof.location,
          timestamp: Date.now(),
          ...analysis
        };
        saveAlertToHistory(record);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    init();
  }, [navigate, lang]);

  const handleTTS = async () => {
    if (isPlayingTTS) {
      currentAudio?.stop();
      setIsPlayingTTS(false);
      return;
    }

    if (!result) return;
    setIsPlayingTTS(true);
    try {
      const audioText = `${result.reason}. ${result.action}`;
      const base64 = await generateSpeech(audioText);
      if (base64) {
        const source = await playTTS(base64);
        setCurrentAudio(source);
        source.onended = () => setIsPlayingTTS(false);
      } else {
        setIsPlayingTTS(false);
      }
    } catch (e) {
      setIsPlayingTTS(false);
    }
  };

  const handleFeedback = () => {
    if (currentId) {
      updateFeedback(currentId);
      setFeedbackDone(true);
    }
  };

  const getCropTextStyle = (crop: CropType) => {
    switch (crop) {
      case CropType.RICE: return 'text-emerald-700';
      case CropType.WHEAT: return 'text-amber-700';
      case CropType.COTTON: return 'text-indigo-700';
      case CropType.MAIZE: return 'text-orange-700';
      case CropType.MUSTARD: return 'text-lime-700';
      default: return 'text-gray-900';
    }
  };

  if (loading || !result || !profile || !progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black text-gray-800">{T.APP_NAME}</h2>
        <p className="text-gray-400 font-bold text-xs uppercase mt-2 tracking-widest animate-pulse">Scanning Field...</p>
      </div>
    );
  }

  const getSignalStyles = (level: SignalLevel) => {
    switch (level) {
      case SignalLevel.SAFE: return { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-900', icon: '✅', label: T.SAFE_TITLE };
      case SignalLevel.WARNING: return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-900', icon: '⚠️', label: T.WARNING_TITLE };
      case SignalLevel.ALERT: return { bg: 'bg-red-600', light: 'bg-red-50', text: 'text-red-900', icon: '🚨', label: T.ALERT_TITLE };
    }
  };

  const style = getSignalStyles(result.level);
  const cropTextClass = getCropTextStyle(profile.crop);

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-slide-up">
      {isOffline && (
        <div className="bg-red-50 text-red-700 text-[10px] font-black uppercase text-center py-2 rounded-xl border border-red-100 mb-4 animate-fade-in">
          ⚠️ {T.OFFLINE_BANNER}
        </div>
      )}

      <header className="flex justify-between items-start mb-6 pr-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm">
            <span className="text-xl font-bold">←</span>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600">{T.LIVE_STATUS}</span>
              {profile.season && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase">{profile.season}</span>}
            </div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${cropTextClass}`}>
              {profile.crop} 
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{profile.stage}</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">📍 {profile.location}</p>
          </div>
        </div>
      </header>

      <CropTimeline progress={progress} />

      <div className={`rounded-[32px] p-6 mb-6 text-center border-2 ${style.light} shadow-lg relative overflow-hidden flex flex-col items-center`}>
        <div className={`w-20 h-20 ${style.bg} rounded-full flex items-center justify-center shadow-xl mb-4 border-4 border-white`}>
          <span className="text-4xl">{style.icon}</span>
        </div>
        <h2 className={`text-2xl font-black ${style.text} uppercase tracking-tight`}>{style.label}</h2>
        <button 
          onClick={handleTTS}
          className="mt-4 bg-white/50 backdrop-blur border border-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-2 active:scale-95 transition-all"
        >
          {isPlayingTTS ? '🔇' : '🔊'} {isPlayingTTS ? T.STOP_LISTEN : T.LISTEN_BTN}
        </button>
      </div>

      <div className="space-y-4">
        {/* Recommended Action */}
        <section className={`${style.bg} p-6 rounded-[32px] text-white shadow-xl relative`}>
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-[10px] font-black text-white/70 uppercase tracking-wider">{T.RECOMMENDED_ACTION}</h3>
            {result.isLowCost && <span className="bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase">Low Cost Remedy</span>}
          </div>
          <p className="text-white font-black text-xl mb-6 leading-tight">{result.action}</p>
          {!feedbackDone ? (
            <button onClick={handleFeedback} className="w-full bg-white text-gray-900 font-black py-4 rounded-2xl text-sm shadow-sm active:scale-95 transition-all">{T.FEEDBACK_BTN}</button>
          ) : (
            <div className="w-full bg-green-500/50 text-white font-black py-4 rounded-2xl text-sm text-center border-2 border-white/20">{T.FEEDBACK_DONE}</div>
          )}
        </section>

        {/* Agronomist Scan Card */}
        <section 
          onClick={() => navigate('/scan')}
          className="bg-white p-6 rounded-[32px] border-2 border-green-50 shadow-md relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="absolute right-0 top-0 p-8 opacity-10 text-[80px] group-hover:rotate-12 transition-transform">🔬</div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-green-100 group-hover:scale-110 transition-transform">🧬</div>
              <div>
                <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{T.AGRONOMIST_SCAN}</h3>
                <span className="text-[10px] font-bold text-green-600 uppercase">Precision Lab Report</span>
              </div>
              <span className="ml-auto text-green-200 text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-gray-900 font-black text-sm leading-snug">Got pest issues? Scan leaves for a technical diagnosis & prevention plan.</p>
          </div>
        </section>

        {/* Market Report Status Card */}
        {market && (
          <section className="bg-white p-6 rounded-[32px] border-2 border-emerald-50 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-emerald-100">🏪</div>
              <div>
                <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{T.MARKET_ACCESS}</h3>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">State Report Status</span>
              </div>
            </div>
            <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 mb-2">
              <div className="flex justify-between items-baseline mb-2">
                 <span className="text-xl font-black text-emerald-900">₹{market.avgPrice}</span>
                 <span className={`text-[10px] font-black uppercase ${market.trend === 'UP' ? 'text-green-600' : 'text-red-500'}`}>
                    {market.trend === 'UP' ? '↗ ' + T.TREND_UP : '↘ ' + T.TREND_DOWN}
                 </span>
              </div>
              <p className="text-xs font-bold text-gray-700 leading-relaxed italic">
                 {market.stateReport}
              </p>
            </div>
          </section>
        )}

        {/* AI Kisan Sahayak Large Prompt Card */}
        <section 
          onClick={() => navigate('/chat')}
          className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="absolute right-0 bottom-0 opacity-10 text-[100px] translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">🤖</div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">👨‍🌾</div>
              <div>
                <h3 className="text-[12px] font-black text-white uppercase tracking-widest">{T.AI_CHAT_TITLE}</h3>
                <span className="text-[10px] font-bold text-indigo-100 uppercase">Expert Field Support</span>
              </div>
              <span className="ml-auto text-white/50 text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-lg font-black leading-tight mb-2">Ask Kisan Sahayak for deep agronomy secrets.</p>
            <p className="text-[10px] font-bold text-indigo-100 opacity-80">Tap to start conversation</p>
          </div>
        </section>

        {/* Large Risks Section */}
        <section 
          onClick={() => navigate('/risks')}
          className="bg-white p-6 rounded-[32px] border-2 border-red-50 shadow-md relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-red-100 group-hover:scale-110 transition-transform">🚨</div>
            <div>
               {/* Fixed: Replaced undefined RISK_MONITOR_TITLE with existing RISK_MONITOR_TAB */}
               <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{T.RISK_MONITOR_TAB}</h3>
               <span className="text-[10px] font-bold text-red-600 uppercase">Check Urgent Threats</span>
            </div>
            <span className="ml-auto text-red-200 text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-900 font-black text-sm leading-snug">{result.impact || result.reason || "No critical threats detected today."}</p>
            {result.consequence && <p className="text-red-600 text-[10px] font-black uppercase tracking-tight italic">⚠️ {result.consequence}</p>}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setIsExplanationExpanded(!isExplanationExpanded)} className="w-full p-6 flex justify-between items-center transition-colors hover:bg-gray-50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{T.WHY_THIS_ALERT}</h3>
            <span className={`text-gray-400 transition-transform duration-300 ${isExplanationExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {isExplanationExpanded && (
            <div className="px-6 pb-6 animate-fade-in space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Observation Details</span>
                <p className="text-sm font-bold text-gray-800 leading-relaxed">{result.impact || result.reason}</p>
                {result.timeSensitivity && <p className="mt-3 text-[10px] font-black text-red-600 uppercase">{result.timeSensitivity}</p>}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SignalPage;
