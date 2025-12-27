
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
  const [time, setTime] = useState(alarm?.time || '07:30');
  const [period, setPeriod] = useState<'AM' | 'PM'>(alarm?.period || 'AM');
  const [label, setLabel] = useState(alarm?.label || 'Alarm');
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
  
  // Calendar picker state
  const [viewDate, setViewDate] = useState(new Date(specificDate || new Date()));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => setShowConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  const handleSave = () => {
    onSave({
      id: alarm?.id || Math.random().toString(36).substr(2, 9),
      time,
      period,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const newCustomSound: CustomSound = {
          id: `custom_${Date.now()}`,
          name: file.name,
          data: base64Data
        };
        onAddCustomSound(newCustomSound);
        setSound(newCustomSound.id);
        setShowConfirm(true);
        previewSound(newCustomSound.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const previewSound = (soundId: string) => {
    setActivePreview(soundId);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    const custom = customSounds.find(cs => cs.id === soundId);
    if (custom) {
      const audio = new Audio(custom.data);
      audio.volume = 0.5;
      audio.play();
      previewAudioRef.current = audio;
      setTimeout(() => {
        audio.pause();
        setActivePreview(prev => prev === soundId ? null : prev);
      }, 3000);
      return;
    }
    playPresetSound(soundId, 0.5, 2.0);
    setTimeout(() => {
      setActivePreview(prev => prev === soundId ? null : prev);
    }, 2000);
  };

  const getSoundIcon = (name: string) => {
    switch (name) {
      case 'Radar': return 'radar';
      case 'Nuclear': return 'emergency';
      case 'Submarine': return 'waves';
      case 'Orbit': return 'language';
      case 'Static': return 'blur_on';
      case 'Loud Beep': return 'notifications_active';
      case 'Siren': return 'campaign';
      case 'Digital Alarm': return 'alarm_on';
      default: return 'music_note';
    }
  };

  // Calendar Logic
  const daysInMonth = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate(), [viewDate]);
  const startOffset = useMemo(() => (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7, [viewDate]);
  
  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    return cells;
  }, [daysInMonth, startOffset]);

  const selectCalendarDate = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSpecificDate(selected.toISOString().split('T')[0]);
    setIsSelectingDate(false);
  };

  if (isSelectingTask) {
    return (
      <div className="h-full flex flex-col bg-background-dark text-white p-5 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setIsSelectingTask(false)} className="text-slate-400">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-bold">Select Task</h2>
          <button onClick={() => setIsSelectingTask(false)} className="text-primary font-bold">Done</button>
        </div>
        <h3 className="text-3xl font-bold mb-2 tracking-tight">Wake-up Task</h3>
        <p className="text-slate-400 text-sm mb-6">Choose how you'll prove you're awake.</p>
        <div className="space-y-4">
          {(Object.entries(TASK_INFO) as [TaskType, any][]).map(([key, info]) => (
            <label key={key} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${task === key ? 'bg-primary/10 border-primary' : 'bg-surface-dark border-border-dark'}`}>
              <input type="radio" className="hidden" checked={task === key} onChange={() => setTask(key)} />
              <div className={`size-12 shrink-0 rounded-full flex items-center justify-center ${task === key ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}>
                <span className="material-symbols-outlined">{info.icon}</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className={`font-bold ${task === key ? 'text-primary' : 'text-white'}`}>{info.label}</p>
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center ${task === key ? 'border-primary' : 'border-slate-600'}`}>
                    {task === key && <div className="size-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{info.description(difficulty)}</p>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium">{info.guide}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (isSelectingDate) {
    return (
      <div className="h-full flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white p-5">
        <header className="flex items-center justify-between mb-8">
          <button onClick={() => setIsSelectingDate(false)} className="text-primary font-bold">Back</button>
          <h2 className="text-lg font-bold">Choose Date</h2>
          <div className="w-10"></div>
        </header>
        
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5"><span className="material-symbols-outlined">chevron_left</span></button>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-2 text-center mb-4">
            {['M','T','W','T','F','S','S'].map(d => <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>)}
            {calendarCells.map((day, i) => (
              <button 
                key={i} 
                disabled={!day}
                onClick={() => day && selectCalendarDate(day)}
                className={`h-10 flex items-center justify-center text-sm font-bold rounded-full ${day ? (specificDate === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0] ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-white/5') : ''}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-slate-500 font-medium px-4">This alarm will trigger only once on the chosen date.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar relative">
      {showConfirm && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-bounce">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-bold text-sm">Sound uploaded & selected!</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
        <button onClick={onCancel} className="text-primary font-medium">Cancel</button>
        <h2 className="text-lg font-bold dark:text-white">{alarm ? 'Edit Alarm' : 'Add Alarm'}</h2>
        <button onClick={handleSave} className="text-primary font-bold">Save</button>
      </header>

      <div className="flex flex-col items-center justify-center py-6 px-6">
        <p className="text-center text-[11px] font-black uppercase tracking-widest text-primary mb-4 animate-fade-in">
          Set Precise Wake-Up Time
        </p>
        <div className="relative w-full max-w-[280px] bg-white dark:bg-card-dark rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 text-center">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Trigger Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-slate-50 dark:bg-background-dark border-0 rounded-2xl text-4xl font-black p-3 dark:text-white w-full text-center focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2 pt-5">
              <button onClick={() => setPeriod('AM')} className={`w-12 h-10 rounded-xl font-bold transition-all ${period === 'AM' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>AM</button>
              <button onClick={() => setPeriod('PM')} className={`w-12 h-10 rounded-xl font-bold transition-all ${period === 'PM' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>PM</button>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium px-8 leading-relaxed max-w-xs">
          This is the exact time your alarm will trigger. Remember, once it starts, you <span className="text-primary font-bold italic">must</span> complete the assigned challenge to stop the sound.
        </p>
      </div>

      <div className="px-4 space-y-6 pb-12">
        <div className="rounded-xl bg-white dark:bg-card-dark overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="flex items-center px-4 h-14">
            <label className="text-slate-900 dark:text-white text-base font-medium w-24 shrink-0">Label</label>
            <input className="bg-transparent border-0 text-right w-full text-slate-500 dark:text-slate-400 focus:ring-0" placeholder="Alarm" value={label} onChange={(e) => setLabel(e.target.value)} type="text" />
          </div>
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex flex-col">
              <label className="text-slate-900 dark:text-white text-base font-medium">Specific Date</label>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">One-time Trigger</p>
            </div>
             <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-slate-200 dark:bg-[#39393d] p-0.5 has-[:checked]:bg-primary transition-colors">
                <input type="checkbox" className="peer sr-only" checked={useSpecificDate} onChange={(e) => setUseSpecificDate(e.target.checked)}/>
                <div className="h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-5"></div>
              </label>
          </div>
          {useSpecificDate && (
            <div onClick={() => setIsSelectingDate(true)} className="flex items-center justify-between px-4 h-14 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
               <label className="text-slate-900 dark:text-white text-base font-medium">Select Date</label>
               <div className="flex items-center gap-1 text-primary font-bold">
                 <span>{specificDate || 'Pick a date'}</span>
                 <span className="material-symbols-outlined text-lg">calendar_month</span>
               </div>
            </div>
          )}
        </div>

        {!useSpecificDate && (
          <div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider px-2 mb-2">Repeat Schedule</h3>
            <div className="rounded-xl bg-white dark:bg-card-dark p-2 shadow-sm">
              <div className="flex justify-between gap-1">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <button key={`${day}-${idx}`} onClick={() => toggleDay(idx)} className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${days.includes(idx) ? 'bg-primary text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider px-2 mb-2">Wake Up Challenge</h3>
          <div className="rounded-xl bg-white dark:bg-card-dark overflow-hidden shadow-sm">
            <div onClick={() => setIsSelectingTask(true)} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined text-lg">{TASK_INFO[task].icon}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-medium">Task Type</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span className="text-xs">{TASK_INFO[task].label}</span>
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-[#111318] p-1">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 h-full rounded-md text-sm font-medium transition-all ${difficulty === d ? 'bg-white dark:bg-card-dark shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider px-2 mb-2">Enforcement Sound</h3>
          <div className="rounded-xl bg-white dark:bg-card-dark overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
            {PRESET_SOUNDS.map(s => (
              <label key={s} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-4 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${activePreview === s ? 'text-primary animate-pulse' : 'text-slate-400'}`}>{activePreview === s ? 'volume_up' : getSoundIcon(s)}</span>
                  <span className="text-slate-900 dark:text-white font-medium">{s}</span>
                </div>
                <input type="radio" name="sound" className="size-5 text-primary" checked={sound === s} onChange={() => { setSound(s); previewSound(s); }} />
              </label>
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 text-primary font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="material-symbols-outlined">add_circle</span>
              <span>Upload Custom Sound</span>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </button>
          </div>
        </div>

        {alarm && (
          <button onClick={() => onDelete?.(alarm.id)} className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-xl active:scale-[0.98] transition-transform">
            Delete Alarm
          </button>
        )}
      </div>
    </div>
  );
};

export default AddAlarmScreen;
