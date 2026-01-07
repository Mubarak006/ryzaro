
import React, { useState, useEffect, useMemo } from 'react';
import { Alarm, UserStats } from '../types';
import { TASK_INFO } from '../constants';

interface Props {
  alarms: Alarm[];
  stats: UserStats;
  onAdd: () => void;
  onEdit: (alarm: Alarm) => void;
  onToggle: (id: string) => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenChat: () => void;
  onOpenCalendar: () => void;
  onSimulateAlarm: (id: string) => void;
}

const HomeScreen: React.FC<Props> = ({ 
  alarms, stats, onAdd, onEdit, onToggle, onOpenStats, onOpenSettings, onOpenChat, onOpenCalendar, onSimulateAlarm 
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextAlarmInfo = useMemo(() => {
    const activeAlarms = alarms.filter(a => a.active);
    if (activeAlarms.length === 0) return null;

    let closest = Infinity;
    let closestAlarm = null;

    activeAlarms.forEach(alarm => {
      const [hStr, mStr] = alarm.time.split(':');
      let h = parseInt(hStr);
      const m = parseInt(mStr);
      if (alarm.period === 'PM' && h !== 12) h += 12;
      if (alarm.period === 'AM' && h === 12) h = 0;

      if (alarm.date) {
        const alarmDate = new Date(`${alarm.date}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
        if (alarmDate > now) {
          const diff = alarmDate.getTime() - now.getTime();
          if (diff < closest) {
            closest = diff;
            closestAlarm = { alarm, diff };
          }
        }
      } else {
        const baseDate = new Date(now);
        baseDate.setHours(h, m, 0, 0);

        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(baseDate);
          checkDate.setDate(checkDate.getDate() + i);
          const dayIdx = (checkDate.getDay() + 6) % 7;
          if (alarm.days.length === 0 || alarm.days.includes(dayIdx)) {
            if (checkDate > now) {
              const diff = checkDate.getTime() - now.getTime();
              if (diff < closest) {
                closest = diff;
                closestAlarm = { alarm, diff };
              }
              break;
            }
          }
        }
      }
    });

    if (!closestAlarm) return null;
    const hours = Math.floor(closestAlarm.diff / (1000 * 3600));
    const minutes = Math.floor((closestAlarm.diff % (1000 * 3600)) / (1000 * 60));
    return { ...closestAlarm, timeRemaining: `${hours}h ${minutes}m` };
  }, [alarms, now]);

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      <header className="sticky top-0 z-10 bg-transparent pt-12 pb-6 px-8 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-1 drop-shadow-sm">Live Status</span>
            <h1 className="text-4xl font-black tracking-tighter text-white tabular-nums drop-shadow-md">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenCalendar} className="p-2.5 glass rounded-2xl text-white hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[26px]">calendar_month</span>
            </button>
            <button onClick={onOpenSettings} className="p-2.5 glass rounded-2xl text-white hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[26px]">settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pt-2 flex flex-col gap-8 overflow-y-auto no-scrollbar pb-40">
        {nextAlarmInfo && (
          <div className="w-full bg-gradient-to-br from-primary to-secondary rounded-[32px] p-8 shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
              <span className="material-symbols-outlined text-[120px]">alarm_on</span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80 mb-2">
              Next Wake-up
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-6xl font-black text-white tracking-tighter">{nextAlarmInfo.alarm.time}</h2>
              <span className="text-2xl font-black text-white/90">{nextAlarmInfo.alarm.period}</span>
            </div>
            <div className="mt-6 flex items-center gap-3 bg-black/20 w-fit px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="material-symbols-outlined text-[18px] text-white animate-pulse">schedule</span>
              <span className="text-xs font-bold tracking-tight text-white">Ringing in {nextAlarmInfo.timeRemaining}</span>
            </div>
          </div>
        )}

        <div onClick={onOpenStats} className="w-full glass rounded-[28px] p-6 flex items-center justify-between cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-all">
          <div className="flex items-center gap-5">
            <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[32px] animate-pulse">local_fire_department</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/50">Current Streak</span>
              <span className="text-2xl font-black text-white">{stats.currentStreak} Days</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <span className="material-symbols-outlined text-primary text-[20px]">chevron_right</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Protocols</h2>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{alarms.filter(a => a.active).length} Active</span>
          </div>

          <div className="flex flex-col gap-5">
            {alarms.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-5 glass rounded-[40px] border-dashed border-white/10">
                <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-[48px]">alarm_add</span>
                </div>
                <p className="text-white/40 font-bold tracking-tight text-sm px-10">Your journey begins with a single signal. Add an alarm.</p>
              </div>
            ) : (
              alarms.map(alarm => {
                const taskInfo = TASK_INFO[alarm.task];
                return (
                  <div key={alarm.id} onClick={() => onEdit(alarm)} className={`group relative glass overflow-hidden rounded-[32px] p-6 transition-all hover:bg-white/[0.08] active:scale-[0.98] ${!alarm.active && 'opacity-40 grayscale-[0.8]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white tracking-tighter">{alarm.time}</span>
                          <span className="text-lg font-black text-white/40 uppercase">{alarm.period}</span>
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                          <p className={`text-[9px] font-black uppercase tracking-[0.25em] ${alarm.date ? 'text-primary' : 'text-white/50'}`}>
                            {alarm.date ? `Scheduled: ${alarm.date}` : alarm.days.length === 7 ? 'Continuous Cycle' : alarm.days.length === 0 ? 'Single Burst' : 'Custom Pattern'}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-white/70">
                            <span className="material-symbols-outlined text-[16px] text-primary">{taskInfo.icon}</span>
                            <span className="truncate max-w-[150px] uppercase tracking-[0.1em]">{alarm.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-5" onClick={(e) => e.stopPropagation()}>
                         <label className="relative flex h-[36px] w-[64px] cursor-pointer items-center rounded-full bg-white/10 p-1.5 has-[:checked]:bg-primary transition-all duration-300 ring-1 ring-white/5">
                          <input checked={alarm.active} onChange={() => onToggle(alarm.id)} className="peer sr-only" type="checkbox"/>
                          <div className="h-[24px] w-[24px] rounded-full bg-white shadow-xl transition-transform peer-checked:translate-x-[28px]"></div>
                        </label>
                        <button onClick={() => onSimulateAlarm(alarm.id)} className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-4 py-2 glass rounded-2xl hover:text-white hover:bg-primary/20 transition-all active:scale-95">Test</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none">
        <button onClick={onAdd} className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-white shadow-2xl shadow-primary/50 hover:scale-110 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[42px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
