
import React from 'react';
import { CropStage, StageProgress } from '../types';
import { STAGE_LIST } from '../constants';
import { useLanguage } from '../App';

interface Props {
  progress: StageProgress;
}

const CropTimeline: React.FC<Props> = ({ progress }) => {
  const { T } = useLanguage();

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{T.CROP_TIMELINE}</h3>
        {progress.nextStage && (
          <div className="text-right">
            <span className="text-[8px] font-black text-green-600 uppercase block">{T.NEXT_STAGE}</span>
            <span className="text-[10px] font-bold text-gray-700">{progress.nextStage}: {progress.daysToNext} {T.DAYS_REMAINING}</span>
          </div>
        )}
      </div>

      <div className="relative pt-6 pb-2">
        {/* Connector Line */}
        <div className="absolute top-[34px] left-0 right-0 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-200 transition-all duration-1000"
            style={{ width: `${STAGE_LIST.indexOf(progress.currentStage) * 33.33 + (progress.percent / 3)}%` }}
          />
        </div>

        {/* Stage Nodes */}
        <div className="flex justify-between relative">
          {STAGE_LIST.map((stage, idx) => {
            const isCurrent = progress.currentStage === stage;
            const isPast = STAGE_LIST.indexOf(progress.currentStage) > idx;
            
            return (
              <div key={stage} className="flex flex-col items-center z-10">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  isCurrent ? 'bg-green-600 border-white ring-4 ring-green-100' : 
                  isPast ? 'bg-green-500 border-white' : 'bg-white border-gray-200'
                }`}>
                  {(isPast || isCurrent) && <span className="text-[8px] text-white">✓</span>}
                </div>
                <span className={`text-[8px] mt-2 font-black uppercase tracking-tighter text-center max-w-[60px] ${
                  isCurrent ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {stage.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CropTimeline;
