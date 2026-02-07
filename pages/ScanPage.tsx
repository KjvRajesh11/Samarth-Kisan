
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../App';
import { runAgronomistScan } from '../services/aiService';
import { AgronomistScanReport } from '../types';

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [report, setReport] = useState<AgronomistScanReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fullData = reader.result as string;
        setImage(fullData);
        const base64 = fullData.split(',')[1];
        setLoading(true);
        try {
          const result = await runAgronomistScan(base64);
          setReport(result);
        } catch (err) {
          alert("Laboratory scan failed. Please check image quality.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-amber-500 text-white';
      default: return 'bg-green-600 text-white';
    }
  };

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto animate-fade-in">
      <header className="flex justify-between items-center mb-8 pr-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm">
            ←
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1 block">Laboratory</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{T.SCAN_TITLE}</h1>
          </div>
        </div>
      </header>

      {!image && !loading && (
        <div className="space-y-6">
          <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
            <span className="text-6xl mb-6">📸</span>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">{T.SCAN_TITLE}</h2>
            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8 px-4">{T.SCAN_DESC}</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 text-white px-8 py-5 rounded-3xl font-black text-sm uppercase shadow-xl shadow-green-100 active:scale-95 transition-all"
            >
              {T.START_SCAN}
            </button>
          </div>
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl">🔬</div>
          </div>
          <h2 className="text-xl font-black text-gray-800 animate-pulse">{T.SCANNING}</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase mt-4 tracking-widest">Consulting Digital Agronomist...</p>
        </div>
      )}

      {report && image && (
        <div className="space-y-6 animate-slide-up">
          {/* Lab Header */}
          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getUrgencyColor(report.urgency)}`}>
                {report.urgency} RISK
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase">Conf: {report.confidence}</span>
            </div>
            
            <div className="flex gap-4 mb-6">
              <img src={image} className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-50" alt="Scan thumbnail" />
              <div>
                <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">{T.DIAGNOSIS}</span>
                <p className="text-lg font-black text-gray-900 leading-tight">{report.diagnosis}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mb-3">{T.ACTION_PLAN}</span>
                <ul className="space-y-3">
                  {report.actionPlan.map((step, idx) => (
                    <li key={idx} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl">
                      <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-green-600 border border-gray-100 shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold text-gray-800 leading-snug">{step}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block mb-2">{T.PREVENTION}</span>
                <p className="text-sm font-bold text-gray-800 leading-relaxed">{report.prevention}</p>
              </div>
            </div>

            <button 
              onClick={() => { setReport(null); setImage(null); }}
              className="w-full mt-8 bg-gray-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Done / New Scan
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
