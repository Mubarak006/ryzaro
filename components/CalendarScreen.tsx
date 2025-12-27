
import React, { useState, useMemo } from 'react';
import { Alarm } from '../types';
import { TASK_INFO } from '../constants';

interface Props {
  alarms: Alarm[];
  onAddForDate: (date: string) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onBack: () => void;
}

const CalendarScreen: React.FC<Props> = ({ alarms, onAddForDate, onEdit, onDelete, onToggle, onBack }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const daysInMonth = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  }, [viewDate]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  }, [viewDate]);

  const startOffset = (firstDayOfMonth + 6) % 7;
  const monthYearLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getAlarmsForDay = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const dayIdx = (date.getDay() + 6) % 7;
    
    return alarms.filter(a => {
      if (a.date) {
        return a.date === dateStr;
      }
      return a.days.length === 0 || a.days.includes(dayIdx);
    });
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    setSelectedDay(1);
  };

  const formattedSelectedDate = useMemo(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay);
    return d.toISOString().split('T')[0];
  }, [viewDate, selectedDay]);

  const alarmsOnSelectedDay = getAlarmsForDay(selectedDay);

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Alarm Calendar</h1>
        <button 
          onClick={() => onAddForDate(formattedSelectedDate)}
          className="p-2 -mr-2 text-primary"
        >
          <span className="material-symbols-outlined">add_alarm</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-20">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight">{monthYearLabel}</h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</span>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-10"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayAlarms = getAlarmsForDay(day);
              const hasAlarms = dayAlarms.length > 0;
              const hasDateSpecific = dayAlarms.some(a => !!a.date);
              const isSelected = selectedDay === day;
              const isToday = day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative h-10 flex flex-col items-center justify-center transition-all ${isSelected ? 'scale-110' : ''}`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}
                    ${isToday && !isSelected ? 'text-primary' : ''}
                    ${!isSelected && !isToday ? 'text-slate-600 dark:text-slate-400' : ''}
                  `}>
                    {day}
                  </div>
                  {hasAlarms && (
                    <div className={`absolute bottom-0 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : hasDateSpecific ? 'bg-orange-500' : 'bg-primary'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Alarms for {selectedDay} {viewDate.toLocaleString('default', { month: 'short' })}
            </h3>
            <button 
              onClick={() => onAddForDate(formattedSelectedDate)}
              className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-[14px]">add</span> Add for this day
            </button>
          </div>
          
          <div className="space-y-3">
            {alarmsOnSelectedDay.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <p className="text-slate-400 text-sm font-medium">No alarms scheduled for this day.</p>
              </div>
            ) : (
              alarmsOnSelectedDay.map(alarm => {
                const taskInfo = TASK_INFO[alarm.task];
                return (
                  <div key={alarm.id} className={`bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between ${!alarm.active && 'opacity-60'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${alarm.date ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'} flex items-center justify-center`}>
                        <span className="material-symbols-outlined">{taskInfo.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black">{alarm.time}</span>
                          <span className="text-xs font-bold text-slate-400">{alarm.period}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{alarm.date ? 'Once (Date Specific)' : 'Recurring'}</span>
                        <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">{alarm.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(alarm)} className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button onClick={() => onDelete(alarm.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalendarScreen;
