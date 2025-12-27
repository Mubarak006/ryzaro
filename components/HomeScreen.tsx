
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
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md pt-12 pb-4 px-6 flex flex-col gap-1 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Status</span>
            <h1 className="text-3xl font-black tracking-tighter dark:text-white tabular-nums">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onOpenCalendar} className="p-2 text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </button>
            <button onClick={onOpenChat} className="p-2 text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>voice_chat</span>
            </button>
            <button onClick={onOpenSettings} className="p-2 -mr-2 text-slate-600 dark:text-slate-400 rounded-full">
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-32">
        {nextAlarmInfo && (
          <div className={`w-full ${nextAlarmInfo.alarm.date ? 'bg-orange-600' : 'bg-primary'} rounded-2xl p-6 shadow-xl text-white relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 transition-transform">
              <span className="material-symbols-outlined text-[80px]">alarm_on</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
              {nextAlarmInfo.alarm.date ? `Next (Scheduled: ${nextAlarmInfo.alarm.date})` : 'Next Alarm'}
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black">{nextAlarmInfo.alarm.time}</h2>
              <span className="text-xl font-bold opacity-80">{nextAlarmInfo.alarm.period}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
              <span className="material-symbols-outlined text-[16px] animate-pulse">schedule</span>
              <span className="text-xs font-bold tracking-tight">Ringing in {nextAlarmInfo.timeRemaining}</span>
            </div>
          </div>
        )}

        <div onClick={onOpenStats} className="w-full bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Current Streak</span>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 animate-bounce">local_fire_department</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.currentStreak} Days</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-500">emoji_events</span>
          </div>
        </div>

        <div className="flex items-end justify-between px-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Alarms</h2>
          <span className="text-xs font-medium text-slate-400">{alarms.filter(a => a.active).length} Active</span>
        </div>

        <div className="flex flex-col gap-4">
          {alarms.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-4 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
              <span className="material-symbols-outlined text-slate-300 text-[48px]">alarm_add</span>
              <p className="text-slate-400 font-medium">No alarms active. Start by adding one.</p>
            </div>
          ) : (
            alarms.map(alarm => {
              const taskInfo = TASK_INFO[alarm.task];
              return (
                <div key={alarm.id} onClick={() => onEdit(alarm)} className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-5 shadow-sm border border-gray-100 dark:border-white/5 transition-all hover:shadow-lg hover:-translate-y-1 ${!alarm.active && 'opacity-60 grayscale'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{alarm.time}</span>
                        <span className="text-lg font-bold text-slate-400">{alarm.period}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className={`text-xs font-bold uppercase tracking-widest ${alarm.date ? 'text-orange-500' : 'text-primary'}`}>
                          {alarm.date ? `Scheduled: ${alarm.date}` : alarm.days.length === 7 ? 'Every Day' : alarm.days.length === 0 ? 'Once' : 'Custom Days'}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <span className="material-symbols-outlined text-[14px]">{taskInfo.icon}</span>
                          <span className="truncate max-w-[120px]">{alarm.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3" onClick={(e) => e.stopPropagation()}>
                       <label className="relative flex h-[32px] w-[56px] cursor-pointer items-center rounded-full bg-slate-200 dark:bg-slate-700 p-1 has-[:checked]:bg-primary transition-colors">
                        <input checked={alarm.active} onChange={() => onToggle(alarm.id)} className="peer sr-only" type="checkbox"/>
                        <div className="h-[24px] w-[24px] rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-[24px]"></div>
                      </label>
                      <button onClick={() => onSimulateAlarm(alarm.id)} className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/10 px-2 py-1 rounded">Test</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button onClick={onAdd} className="pointer-events-auto flex h-16 w-48 items-center justify-center gap-3 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[28px]">add</span>
          <span className="text-lg font-bold">New Alarm</span>
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
