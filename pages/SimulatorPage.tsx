
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CropStage, CropType, WeatherData, FarmerProfile, SignalLevel, RuleOutput, Season } from '../types';
import { STAGE_LIST, CROP_LIST } from '../constants';
import { analyzeCropStatus } from '../services/decisionEngine';
import { useLanguage } from '../App';

const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { T, lang } = useLanguage();
  const [stage, setStage] = useState<CropStage>(CropStage.GROWTH);
  const [crop, setCrop] = useState<CropType>(CropType.RICE);
  const [weatherType, setWeatherType] = useState<'CLEAR' | 'RAIN' | 'HEAT' | 'HUMID' | 'FLOOD' | 'PEST_SURGE' | 'NUTRIENT' | 'BLAST' | 'RUST'>('CLEAR');
  const [result, setResult] = useState<RuleOutput | null>(null);

  useEffect(() => {
    simulate();
  }, [stage, crop, weatherType]);

  const simulate = () => {
    const mockWeather: WeatherData = {
      temp: 28,
      humidity: 60,
      rainForecast: 0,
      description: 'Clear Skies',
      forecast: []
    };

    const issues: string[] = [];

    if (weatherType === 'RAIN') {
      mockWeather.rainForecast = 15;
      mockWeather.description = 'Light Rain';
    } else if (weatherType === 'HEAT') {
      mockWeather.temp = 42;
      mockWeather.description = 'Extreme Heatwave';
    } else if (weatherType === 'HUMID') {
      mockWeather.humidity = 92;
      mockWeather.description = 'Extreme Humidity';
    } else if (weatherType === 'FLOOD') {
      mockWeather.rainForecast = 65;
      mockWeather.description = 'Monsoon Cloudburst';
    } else if (weatherType === 'PEST_SURGE') {
      mockWeather.humidity = 85;
      mockWeather.temp = 25;
      mockWeather.description = 'Pest Friendly Weather';
    } else if (weatherType === 'NUTRIENT') {
      issues.push('Yellowing leaves');
    } else if (weatherType === 'BLAST') {
      mockWeather.humidity = 88;
      mockWeather.temp = 22;
      mockWeather.description = 'Cool Humid (Blast Risk)';
    } else if (weatherType === 'RUST') {
      mockWeather.humidity = 75;
      mockWeather.temp = 18;
      mockWeather.description = 'Moderate Humid (Rust Risk)';
    }

    const mockProfile: FarmerProfile = {
      crop,
      stage,
      location: 'Simulator',
      observedIssues: issues,
      sowingDate: new Date().toISOString(),
      season: Season.KHARIF
    };

    const analysis = analyzeCropStatus(mockProfile, mockWeather, lang);
    setResult(analysis);
  };

  const getSignalColor = (level: SignalLevel) => {
    switch (level) {
      case SignalLevel.ALERT: return 'bg-red-600';
      case SignalLevel.WARNING: return 'bg-amber-500';
      default: return 'bg-green-600';
    }
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-md mx-auto animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.SIMULATOR_TITLE}</h1>
        <p className="text-gray-600 font-bold text-[10px] uppercase tracking-widest">{T.SIMULATOR_DESC}</p>
      </header>

      <div className="space-y-6">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[11px] font-black text-gray-600 mb-4 uppercase tracking-widest border-b pb-2">Simulator Settings</label>
          <div className="space-y-5">
            <div>
              <span className="text-[12px] font-black uppercase text-gray-900 block mb-2">1. Select Crop</span>
              <select 
                value={crop} 
                onChange={(e) => setCrop(e.target.value as CropType)}
                className="w-full p-4 rounded-xl bg-gray-50 font-black text-gray-900 outline-none border-2 border-gray-300 focus:border-green-600 appearance-none shadow-sm focus:bg-white transition-colors"
              >
                {CROP_LIST.map(c => <option key={c} value={c} className="text-gray-900 font-bold">{c}</option>)}
              </select>
            </div>
            <div>
              <span className="text-[12px] font-black uppercase text-gray-900 block mb-2">2. Current Stage</span>
              <select 
                value={stage} 
                onChange={(e) => setStage(e.target.value as CropStage)}
                className="w-full p-4 rounded-xl bg-gray-50 font-black text-gray-900 outline-none border-2 border-gray-300 focus:border-green-600 appearance-none shadow-sm focus:bg-white transition-colors"
              >
                {STAGE_LIST.map(s => <option key={s} value={s} className="text-gray-900 font-bold">{s}</option>)}
              </select>
            </div>
            <div>
              <span className="text-[12px] font-black uppercase text-gray-900 block mb-3">3. Test Scenario</span>
              <div className="grid grid-cols-2 gap-3">
                {['CLEAR', 'RAIN', 'HEAT', 'HUMID', 'FLOOD', 'PEST_SURGE', 'NUTRIENT', 'BLAST', 'RUST'].map(w => (
                  <button 
                    key={w}
                    onClick={() => setWeatherType(w as any)}
                    className={`p-4 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                      weatherType === w 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]' 
                        : 'bg-white border-gray-200 text-gray-800 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {w.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {result && (
          <section className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 animate-slide-up">
            <div className={`p-8 text-center text-white ${getSignalColor(result.level)}`}>
              <span className="text-6xl block mb-4">
                {result.level === SignalLevel.SAFE ? '✅' : result.level === SignalLevel.WARNING ? '⚠️' : '🚨'}
              </span>
              <h2 className="text-3xl font-black uppercase">{result.level}</h2>
              <p className="text-[11px] font-black uppercase tracking-widest mt-1 opacity-95">{result.urgency}</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observation</span>
                <p className="text-gray-900 font-bold text-lg leading-snug">{result.reason}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-2">Recommended Action</span>
                <p className="text-gray-900 font-black text-xl leading-tight">{result.action}</p>
              </div>
              {result.consequence && (
                <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
                  <span className="text-[9px] font-black text-red-600 uppercase block mb-1">Impact if Ignored</span>
                  <p className="text-[12px] font-bold text-gray-700 leading-relaxed">
                    {result.impact} <br/> 
                    <span className="text-red-700 font-black uppercase mt-1 inline-block">Expected: {result.consequence}</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SimulatorPage;
