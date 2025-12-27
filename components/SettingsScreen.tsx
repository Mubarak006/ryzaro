
import React, { useState, useRef, useEffect } from 'react';
import { CustomSound } from '../App';
import { Alarm } from '../types';
import { PRESET_SOUNDS, playPresetSound } from '../utils/audio';

interface Props {
  alarms: Alarm[];
  defaultSound: string;
  setDefaultSound: (sound: string) => void;
  defaultVolume: number;
  setDefaultVolume: (volume: number) => void;
  customSounds: CustomSound[];
  emergencyDismiss: boolean;
  setEmergencyDismiss: (val: boolean) => void;
  onToggleAll: (active: boolean) => void;
  onAddCustomSound: (sound: CustomSound) => void;
  onBack: () => void;
}

const SettingsScreen: React.FC<Props> = ({ 
  alarms, defaultSound, setDefaultSound, defaultVolume, setDefaultVolume, customSounds, emergencyDismiss, setEmergencyDismiss, onToggleAll, onAddCustomSound, onBack 
}) => {
  const [showSoundSelector, setShowSoundSelector] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const anyAlarmActive = alarms.some(a => a.active);

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => setShowConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const newSound: CustomSound = { id: `custom_${Date.now()}`, name: file.name, data: base64Data };
        onAddCustomSound(newSound);
        setDefaultSound(newSound.id);
        setShowConfirm(true);
        previewSound(newSound.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const previewSound = (soundId: string) => {
    setActivePreview(soundId);

    // Stop previous custom audio
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const custom = customSounds.find(cs => cs.id === soundId);
    if (custom) {
      const audio = new Audio(custom.data);
      audio.volume = Math.max(0.2, defaultVolume);
      audio.play();
      previewAudioRef.current = audio;
      setTimeout(() => {
        audio.pause();
        setActivePreview(prev => prev === soundId ? null : prev);
      }, 3000);
      return;
    }

    // Play synthetic preset
    playPresetSound(soundId, defaultVolume, 1.5);
    setTimeout(() => {
      setActivePreview(prev => prev === soundId ? null : prev);
    }, 1500);
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

  if (showSoundSelector) {
    return (
      <div className="h-full flex flex-col bg-background-light dark:bg-black text-slate-900 dark:text-white relative">
        {showConfirm && (
          <div className="fixed top-16 left-4 right-4 z-[100] animate-fade-in">
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-bold text-sm">New default sound selected!</span>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-800/50">
          <button onClick={() => setShowSoundSelector(false)} className="flex items-center text-primary">
            <span className="material-symbols-outlined text-2xl -ml-1">arrow_back_ios_new</span>
            <span className="ml-1 text-base font-medium">Settings</span>
          </button>
          <h1 className="text-lg font-bold">Default Sound</h1>
          <div className="w-10"></div>
        </header>
        <main className="p-4 space-y-2 flex-1 overflow-y-auto no-scrollbar pb-10">
          <p className="px-1 pb-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tap to test loudness</p>
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Presets</p>
          {PRESET_SOUNDS.map(s => (
            <label key={s} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#1c1c1e] shadow-sm active:opacity-70 border border-transparent has-[:checked]:border-primary transition-all">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${activePreview === s ? 'text-primary animate-pulse' : 'text-slate-400'}`}>{activePreview === s ? 'volume_up' : getSoundIcon(s)}</span>
                <span className="font-bold">{s}</span>
              </div>
              <input type="radio" name="sound-choice" className="size-5 text-primary focus:ring-primary focus:ring-offset-0 border-slate-300 dark:border-slate-700" checked={defaultSound === s} onChange={() => { setDefaultSound(s); previewSound(s); }}/>
            </label>
          ))}
          {customSounds.length > 0 && <p className="px-1 pt-6 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">My Uploads</p>}
          {customSounds.map(cs => (
            <label key={cs.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#1c1c1e] shadow-sm active:opacity-70 border border-transparent has-[:checked]:border-primary transition-all">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${activePreview === cs.id ? 'text-primary animate-pulse' : 'text-slate-400'}`}>upload_file</span>
                <span className="font-bold truncate max-w-[140px]">{cs.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="radio" name="sound-choice" className="size-5 text-primary focus:ring-primary focus:ring-offset-0 border-slate-300 dark:border-slate-700" checked={defaultSound === cs.id} onChange={() => { setDefaultSound(cs.id); previewSound(cs.id); }}/>
              </div>
            </label>
          ))}
          <button onClick={() => fileInputRef.current?.click()} className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">upload</span><span>New Sound</span>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload}/>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-black text-slate-900 dark:text-white transition-colors duration-200">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-800/50">
        <button onClick={onBack} className="flex items-center text-primary"><span className="material-symbols-outlined text-2xl -ml-1">arrow_back_ios_new</span><span className="ml-1 text-base font-medium">Home</span></button>
        <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        <button onClick={onBack} className="text-primary text-base font-semibold">Done</button>
      </header>
      <main className="flex-1 w-full max-w-md mx-auto pb-10 overflow-y-auto no-scrollbar">
        <section className="mt-6">
          <h3 className="px-5 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Behavior</h3>
          <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden shadow-sm divide-y dark:divide-slate-800">
            <div className="flex items-center justify-between p-4">
              <div className="flex flex-col pr-4"><p className="text-base font-bold">Emergency Dismiss</p><p className="text-slate-500 text-xs font-medium">Enable Snoozing</p></div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-slate-200 dark:bg-[#39393d] p-0.5 has-[:checked]:bg-primary transition-colors">
                <input type="checkbox" className="peer sr-only" checked={emergencyDismiss} onChange={(e) => setEmergencyDismiss(e.target.checked)}/>
                <div className="h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex flex-col pr-4"><p className="text-base font-bold">Master Toggle</p><p className="text-slate-500 text-xs font-medium">Enable/Disable all alarms</p></div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-slate-200 dark:bg-[#39393d] p-0.5 has-[:checked]:bg-primary transition-colors">
                <input type="checkbox" className="peer sr-only" checked={anyAlarmActive} onChange={(e) => onToggleAll(e.target.checked)}/>
                <div className="h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <h3 className="px-5 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Sound & Volume</h3>
          <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden shadow-sm divide-y dark:divide-slate-800">
            <button onClick={() => setShowSoundSelector(true)} className="w-full flex items-center justify-between p-4 active:bg-slate-100 dark:active:bg-[#2c2c2e]">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-red-500">music_note</span><p className="text-base font-bold">Default Sound</p></div>
              <div className="flex items-center gap-1 text-slate-500"><span className="text-sm truncate max-w-[120px]">{PRESET_SOUNDS.includes(defaultSound) ? defaultSound : 'Custom'}</span><span className="material-symbols-outlined text-xl">chevron_right</span></div>
            </button>
            <div className="flex flex-col p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">volume_up</span><p className="text-base font-bold">Base Volume</p></div><span className="text-sm font-black text-primary">{Math.round(defaultVolume * 100)}%</span></div>
              <input type="range" min="0" max="1" step="0.01" value={defaultVolume} onChange={(e) => setDefaultVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"/>
            </div>
          </div>
        </section>
        <footer className="mt-12 text-center pb-6"><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Version 2.0 • Real-Time Engine</p></footer>
      </main>
    </div>
  );
};

export default SettingsScreen;
