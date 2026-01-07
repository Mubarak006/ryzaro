
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Alarm, TaskType, Difficulty } from '../types';
import { DAYS_OF_WEEK, TASK_INFO } from '../constants';
import { CustomSound } from '../App';
import { PRESET_SOUNDS, playPresetSound } from '../utils/audio';

interface Props {
  alarm: Alarm | null;
  initialDate?: string;
  defaultSound: string;
  customSounds: CustomSound[];
  onAddCustomSound: (sound: CustomSound) => void;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const AddAlarmScreen: React.FC<Props> = ({ 
  alarm, 
  initialDate,
  defaultSound, 
  customSounds, 
  onAddCustomSound, 
  onSave, 
  onCancel, 
  onDelete 
}) => {
  // Initial normalization: Convert stored 12h format to 24h for the <input type="time">
  const initialTimeValue = useMemo(() => {
    if (!alarm) return '07:30';
    const [hStr, mStr] = alarm.time.split(':');
    let h = parseInt(hStr);
    if (alarm.period === 'PM' && h !== 12) h += 12;
    if (alarm.period === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${mStr}`;
  }, [alarm]);

  const [time, setTime] = useState(initialTimeValue);
  const [label, setLabel] = useState(alarm?.label || 'Protocol');
  const [days, setDays] = useState<number[]>(alarm?.days || [0, 1, 2, 3, 4]);
  const [specificDate, setSpecificDate] = useState<string | undefined>(alarm?.date || initialDate);
  const [useSpecificDate, setUseSpecificDate] = useState<boolean>(!!(alarm?.date || initialDate));
  const [task, setTask] = useState<TaskType>(alarm?.task || 'Math');
  const [difficulty, setDifficulty] = useState<Difficulty>(alarm?.difficulty || 'Medium');
  const [sound, setSound] = useState(alarm?.sound || defaultSound);
  const [isSelectingTask, setIsSelectingTask] = useState(false);
  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date(specificDate || new Date()));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Derive display values for the UI
  const [h24, mStr] = time.split(':');
  const hNum = parseInt(h24);
  const displayH12 = hNum % 12 || 12;
  const currentPeriod = hNum >= 12 ? 'PM' : 'AM';

  const handlePeriodToggle = (p: 'AM' | 'PM') => {
    if (p === currentPeriod) return;
    let newH = hNum;
    if (p === 'PM' && hNum < 12) newH += 12;
    if (p === 'AM' && hNum >= 12) newH -= 12;
    setTime(`${newH.toString().padStart(2, '0')}:${mStr}`);
  };

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => setShowConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  const handleSave = () => {
    // Final normalization for storage
    const h12 = hNum % 12 || 12;
    const finalTimeStr = `${h12.toString().padStart(2, '0')}:${mStr}`;
    const finalPeriod = hNum >= 12 ? 'PM' : 'AM';

    onSave({
      id: alarm?.id || Math.random().toString(36).substr(2, 9),
      time: finalTimeStr,
      period: finalPeriod,
      label,
      days: useSpecificDate ? [] : days,
      date: useSpecificDate ? specificDate : undefined,
      active: true,
      task,
      difficulty,
      sound
    });
  };

  const toggleDay = (idx: number) => {
    setDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const selectCalendarDate = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSpecificDate(selected.toISOString().split('T')[0]);
    setIsSelectingDate(false);
  };

  const Header = ({ title, leftBtn, rightBtn }: { title: string, leftBtn?: React.ReactNode, rightBtn?: React.ReactNode }) => (
    <header className="sticky top-0 z-10 flex items-center justify-between p-6 bg-transparent backdrop-blur-2xl border-b border-white/5">
      {leftBtn || <button onClick={onCancel} className="text-primary font-black tracking-tight">Cancel</button>}
      <h2 className="text-lg font-black tracking-widest uppercase">{title}</h2>
      {rightBtn || <button onClick={handleSave} className="text-primary font-black tracking-tight">Save</button>}
    </header>
  );

  if (isSelectingTask) {
    return (
      <div className="h-full flex flex-col text-white zen-gradient overflow-y-auto no-scrollbar">
        <Header title="Protocol Task" leftBtn={<button onClick={() => setIsSelectingTask(false)} className="text-primary font-black">Back</button>} rightBtn={<div className="w-10"></div>} />
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {(Object.entries(TASK_INFO) as [TaskType, any][]).map(([key, info]) => (
              <label key={key} className={`flex items-start gap-5 p-6 rounded-[32px] glass transition-all cursor-pointer border-2 ${task === key ? 'border-primary bg-primary/10' : 'border-transparent'}`}>
                <input type="radio" className="hidden" checked={task === key} onChange={() => setTask(key)} />
                <div className={`size-14 shrink-0 rounded-[20px] flex items-center justify-center ${task === key ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/10 text-white/40'}`}>
                  <span className="material-symbols-outlined text-3xl">{info.icon}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-black text-lg tracking-tight">{info.label}</p>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">{info.description(difficulty)}</p>
                  <p className="text-xs leading-relaxed text-white/30 font-bold">{info.guide}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isSelectingDate) {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const startOffset = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;
    const calendarCells = [];
    for (let i = 0; i < startOffset; i++) calendarCells.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarCells.push(i);

    return (
      <div className="h-full flex flex-col text-white zen-gradient">
        <Header title="Schedule" leftBtn={<button onClick={() => setIsSelectingDate(false)} className="text-primary font-black">Back</button>} />
        <div className="p-8 flex-1">
          <div className="glass rounded-[40px] p-8 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tighter uppercase">{viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</h3>
              <div className="flex gap-3">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-3 glass rounded-2xl"><span className="material-symbols-outlined">chevron_left</span></button>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-3 glass rounded-2xl"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 text-center mb-4">
              {['M','T','W','T','F','S','S'].map(d => <span key={d} className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{d}</span>)}
              {calendarCells.map((day, i) => (
                <button 
                  key={i} 
                  disabled={!day}
                  onClick={() => day && selectCalendarDate(day)}
                  className={`h-11 flex items-center justify-center text-sm font-black rounded-full transition-all ${day ? (specificDate === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0] ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'hover:bg-white/10 text-white/80') : ''}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-white zen-gradient overflow-y-auto no-scrollbar relative">
      <Header title={alarm ? 'Adjust Protocol' : 'New Protocol'} />

      <div className="flex flex-col items-center justify-center py-10 px-8">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6">Trigger Precision</p>
        <div className="relative w-full glass rounded-[40px] p-10 shadow-2xl flex flex-col items-center gap-6">
          <div className="flex items-center justify-center w-full">
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent border-0 text-7xl font-black p-0 text-white w-full text-center focus:ring-0 tracking-tighter cursor-pointer"
            />
          </div>
          
          {/* Explicit AM/PM Toggles */}
          <div className="flex bg-white/5 rounded-2xl p-1 w-full max-w-[200px] border border-white/10">
            <button 
              onClick={() => handlePeriodToggle('AM')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentPeriod === 'AM' ? 'bg-primary text-white shadow-lg' : 'text-white/30'}`}
            >
              AM
            </button>
            <button 
              onClick={() => handlePeriodToggle('PM')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentPeriod === 'PM' ? 'bg-primary text-white shadow-lg' : 'text-white/30'}`}
            >
              PM
            </button>
          </div>
          
          <div className="flex items-baseline gap-2 mt-2">
             <span className="text-2xl font-black text-white">{displayH12.toString().padStart(2, '0')}:{mStr}</span>
             <span className="text-sm font-bold text-white/40 uppercase tracking-widest">{currentPeriod}</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8 pb-32">
        <div className="rounded-[32px] glass overflow-hidden divide-y divide-white/5 shadow-sm">
          <div className="flex items-center px-8 h-18">
            <label className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] w-28 shrink-0">Identity</label>
            <input className="bg-transparent border-0 text-right w-full text-white font-black text-lg focus:ring-0 placeholder:text-white/10" placeholder="Protocol Label" value={label} onChange={(e) => setLabel(e.target.value)} type="text" />
          </div>
          <div className="flex items-center justify-between px-8 h-18">
            <div className="flex flex-col">
              <label className="text-white font-black text-base tracking-tight">Fixed Burst</label>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Non-recurring Signal</p>
            </div>
             <label className="relative flex h-[34px] w-[60px] cursor-pointer items-center rounded-full bg-white/5 p-1.5 has-[:checked]:bg-primary transition-all">
                <input type="checkbox" className="peer sr-only" checked={useSpecificDate} onChange={(e) => setUseSpecificDate(e.target.checked)}/>
                <div className="h-[24px] w-[24px] rounded-full bg-white shadow-xl transition-all peer-checked:translate-x-[26px]"></div>
              </label>
          </div>
          {useSpecificDate && (
            <div onClick={() => setIsSelectingDate(true)} className="flex items-center justify-between px-8 h-18 cursor-pointer active:bg-white/5">
               <label className="text-white font-black text-base">Date</label>
               <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-sm">
                 <span>{specificDate || 'Select'}</span>
                 <span className="material-symbols-outlined">event_available</span>
               </div>
            </div>
          )}
        </div>

        {!useSpecificDate && (
          <div>
            <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] px-8 mb-4">Recurring Cycle</h3>
            <div className="glass rounded-[32px] p-4">
              <div className="flex justify-between gap-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <button key={`${day}-${idx}`} onClick={() => toggleDay(idx)} className={`flex-1 h-12 rounded-[18px] flex items-center justify-center text-sm font-black transition-all ${days.includes(idx) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/20 hover:text-white/40'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="glass rounded-[32px] overflow-hidden shadow-sm">
          <div onClick={() => setIsSelectingTask(true)} className="flex items-center justify-between p-8 border-b border-white/5 active:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl">{TASK_INFO[task].icon}</span>
              </div>
              <span className="text-white font-black tracking-tight text-lg">Challenge Mode</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
              <span>{task}</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </div>
          <div className="p-8">
            <div className="flex h-14 w-full items-center justify-center rounded-[20px] bg-white/5 p-1.5">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 h-full rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${difficulty === d ? 'bg-white text-background-dark shadow-xl' : 'text-white/30'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {alarm && (
          <button onClick={() => onDelete?.(alarm.id)} className="w-full h-18 glass border-red-500/20 text-red-500 font-black tracking-widest uppercase text-sm rounded-[32px] active:scale-[0.98] transition-all">
            Decommission Alarm
          </button>
        )}
      </div>
    </div>
  );
};

export default AddAlarmScreen;
