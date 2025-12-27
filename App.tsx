
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alarm, AppView, UserStats, TaskType, Difficulty, CompletionRecord } from './types';
import SplashScreen from './components/SplashScreen';
import CautionScreen from './components/CautionScreen';
import HomeScreen from './components/HomeScreen';
import AddAlarmScreen from './components/AddAlarmScreen';
import RingingScreen from './components/RingingScreen';
import CompletionScreen from './components/CompletionScreen';
import StatsScreen from './components/StatsScreen';
import SettingsScreen from './components/SettingsScreen';
import ChatBot from './components/ChatBot';
import CalendarScreen from './components/CalendarScreen';
import { getAudioContext } from './utils/audio';

const STORAGE_KEY_ALARMS = 'task_alarms';
const STORAGE_KEY_STATS = 'task_stats';
const STORAGE_KEY_CAUTION = 'task_caution_accepted';
const STORAGE_KEY_DEFAULT_SOUND = 'task_default_sound';
const STORAGE_KEY_DEFAULT_VOLUME = 'task_default_volume';
const STORAGE_KEY_CUSTOM_SOUNDS = 'task_custom_sounds';
const STORAGE_KEY_EMERGENCY_DISMISS = 'task_emergency_dismiss';

export interface CustomSound {
  id: string;
  name: string;
  data: string; // Base64 data
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SPLASH');
  
