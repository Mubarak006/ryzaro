
import React, { useMemo } from 'react';
import { UserStats, Alarm, CompletionRecord } from '../types';
import { TASK_INFO } from '../constants';

interface Props {
  stats: UserStats;
  alarms: Alarm[];
  onBack: () => void;
}

const StatsScreen: React.FC<Props> = ({ stats, alarms, onBack }) => {
  const now = new Date();
  
  const categorizedActivity = useMemo(() => {
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    const todayCompletions = stats.history.filter(h => h.date.startsWith(today));
    const yesterdayCompletions = stats.history.filter(h => h.date.startsWith(yesterday));

    // Calculate upcoming alarms (next 24 hours)
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
  }, [stats.history, alarms]);

  const renderCompletionItem = (record: CompletionRecord, index: number) => {
    const info = TASK_INFO[record.task];
    const timeStr = new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div key={`comp-${index}`} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${info.color}-500/20 text-${info.color}-500`}>
          <span className="material-symbols-outlined text-[20px]">{info.icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{record.label}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{info.label} • {timeStr}</p>
        </div>
        <div className="text-emerald-500">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
        </div>
      </div>
    );
  };

  const renderUpcomingItem = (item: { alarm: Alarm, nextTrigger: Date }, index: number) => {
    const info = TASK_INFO[item.alarm.task];
    const timeStr = item.nextTrigger.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = item.nextTrigger.toDateString() === now.toDateString();

    return (
      <div key={`up-${index}`} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary`}>
          <span className="material-symbols-outlined text-[20px]">{info.icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{item.alarm.label}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            {isToday ? 'Today' : 'Tomorrow'} • {item.alarm.time} {item.alarm.period}
          </p>
        </div>
        <div className="text-primary">
          <span className="material-symbols-outlined text-[20px]">schedule</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background-dark text-white overflow-y-auto no-scrollbar">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-dark/90 px-6 py-4 backdrop-blur-md border-b border-white/5">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">Activity & Stats</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex flex-col gap-6 px-4 py-4 pb-20">
        {/* Streak Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-surface-dark border border-border-dark p-6 shadow-xl">
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Current Streak</h2>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter text-white">{stats.currentStreak}</span>
                <span className="text-xl font-bold text-slate-400">days</span>
              </div>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-orange-500/20 flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-orange-500 text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <div className="space-y-8">
          {/* TODAY */}
          <section>
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Today's Activity</h3>
              <span className="h-[1px] flex-1 bg-white/5 mx-4"></span>
              <span className="text-[10px] font-bold text-emerald-500">{categorizedActivity.todayCompletions.length} Done</span>
            </div>
            <div className="space-y-2">
              {categorizedActivity.todayCompletions.length > 0 ? (
                categorizedActivity.todayCompletions.map((record, i) => renderCompletionItem(record, i))
              ) : (
                <div className="p-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                  <p className="text-xs text-slate-500 font-medium italic">No completions yet today.</p>
                </div>
              )}
            </div>
          </section>

          {/* UPCOMING */}
          <section>
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Upcoming Challenges</h3>
              <span className="h-[1px] flex-1 bg-white/5 mx-4"></span>
              <span className="text-[10px] font-bold text-primary">Next {categorizedActivity.upcoming.length}</span>
            </div>
            <div className="space-y-2">
              {categorizedActivity.upcoming.length > 0 ? (
                categorizedActivity.upcoming.map((item, i) => renderUpcomingItem(item, i))
              ) : (
                <div className="p-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                  <p className="text-xs text-slate-500 font-medium italic">All alarms are currently disabled.</p>
                </div>
              )}
            </div>
          </section>

          {/* YESTERDAY */}
          <section>
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Yesterday</h3>
              <span className="h-[1px] flex-1 bg-white/5 mx-4"></span>
              <span className="text-[10px] font-bold text-slate-400">{categorizedActivity.yesterdayCompletions.length} Record</span>
            </div>
            <div className="space-y-2">
              {categorizedActivity.yesterdayCompletions.length > 0 ? (
                categorizedActivity.yesterdayCompletions.map((record, i) => renderCompletionItem(record, i))
              ) : (
                <div className="p-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10 opacity-50">
                  <p className="text-xs text-slate-500 font-medium italic">No data for yesterday.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Legacy Lifetime Stats */}
        <section className="grid grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl bg-surface-dark border border-border-dark p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Lifetime Best</p>
            <p className="text-2xl font-black text-white">{stats.bestStreak} <span className="text-xs text-slate-500">Days</span></p>
          </div>
          <div className="rounded-xl bg-surface-dark border border-border-dark p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Total Wakes</p>
            <p className="text-2xl font-black text-white">{stats.totalWakes} <span className="text-xs text-slate-500">Times</span></p>
          </div>
        </section>

        <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
          <span>Share Achievement</span>
        </button>
      </main>
    </div>
  );
};

export default StatsScreen;
