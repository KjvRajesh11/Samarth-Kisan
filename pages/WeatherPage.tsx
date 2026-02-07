
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeatherData, FarmerProfile } from '../types';
import { fetchWeather } from '../services/weatherService';
import { useLanguage } from '../App';

const WeatherPage: React.FC = () => {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('farmer_profile');
    if (!saved) { navigate('/'); return; }
    const prof: FarmerProfile = JSON.parse(saved);
    setProfile(prof);

    const init = async () => {
      try {
        const w = await fetchWeather(prof.location);
        setWeather(w);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  if (loading || !weather || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black text-gray-800">{T.WEATHER}</h2>
        <p className="text-gray-400 font-bold text-xs uppercase mt-2 tracking-widest animate-pulse">Syncing Clouds...</p>
      </div>
    );
  }

  const getWeatherIcon = (risk: string) => {
    switch (risk) {
      case 'RAIN_LIKELY': return '⛈️';
      case 'HEAT_RISK': return '🔥';
      case 'DRY': return '💨';
      default: return '☀️';
    }
  };

  const getRiskLabel = (risk: string) => {
    if (risk === 'RAIN_LIKELY') return T.RAIN_LIKELY;
    if (risk === 'HEAT_RISK') return T.TEMP_RISK;
    if (risk === 'DRY') return T.HUMIDITY_RISK;
    return T.WEATHER_NORMAL;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'RAIN_LIKELY': return 'bg-blue-600 text-white shadow-blue-100';
      case 'HEAT_RISK': return 'bg-rose-600 text-white shadow-rose-100';
      case 'DRY': return 'bg-orange-500 text-white shadow-orange-100';
      default: return 'bg-emerald-600 text-white shadow-emerald-100';
    }
  };

  const getBadgeStyle = (risk: string) => {
    switch (risk) {
      case 'RAIN_LIKELY': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HEAT_RISK': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DRY': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-slide-up">
      <header className="flex justify-between items-start mb-6 pr-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
          >
            <span className="text-xl font-bold">←</span>
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">{T.WEATHER}</span>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              {profile.location}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Current Weather Card */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 text-9xl opacity-10">☁️</div>
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-7xl mb-4 filter drop-shadow-md">
            {weather.rainForecast > 10 ? '🌧️' : weather.temp > 35 ? '☀️' : '⛅'}
          </span>
          <div className="text-center">
            <h2 className="text-6xl font-black mb-1 leading-none">{weather.temp}°C</h2>
            <p className="text-blue-100 font-black uppercase tracking-widest text-[10px] bg-white/10 px-3 py-1 rounded-full inline-block mt-2">
              {weather.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 text-center">
              <span className="text-[8px] font-black uppercase text-blue-100 block mb-1">Humidity</span>
              <span className="text-xl font-black">{weather.humidity}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 text-center">
              <span className="text-[8px] font-black uppercase text-blue-100 block mb-1">Rain Chance</span>
              <span className="text-xl font-black">{weather.rainForecast}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Day Forecast List */}
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">{T.WEATHER_FORECAST}</h3>
      <div className="space-y-3 mb-8">
        {weather.forecast.map((f, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                {getWeatherIcon(f.risk)}
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-sm uppercase leading-none mb-1">{f.day}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{f.condition}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-gray-900 block leading-none mb-2">{f.temp}°C</span>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${getBadgeStyle(f.risk)}`}>
                {getRiskLabel(f.risk)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Advice Section */}
      <section className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl shadow-sm border border-amber-100">💡</div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{T.WEATHER_ADVICE}</h3>
        </div>
        <p className="text-gray-800 font-bold text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
          {weather.rainForecast > 40 
            ? "Heavy rain expected. Avoid fertilizer application today as it may wash away."
            : weather.temp > 35
            ? "Extreme heat ahead. Increase irrigation frequency in the early morning to protect roots."
            : "Weather looks stable for field activities. Good time for regular maintenance."}
        </p>
      </section>
    </div>
  );
};

export default WeatherPage;