  // Initialize alarms directly from storage to prevent race conditions with effects
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALARMS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load alarms", e);
      return [];
    }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STATS);
    if (!saved) return { currentStreak: 0, bestStreak: 0, totalWakes: 0, history: [] };
    try {
      const parsed = JSON.parse(saved);
      // Migration: ensure history matches new format if it was just strings before
      if (parsed.history && parsed.history.length > 0 && typeof parsed.history[0] === 'string') {
        parsed.history = parsed.history.map((date: string) => ({ date, task: 'Math', label: 'Legacy Alarm' }));
      }
      return parsed;
    } catch (e) {
      return { currentStreak: 0, bestStreak: 0, totalWakes: 0, history: [] };
    }
  });

  const [customSounds, setCustomSounds] = useState<CustomSound[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_SOUNDS);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [defaultSound, setDefaultSound] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_DEFAULT_SOUND) || 'Loud Beep';
  });

  const [defaultVolume, setDefaultVolume] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DEFAULT_VOLUME);
    return saved ? parseFloat(saved) : 0.7;
  });

  const [emergencyDismiss, setEmergencyDismiss] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_EMERGENCY_DISMISS) === 'true';
  });

  const [activeAlarmId, setActiveAlarmId] = useState<string | null>(null);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [snoozeTrigger, setSnoozeTrigger] = useState<{ time: number, alarmId: string } | null>(null);
  const lastTriggeredMinute = useRef<string>("");

  const warmUpAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => console.log("Audio Context Warmed Up"));
    }
  }, []);

  useEffect(() => {
    // Only handle view transitions on mount
    const timeout = setTimeout(() => {
      const accepted = localStorage.getItem(STORAGE_KEY_CAUTION);
      setView(accepted === 'true' ? 'HOME' : 'CAUTION');
    }, 2500);
    return () => clearTimeout(timeout);
  }, []);

  // Persistence effects - these save state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem(STORAGE_KEY_ALARMS, JSON.stringify(alarms)); }, [alarms]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_DEFAULT_SOUND, defaultSound); }, [defaultSound]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_DEFAULT_VOLUME, defaultVolume.toString()); }, [defaultVolume]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_CUSTOM_SOUNDS, JSON.stringify(customSounds)); }, [customSounds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_EMERGENCY_DISMISS, emergencyDismiss.toString()); }, [emergencyDismiss]);

  useEffect(() => {
    const checkAlarms = () => {
      if (view === 'RINGING') return;
      const now = new Date();
      if (snoozeTrigger && now.getTime() >= snoozeTrigger.time) {
        setActiveAlarmId(snoozeTrigger.alarmId);
        setSnoozeTrigger(null);
        setView('RINGING');
        return;
      }
      const h = now.getHours();
      const m = now.getMinutes();
      const day = (now.getDay() + 6) % 7; 
      const dateStr = now.toISOString().split('T')[0];
      const period = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 || 12;
      const hourStr = dispH.toString().padStart(2, '0');
      const minStr = m.toString().padStart(2, '0');
      const currentMinuteKey = `${hourStr}:${minStr}-${period}-${dateStr}`;
      if (lastTriggeredMinute.current === currentMinuteKey) return;

      const ringing = alarms.find(a => {
        if (!a.active) return false;
        const [aH, aM] = a.time.split(':');
        const normalizedAlarmTime = `${parseInt(aH).toString().padStart(2, '0')}:${parseInt(aM).toString().padStart(2, '0')}`;
        const normalizedCurrentTime = `${hourStr}:${minStr}`;
        const timeMatches = normalizedAlarmTime === normalizedCurrentTime;
        const periodMatches = a.period === period;
        
        if (a.date) {
          return timeMatches && periodMatches && a.date === dateStr;
        } else {
          const dayMatches = a.days.length === 0 || a.days.includes(day);
          return timeMatches && periodMatches && dayMatches;
        }
      });

      if (ringing) {
        lastTriggeredMinute.current = currentMinuteKey;
        setActiveAlarmId(ringing.id);
        warmUpAudio();
        setView('RINGING');
      }
    };
    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms, view, snoozeTrigger, warmUpAudio]);

  const addAlarm = (alarm: Alarm) => setAlarms(prev => [...prev, alarm]);
  const updateAlarm = (alarm: Alarm) => setAlarms(prev => prev.map(a => a.id === alarm.id ? alarm : a));
  const deleteAlarm = (id: string) => setAlarms(prev => prev.filter(a => a.id !== id));
  const toggleAlarm = (id: string) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  const toggleAllAlarms = (active: boolean) => setAlarms(prev => prev.map(a => ({ ...a, active })));
  const handleAddCustomSound = (sound: CustomSound) => setCustomSounds(prev => [...prev, sound]);

  const completeTask = () => {
    const now = new Date();
    const currentAlarm = alarms.find(a => a.id === activeAlarmId);
    
    let newStreak = stats.currentStreak;
    if (stats.lastWakeDate) {
      const last = new Date(stats.lastWakeDate);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
      if (diff === 1) newStreak += 1;
      else if (diff > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    const newCompletion: CompletionRecord = {
      date: now.toISOString(),
      task: currentAlarm?.task || 'Math',
      label: currentAlarm?.label || 'Alarm'
    };

    setStats(prev => ({
      ...prev,
      currentStreak: newStreak,
      bestStreak: Math.max(prev.bestStreak, newStreak),
      totalWakes: prev.totalWakes + 1,
      lastWakeDate: now.toISOString(),
      history: [...prev.history, newCompletion]
    }));
    setSnoozeTrigger(null);
    setView('COMPLETED');
  };

  const snoozeAlarm = (minutes: number) => {
    if (activeAlarmId) {
      setSnoozeTrigger({ time: Date.now() + minutes * 60000, alarmId: activeAlarmId });
      setView('HOME');
    }
  };

  const activeRingingAlarm = useMemo(() => alarms.find(a => a.id === activeAlarmId) || alarms[0], [alarms, activeAlarmId]);

  return (
    <div className="max-w-md mx-auto h-screen relative bg-background-light dark:bg-background-dark overflow-hidden shadow-2xl" onPointerDown={warmUpAudio}>
      {view === 'SPLASH' && <SplashScreen />}
      {view === 'CAUTION' && <CautionScreen onAccept={() => { warmUpAudio(); localStorage.setItem(STORAGE_KEY_CAUTION, 'true'); setView('HOME'); }} />}
      {view === 'HOME' && <HomeScreen alarms={alarms} stats={stats} onAdd={() => { setEditingAlarm(null); setInitialDate(undefined); setView('ADD_ALARM'); }} onEdit={(a) => { setEditingAlarm(a); setInitialDate(undefined); setView('ADD_ALARM'); }} onToggle={toggleAlarm} onOpenStats={() => setView('STATS')} onOpenSettings={() => setView('SETTINGS')} onOpenChat={() => setView('CHAT')} onOpenCalendar={() => setView('CALENDAR')} onSimulateAlarm={(id) => { warmUpAudio(); setActiveAlarmId(id); setView('RINGING'); }} />}
      {view === 'ADD_ALARM' && <AddAlarmScreen initialDate={initialDate} alarm={editingAlarm} defaultSound={defaultSound} customSounds={customSounds} onAddCustomSound={handleAddCustomSound} onCancel={() => setView('HOME')} onDelete={(id) => { deleteAlarm(id); setView('HOME'); }} onSave={(a) => { if (editingAlarm) updateAlarm(a); else addAlarm(a); setView('HOME'); }} />}
      {view === 'CALENDAR' && <CalendarScreen alarms={alarms} onBack={() => setView('HOME')} onAddForDate={(date) => { setEditingAlarm(null); setInitialDate(date); setView('ADD_ALARM'); }} onEdit={(a) => { setEditingAlarm(a); setInitialDate(undefined); setView('ADD_ALARM'); }} onDelete={deleteAlarm} onToggle={toggleAlarm} />}
      {view === 'RINGING' && activeRingingAlarm && <RingingScreen alarm={activeRingingAlarm} customSounds={customSounds} baseVolume={defaultVolume} emergencyDismissEnabled={emergencyDismiss} onSnooze={snoozeAlarm} onComplete={completeTask} />}
      {view === 'COMPLETED' && <CompletionScreen stats={stats} onDone={() => setView('HOME')} />}
      {view === 'STATS' && <StatsScreen alarms={alarms} stats={stats} onBack={() => setView('HOME')} />}
      {view === 'SETTINGS' && <SettingsScreen alarms={alarms} defaultSound={defaultSound} setDefaultSound={setDefaultSound} defaultVolume={defaultVolume} setDefaultVolume={setDefaultVolume} customSounds={customSounds} emergencyDismiss={emergencyDismiss} setEmergencyDismiss={setEmergencyDismiss} onToggleAll={toggleAllAlarms} onAddCustomSound={handleAddCustomSound} onBack={() => setView('HOME')} />}
      {view === 'CHAT' && <ChatBot onBack={() => setView('HOME')} alarms={alarms} stats={stats} />}
    </div>
  );
};

export default App;
