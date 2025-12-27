
import React from 'react';
import { UserStats } from '../types';

interface Props {
  stats: UserStats;
  onDone: () => void;
}

const CompletionScreen: React.FC<Props> = ({ stats, onDone }) => {
  return (
    <div className="h-full flex flex-col justify-between bg-background-dark p-6 text-white">
      <div className="flex items-center justify-center py-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Task Complete</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 w-full max-w-sm mx-auto animate-fade-in">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[#1c212b] border-4 border-green-500 shadow-2xl shadow-green-900/20">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl"></div>
          <span className="material-symbols-outlined text-green-500 text-[64px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="inline-block animate-bounce mr-2">🔥</span> You’re awake!
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Waking up is the hardest part.
          </p>
        </div>

        <div className="w-full">
          <div className="overflow-hidden rounded-2xl bg-[#282e39] shadow-lg ring-1 ring-white/5">
            <div className="flex items-center justify-between border-b border-white/5 p-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                  <span className="material-symbols-outlined">local_fire_department</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Consistency</p>
                  <p className="text-base font-bold text-white">Daily Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
                <span className="material-symbols-outlined text-[16px] font-bold">arrow_upward</span>
                Today
              </div>
            </div>
            <div className="p-5 pt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter">{stats.currentStreak}</span>
                <span className="text-xl font-medium text-slate-400">days</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-blue-400">Continuing streak...</span>
                </div>
                <div className="h-3 w-full rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-black/20 p-3">
                <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
                <p className="text-sm font-medium text-slate-300">Task verified successfully</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pt-8 pb-4">
        <button 
          onClick={onDone}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          Done
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default CompletionScreen;
