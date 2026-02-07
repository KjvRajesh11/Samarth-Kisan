
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CropType, CropStage, FarmerProfile, Season } from '../types';
import { CROP_LIST, STAGE_LIST, OBSERVED_ISSUES } from '../constants';
import { getRegionNote } from '../services/weatherService';
import { suggestStage } from '../services/decisionEngine';
import { useLanguage } from '../App';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<FarmerProfile>(() => {
    const saved = localStorage.getItem('farmer_profile');
    return saved ? JSON.parse(saved) : {
      crop: CropType.RICE,
      stage: CropStage.SOWING,
      location: '',
      observedIssues: [],
      sowingDate: new Date().toISOString().split('T')[0],
      season: Season.KHARIF
    };
  });

  const hasExistingProfile = !!localStorage.getItem('farmer_profile');

  const calculatedStage = suggestStage(profile.sowingDate, profile.crop);

  const handleIssueToggle = (issue: string) => {
    setProfile(prev => {
      const exists = prev.observedIssues.includes(issue);
      const updated = exists ? prev.observedIssues.filter(i => i !== issue) : [...prev.observedIssues, issue];
      return { ...prev, observedIssues: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('farmer_profile', JSON.stringify(profile));
    setTimeout(() => navigate('/signal'), 800);
  };

  const getCropColor = (crop: CropType) => {
    switch (crop) {
      case CropType.RICE: return { border: 'border-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700' };
      case CropType.WHEAT: return { border: 'border-amber-600', bg: 'bg-amber-50', text: 'text-amber-800' };
      case CropType.COTTON: return { border: 'border-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' };
      case CropType.MAIZE: return { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' };
      case CropType.MUSTARD: return { border: 'border-lime-600', bg: 'bg-lime-50', text: 'text-lime-800' };
      default: return { border: 'border-green-600', bg: 'bg-green-50', text: 'text-green-700' };
    }
  };

  const regionNote = profile.location ? getRegionNote(profile.location) : '';

  return (
    <div className="pb-32 pt-6 px-4 max-w-md mx-auto animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
            <span className="text-xl text-white">🚜</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">{T.APP_NAME}</h1>
            <p className="text-green-600 font-bold text-[8px] uppercase tracking-widest mt-0.5">{T.SUBTITLE}</p>
          </div>
        </div>
        {hasExistingProfile && (
          <button 
            onClick={() => navigate('/signal')}
            className="text-[10px] font-black text-green-600 border border-green-200 bg-green-50 px-3 py-2 rounded-xl uppercase tracking-tight active:scale-95 transition-all"
          >
            Live Signal 📡
          </button>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">{T.SELECT_CROP}</label>
          <div className="grid grid-cols-2 gap-3">
            {CROP_LIST.map((c) => {
              const colors = getCropColor(c as CropType);
              const isSelected = profile.crop === c;
              return (
                <button key={c} type="button" onClick={() => setProfile({ ...profile, crop: c as CropType })}
                  className={`py-4 px-3 rounded-2xl border-4 transition-all flex flex-col items-center justify-center space-y-2 ${isSelected ? `${colors.border} ${colors.bg}` : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                  <span className="text-2xl">{c === 'Rice' ? '🌾' : c === 'Wheat' ? '🍞' : c === 'Cotton' ? '☁️' : c === 'Maize' ? '🌽' : '🌱'}</span>
                  <span className={`font-black text-sm uppercase ${isSelected ? colors.text : 'text-gray-400'}`}>{c}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">{T.SELECT_SEASON}</label>
          <div className="flex gap-2">
            {Object.values(Season).map((s) => (
              <button 
                key={s} 
                type="button" 
                onClick={() => setProfile({ ...profile, season: s })}
                className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${profile.season === s ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{T.SOWING_DATE}</label>
          <input type="date" value={profile.sowingDate} onChange={(e) => setProfile({ ...profile, sowingDate: e.target.value })}
            className="w-full p-4 rounded-xl bg-gray-50 font-black text-gray-800 border-2 border-transparent focus:border-green-600 outline-none" />
          <p className="mt-3 text-[10px] text-green-600 font-black uppercase tracking-tighter">
            {T.STAGE_SUGGESTION} <span className="underline">{calculatedStage}</span>
          </p>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">{T.SELECT_STAGE}</label>
          <div className="space-y-2">
            {STAGE_LIST.map((s) => (
              <button key={s} type="button" onClick={() => setProfile({ ...profile, stage: s as CropStage })}
                className={`w-full p-3 rounded-xl border-2 font-bold text-left flex justify-between items-center ${profile.stage === s ? 'border-green-600 bg-green-50 text-green-900' : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
                <span className="text-sm">{s}</span>
                {profile.stage === s && <span>✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{T.LOCATION}</label>
          <input 
            type="text" 
            value={profile.location} 
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            placeholder="Type district (e.g. Ludhiana)"
            className="w-full p-4 rounded-xl bg-gray-50 font-black text-gray-800 border-2 border-transparent focus:border-green-600 outline-none transition-all" 
          />
          {profile.location && regionNote && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-blue-500">📍</span>
              <p className="text-[10px] font-black uppercase text-blue-700">{regionNote}</p>
            </div>
          )}
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">{T.ISSUES}</label>
          <div className="flex flex-wrap gap-2">
            {OBSERVED_ISSUES.map((issue) => {
              const isActive = profile.observedIssues.includes(issue);
              return (
                <button
                  key={issue}
                  type="button"
                  onClick={() => handleIssueToggle(issue)}
                  className={`px-3 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-tighter transition-all ${
                    isActive 
                      ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-md scale-105' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-amber-200'
                  }`}
                >
                  {issue}
                </button>
              );
            })}
          </div>
        </section>

        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-green-100 active:scale-95 transition-all">
          {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : T.CHECK_STATUS}
        </button>
      </form>
    </div>
  );
};

export default SetupPage;
