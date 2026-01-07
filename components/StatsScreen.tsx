
import React, { useMemo } from 'react';
import { UserStats, Alarm, CompletionRecord } from '../types';
import { TASK_INFO } from '../constants';

interface Props {
  stats: UserStats;
  alarms: Alarm[];
  onBack: () => void;
}

// Fixed: Moved ItemCard outside of the component definition to resolve TypeScript 'key' prop errors
const ItemCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-5 glass p-5 rounded-[28px] border-white/5">
    {children}
  </div>
);

const StatsScreen: React.FC<Props> = ({ stats, alarms, onBack }) => {
  const now = new Date();
  
  // Fixed: Added 'now' to dependencies as it's used inside the memoized calculation
  const categorizedActivity = useMemo(() => {
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    const todayCompletions = stats.history.filter(h => h.date.startsWith(today));
    const yesterdayCompletions = stats.history.filter(h => h.date.startsWith(yesterday));

    const upcoming = alarms.filter(a => a.active).map(alarm => {
      const [hStr, mStr] = alarm.time.split(':');
      let h = parseInt(hStr);
      const m = parseInt(mStr);
      if (alarm.period === 'PM' && h !== 12) h += 12;
      if (alarm.period === 'AM' && h === 12) h = 0;

      const alarmTimeToday = new Date(now);
      alarmTimeToday.setHours(h, m, 0, 0);
      
      if (alarm.date) {
        const d = new Date(`${alarm.date}T00:00:00`);
        alarmTimeToday.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      } else {
        const dayIdx = (now.getDay() + 6) % 7;
        if (alarmTimeToday <= now || !(alarm.days.length === 0 || alarm.days.includes(dayIdx))) {
          alarmTimeToday.setDate(alarmTimeToday.getDate() + 1);
        }
      }

      return { alarm, nextTrigger: alarmTimeToday };
    }).sort((a, b) => a.nextTrigger.getTime() - b.nextTrigger.getTime())
    .slice(0, 3);

    return { todayCompletions, yesterdayCompletions, upcoming };
  }, [stats.history, alarms, now]);

  return (
    <div className="h-full flex flex-col text-white zen-gradient overflow-y-auto no-scrollbar">
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 backdrop-blur-3xl border-b border-white/5">
        <button onClick={onBack} className="p-2.5 glass rounded-2xl text-primary hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-[0.2em] uppercase">Your Journey</h1>
        <div className="w-12"></div>
      </header>

      <main className="flex flex-col gap-8 px-6 py-6 pb-20">
        <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-primary to-secondary p-10 shadow-2xl shadow-primary/20">
          <div className="absolute -right-4 -top-4 h-48 w-48 rounded-full bg-white/20 blur-3xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-2">Morning Consistency</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl font-black tracking-tighter text-white">{stats.currentStreak}</span>
                <span className="text-2xl font-black text-white/60 uppercase">Days</span>
              </div>
            </div>
            <div className="h-20 w-20 rounded-[28px] bg-white/20 flex items-center justify-center animate-pulse backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
          </div>
        </section>

        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Cycle Activity</h3>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{categorizedActivity.todayCompletions.length} Completed</span>
            </div>
            <div className="space-y-3">
              {categorizedActivity.todayCompletions.length > 0 ? (
                categorizedActivity.todayCompletions.map((record, i) => {
                  const info = TASK_INFO[record.task];
                  return (
                    <ItemCard key={i}>
                      <div className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                        <span className="material-symbols-outlined">{info.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-black tracking-tight">{record.label}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">{info.label} • {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    </ItemCard>
                  );
                })
              ) : (
                <div className="p-8 text-center glass rounded-[32px] border-dashed">
                  <p className="text-xs text-white/20 font-black uppercase tracking-widest">No signals completed today</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Next Milestones</h3>
            </div>
            <div className="space-y-3">
              {categorizedActivity.upcoming.length > 0 ? (
                categorizedActivity.upcoming.map((item, i) => (
                  <ItemCard key={i}>
                    <div className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-primary/20 text-primary">
                      <span className="material-symbols-outlined">{TASK_INFO[item.alarm.task].icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black tracking-tight">{item.alarm.label}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">
                        {item.nextTrigger.toDateString() === now.toDateString() ? 'Today' : 'Tomorrow'} • {item.alarm.time} {item.alarm.period}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary/40">schedule</span>
                  </ItemCard>
                ))
              ) : (
                <div className="p-8 text-center glass rounded-[32px] border-dashed">
                  <p className="text-xs text-white/20 font-black uppercase tracking-widest">Quiet horizon ahead</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="grid grid-cols-2 gap-5 mt-4">
          <div className="rounded-[32px] glass p-6 border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Personal Record</p>
            <p className="text-3xl font-black text-white tracking-tighter">{stats.bestStreak} <span className="text-xs text-white/20 uppercase">Days</span></p>
          </div>
          <div className="rounded-[32px] glass p-6 border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Total Wakes</p>
            <p className="text-3xl font-black text-white tracking-tighter">{stats.totalWakes} <span className="text-xs text-white/20 uppercase">Wins</span></p>
          </div>
        </section>

        <button className="flex h-18 w-full items-center justify-center gap-3 rounded-[32px] bg-gradient-to-r from-primary to-secondary text-white font-black tracking-widest uppercase text-sm shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all mt-6">
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
          <span>Broadcast Success</span>
        </button>
      </main>
    </div>
  );
};

export default StatsScreen;
