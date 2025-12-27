
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col justify-between bg-background-dark text-white p-12">
      <div className="h-12 w-full"></div>
      <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
        {/* Reconstructed App Logo from User Image */}
        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
          
          {/* Main Icon Container */}
          <div className="relative z-10 w-32 h-32 bg-[#1c2333] rounded-[32px] flex items-center justify-center shadow-2xl border border-white/5 overflow-hidden">
            {/* Alarm Clock Outline */}
            <span className="material-symbols-outlined text-white text-[84px] absolute" style={{ fontVariationSettings: "'wght' 300" }}>
              alarm
            </span>
            
            {/* Blue Warning Triangle */}
            <div className="relative z-20 mt-2 flex items-center justify-center">
               <span className="material-symbols-outlined text-primary text-[52px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                warning
              </span>
              {/* Exclamation Mark Detail (White) */}
              <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-4 bg-white rounded-full"></div>
              <div className="absolute top-[76%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <h1 className="text-white tracking-tight text-3xl font-extrabold leading-tight text-center pb-3 pt-6 max-w-xs">
          Task-Based Alarm Enforcer
        </h1>
        <p className="text-primary font-medium text-lg leading-tight tracking-[-0.015em] px-4 text-center">
          Wake up. Or else.
        </p>
      </div>
      <div className="w-full flex flex-col items-center gap-4 pb-16">
        <div className="w-full max-w-[200px] h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-full animate-shimmer"></div>
        </div>
        <p className="text-gray-600 text-[10px] font-black tracking-widest uppercase">
          Enforcement Protocol Engaged
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
