
import React from 'react';

interface Props {
  onAccept: () => void;
}

const CautionScreen: React.FC<Props> = ({ onAccept }) => {
  return (
    <div className="h-full w-full flex flex-col justify-between bg-background-dark p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-50"></div>
          {/* Logo variant for Caution screen */}
          <div className="w-28 h-28 rounded-3xl bg-[#1c2333] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
            <span className="material-symbols-outlined text-white text-[72px] absolute opacity-50">
              alarm
            </span>
            <div className="relative z-20 flex items-center justify-center">
               <span className="material-symbols-outlined text-primary text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
               <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3.5 bg-white rounded-full"></div>
               <div className="absolute top-[76%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-5 max-w-[320px]">
          <h1 className="text-3xl font-black tracking-tight leading-none text-white">Strict Protocol</h1>
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-base font-medium leading-relaxed">
              ⚠️ This alarm is <span className="text-primary font-bold">non-negotiable</span>. You cannot lower the volume or force-quit to stop it.
            </p>
            <p className="text-slate-500 text-sm font-normal leading-normal">
              Completion of the assigned cognitive or physical task is the only way to silence the enforcement sound.
            </p>
          </div>
        </div>

        <div className="mt-12 w-full max-w-[320px]">
          <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-4 text-left backdrop-blur-sm">
            <div className="mt-1 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>lock_clock</span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-white text-sm font-bold leading-tight">Zero Tolerance Active</h2>
              <p className="text-slate-400 text-xs font-normal leading-normal">
                Volume ramps to 100% and stays there until verified.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pb-8 pt-4 z-10">
        <button 
          onClick={onAccept}
          className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-all active:scale-[0.98] shadow-lg shadow-primary/25"
        >
          <span className="relative z-10">I Accept the Terms</span>
          <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
        </button>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span className="material-symbols-outlined text-[14px]">gavel</span>
          <span>Wake-up Accountability System</span>
        </div>
      </div>
    </div>
  );
};

export default CautionScreen;
