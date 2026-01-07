
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
    if (previewAudioRef.current) previewAudioRef.current.pause();
    const custom = customSounds.find(cs => cs.id === soundId);
    if (custom) {
      const audio = new Audio(custom.data);
      audio.volume = Math.max(0.2, defaultVolume);
      audio.play();
      previewAudioRef.current = audio;
      setTimeout(() => { audio.pause(); setActivePreview(prev => prev === soundId ? null : prev); }, 3000);
      return;
    }
    playPresetSound(soundId, defaultVolume, 1.5);
    setTimeout(() => { setActivePreview(prev => prev === soundId ? null : prev); }, 1500);
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

  const Header = ({ title, onBackAction }: { title: string, onBackAction: () => void }) => (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 bg-transparent backdrop-blur-xl border-b border-white/5">
      <button onClick={onBackAction} className="flex items-center text-primary">
        <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        <span className="ml-2 text-base font-bold tracking-tight">Back</span>
      </button>
      <h1 className="text-lg font-black tracking-widest uppercase">{title}</h1>
      <div className="w-16"></div>
    </header>
  );

  if (showSoundSelector) {
    return (
      <div className="h-full flex flex-col text-white">
        <Header title="Enforcement Audio" onBackAction={() => setShowSoundSelector(false)} />
        <main className="p-6 space-y-3 flex-1 overflow-y-auto no-scrollbar pb-10">
          <p className="px-1 pb-4 text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Audit Samples</p>
          {PRESET_SOUNDS.map(s => (
            <label key={s} className="flex items-center justify-between p-5 rounded-[24px] glass active:scale-[0.98] border border-transparent has-[:checked]:border-primary transition-all">
              <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined ${activePreview === s ? 'text-primary animate-pulse' : 'text-white/40'}`}>{activePreview === s ? 'volume_up' : getSoundIcon(s)}</span>
                <span className="font-bold tracking-tight uppercase text-sm">{s}</span>
              </div>
              <input type="radio" name="sound-choice" className="size-6 text-primary bg-white/10 border-white/20 focus:ring-0 rounded-full" checked={defaultSound === s} onChange={() => { setDefaultSound(s); previewSound(s); }}/>
            </label>
          ))}
          <button onClick={() => fileInputRef.current?.click()} className="w-full mt-6 flex items-center justify-center gap-3 h-16 rounded-[24px] bg-gradient-to-r from-primary to-secondary text-white font-black shadow-xl shadow-primary/20 active:scale-95 transition-all">
            <span className="material-symbols-outlined">upload</span><span>Import Custom Track</span>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload}/>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-white">
      <Header title="Settings" onBackAction={onBack} />
      <main className="flex-1 w-full max-w-md mx-auto pb-10 overflow-y-auto no-scrollbar">
        <section className="mt-8">
          <h3 className="px-8 pb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Enforcement Logic</h3>
          <div className="mx-6 glass rounded-[32px] overflow-hidden divide-y divide-white/5">
            {[
              { label: 'Emergency Dismiss', sub: 'Allow snooze protocol', val: emergencyDismiss, set: setEmergencyDismiss },
              { label: 'Master Protocol', sub: 'Toggle all active signals', val: anyAlarmActive, set: onToggleAll }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-6">
                <div className="flex flex-col pr-4">
                  <p className="text-base font-black tracking-tight">{item.label}</p>
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider">{item.sub}</p>
                </div>
                <label className="relative flex h-[34px] w-[60px] cursor-pointer items-center rounded-full bg-white/10 p-1.5 has-[:checked]:bg-primary transition-all">
                  <input type="checkbox" className="peer sr-only" checked={item.val} onChange={(e) => item.set(e.target.checked)}/>
                  <div className="h-[24px] w-[24px] rounded-full bg-white shadow-xl transition-all peer-checked:translate-x-[26px]"></div>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h3 className="px-8 pb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Audio Environment</h3>
          <div className="mx-6 glass rounded-[32px] overflow-hidden divide-y divide-white/5">
            <button onClick={() => setShowSoundSelector(true)} className="w-full flex items-center justify-between p-6 active:bg-white/5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">music_note</span>
                <p className="text-base font-black tracking-tight">Signal Sound</p>
              </div>
              <div className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px]">
                <span className="truncate max-w-[120px]">{PRESET_SOUNDS.includes(defaultSound) ? defaultSound : 'Custom'}</span>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </div>
            </button>
            <div className="flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary">volume_up</span>
                  <p className="text-base font-black tracking-tight">Base Intensity</p>
                </div>
                <span className="text-sm font-black text-primary">{Math.round(defaultVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={defaultVolume} onChange={(e) => setDefaultVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"/>
            </div>
          </div>
        </section>
        
        <footer className="mt-16 text-center pb-8">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Version 3.0 • Zen Enforcement</p>
        </footer>
      </main>
    </div>
  );
};

export default SettingsScreen;
