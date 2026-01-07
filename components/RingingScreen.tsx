
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Alarm } from '../types';
import { CustomSound } from '../App';
import { playPresetSound, getAudioContext } from '../utils/audio';

interface Props {
  alarm: Alarm;
  customSounds: CustomSound[];
  baseVolume: number;
  emergencyDismissEnabled: boolean;
  onSnooze: (minutes: number) => void;
  onComplete: () => void;
}

const RingingScreen: React.FC<Props> = ({ alarm, customSounds, baseVolume, emergencyDismissEnabled, onSnooze, onComplete }) => {
  const [input, setInput] = useState('');
  const [vibrating, setVibrating] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  
  // Task specific states
  const [memoryCards, setMemoryCards] = useState<{id: number, value: string, flipped: boolean, matched: boolean}[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [sequenceNumbers, setSequenceNumbers] = useState<number[]>([]);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);
  const targetShake = alarm.difficulty === 'Hard' ? 50 : alarm.difficulty === 'Medium' ? 30 : 15;

  const soundIntervalRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // Math Task Generator
  const mathProblem = useMemo(() => {
    const min = alarm.difficulty === 'Easy' ? 1 : alarm.difficulty === 'Medium' ? 10 : 25;
    const max = alarm.difficulty === 'Easy' ? 10 : alarm.difficulty === 'Medium' ? 50 : 99;
    const a = Math.floor(Math.random() * (max - min) + min);
    const b = Math.floor(Math.random() * (max - min) + min);
    return { a, b, answer: a + b };
  }, [alarm.difficulty]);

  // Task Initializers
  useEffect(() => {
    if (alarm.task === 'Memory') {
      const pairCount = alarm.difficulty === 'Hard' ? 6 : alarm.difficulty === 'Medium' ? 4 : 2;
      const icons = ['🔥', '⭐', '💎', '🍀', '🍎', '🌈', '🌊', '🍄'].slice(0, pairCount);
      const deck = [...icons, ...icons]
        .map((v, i) => ({ id: i, value: v, flipped: false, matched: false }))
        .sort(() => Math.random() - 0.5);
      setMemoryCards(deck);
    } else if (alarm.task === 'Sequence') {
      const count = alarm.difficulty === 'Hard' ? 12 : alarm.difficulty === 'Medium' ? 8 : 5;
      const nums = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
      setSequenceNumbers(nums);
      setCurrentSequenceIndex(0);
    }
  }, [alarm.task, alarm.difficulty]);

  const calculateRampedVolume = useCallback((elapsed: number, target: number) => {
    // ENFORCEMENT: After 40 seconds, we ignore user settings and hit 100% volume
    if (elapsed > 40) return 1.0;

    const rampDuration = 15; // Faster ramp: 15 seconds to target
    const startRatio = 0.2; // Start at 20% of target
    
    if (elapsed >= rampDuration) return target;
    const ratio = startRatio + (1 - startRatio) * (elapsed / rampDuration);
    return Math.max(0.1, target * ratio);
  }, []);

  const playSound = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.error("Audio resume failed", e));
    }

    const currentVolume = calculateRampedVolume(secondsElapsed, baseVolume);
    const custom = customSounds.find(cs => cs.id === alarm.sound);
    
    if (custom) {
      if (!audioElRef.current) {
        audioElRef.current = new Audio(custom.data);
        audioElRef.current.loop = true;
      }
      audioElRef.current.volume = currentVolume;
      audioElRef.current.play().catch(e => {
        console.warn("Autoplay blocked for custom sound, waiting for interaction", e);
      });
      return;
    }

    // Pass secondsElapsed so the preset generator can increase urgency
    playPresetSound(alarm.sound, currentVolume, 1.5, secondsElapsed);
  }, [alarm.sound, customSounds, baseVolume, secondsElapsed, calculateRampedVolume]);

  useEffect(() => {
    // Initial trigger
    playSound();
    
    // Fast pulsing logic for audio context synthesis
    soundIntervalRef.current = window.setInterval(playSound, 1000);

    const vibeInterval = window.setInterval(() => setVibrating(v => !v), 150);
    timerRef.current = window.setInterval(() => setSecondsElapsed(s => s + 1), 1000);

    return () => {
      clearInterval(vibeInterval);
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioElRef.current) { 
        audioElRef.current.pause(); 
        audioElRef.current.src = ""; 
      }
    };
  }, [alarm.sound, customSounds, playSound]);

  const handleMemoryClick = (id: number) => {
    if (selectedCards.length === 2 || memoryCards.find(c => c.id === id)?.matched || memoryCards.find(c => c.id === id)?.flipped) return;

    const newCards = memoryCards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setMemoryCards(newCards);
    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);

      if (firstCard?.value === secondCard?.value) {
        const matchedCards = newCards.map(c => (c.id === firstId || c.id === secondId) ? { ...c, matched: true } : c);
        setMemoryCards(matchedCards);
        setSelectedCards([]);
        if (matchedCards.every(c => c.matched)) setTimeout(onComplete, 500);
      } else {
        setTimeout(() => {
          setMemoryCards(newCards.map(c => (c.id === firstId || c.id === secondId) ? { ...c, flipped: false } : c));
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const handleSequenceClick = (num: number) => {
    if (num === currentSequenceIndex + 1) {
      if (num === sequenceNumbers.length) onComplete();
      else setCurrentSequenceIndex(num);
    } else {
      setCurrentSequenceIndex(0);
    }
  };

  // Fixed: Use 'num' instead of undefined 'n' in handleKeypad
  const handleKeypad = (num: string) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    audioElRef.current?.play().catch(() => {});
    if (num === 'back') setInput(prev => prev.slice(0, -1));
    else if (num === 'check') { if (parseInt(input) === mathProblem.answer) onComplete(); else setInput(''); }
    else if (input.length < 4) setInput(prev => prev + num);
  };

  return (
    <div 
      className="h-full w-full bg-background-dark relative overflow-hidden flex flex-col p-6 pb-8 select-none" 
      onClick={() => { 
        const ctx = getAudioContext(); 
        if (ctx.state === 'suspended') ctx.resume(); 
        audioElRef.current?.play().catch(() => {}); 
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[60%] bg-alarm-urgent/30 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: `${Math.max(0.4, 2 - secondsElapsed/15)}s` }}></div>
      </div>
      <div className="relative z-10 flex flex-col h-full w-full justify-between">
        <div className="flex flex-col items-center justify-center mt-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`material-symbols-outlined text-alarm-urgent ${vibrating ? 'scale-125' : 'scale-100'} transition-transform duration-75`} style={{ fontSize: '20px' }}>notifications_active</span>
            <span className="text-alarm-urgent font-black tracking-widest text-[10px] uppercase">
              {secondsElapsed > 40 ? 'MAX INTENSITY' : `Ringing for ${secondsElapsed}s`}
            </span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-white leading-none">{alarm.time}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{alarm.period}</p>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto my-4 overflow-hidden">
          <div className="w-full text-center">
            {!showSnoozeOptions ? (
              <>
                <h2 className="text-white font-black text-xl mb-4 uppercase tracking-tighter">
                  {alarm.task === 'Math' ? 'Solve to Silence' : 
                   alarm.task === 'Shake' ? 'Shake Phone' :
                   alarm.task === 'Memory' ? 'Match All Pairs' :
                   alarm.task === 'Sequence' ? 'Tap in Order (1 → ...)' : 'Scan Item'}
                </h2>

                {alarm.task === 'Math' && (
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-black text-white mb-6">{mathProblem.a} + {mathProblem.b}</div>
                    <div className="w-full h-16 bg-black/40 border-2 border-white/10 rounded-2xl flex items-center justify-center text-3xl font-mono tracking-[0.5em] text-white shadow-2xl relative mb-6">
                      <span>{input}</span>
                      <div className="w-1 h-8 bg-primary ml-1 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'check'].map(n => (
                        <button key={n} onClick={(e) => { e.stopPropagation(); typeof n === 'number' ? handleKeypad(n.toString()) : handleKeypad(n as string); }} className={`h-12 rounded-xl font-black text-xl transition-all shadow-md backdrop-blur-md ${n === 'check' ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}>
                          {n === 'back' ? <span className="material-symbols-outlined">backspace</span> : n === 'check' ? <span className="material-symbols-outlined text-xl">check</span> : n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {alarm.task === 'Shake' && (
                  <div className="flex flex-col items-center py-8">
                    <div className="relative mb-8">
                       <span className={`material-symbols-outlined text-white text-[100px] ${shakeCount > 0 ? 'animate-bounce' : ''}`}>vibration</span>
                       <div className="absolute top-0 right-0 bg-primary px-3 py-1 rounded-full text-xs font-black animate-pulse">{Math.round((shakeCount/targetShake)*100)}%</div>
                    </div>
                    <button 
                      onPointerDown={() => setShakeCount(p => Math.min(targetShake, p + 1))}
                      className="w-48 h-48 rounded-full bg-primary/20 border-4 border-primary text-white font-black text-2xl shadow-2xl shadow-primary/30 active:scale-90 transition-transform flex items-center justify-center text-center p-4"
                    >
                      TAP & SHAKE!<br/><span className="text-sm opacity-60">HOLD ME</span>
                    </button>
                    {shakeCount >= targetShake && setTimeout(onComplete, 300) && null}
                  </div>
                )}

                {alarm.task === 'Memory' && (
                  <div className={`grid ${memoryCards.length > 8 ? 'grid-cols-4' : 'grid-cols-2'} gap-3 p-2 w-full max-w-[320px] mx-auto`}>
                    {memoryCards.map(card => (
                      <button
                        key={card.id}
                        onClick={(e) => { e.stopPropagation(); handleMemoryClick(card.id); }}
                        className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all duration-300 transform ${card.flipped || card.matched ? 'bg-primary rotate-y-180' : 'bg-white/10'}`}
                      >
                        {(card.flipped || card.matched) ? card.value : '?'}
                      </button>
                    ))}
                  </div>
                )}

                {alarm.task === 'Sequence' && (
                  <div className="grid grid-cols-3 gap-3 p-2 w-full max-w-[320px] mx-auto">
                    {sequenceNumbers.map(num => (
                      <button
                        key={num}
                        onClick={(e) => { e.stopPropagation(); handleSequenceClick(num); }}
                        className={`h-16 rounded-2xl font-black text-2xl transition-all ${num <= currentSequenceIndex ? 'bg-primary text-white scale-90' : 'bg-white/10 text-white active:bg-white/20'}`}
                        disabled={num <= currentSequenceIndex}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}

                {alarm.task === 'QR' && (
                  <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white text-[100px] animate-pulse">qr_code_scanner</span>
                    <p className="text-white text-xl font-black mt-4">SCAN REGISTERED QR</p>
                    <button onClick={onComplete} className="mt-8 px-10 py-4 bg-primary rounded-2xl text-white font-black">Scan Now</button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-4 animate-fade-in w-full max-w-xs mx-auto">
                <h2 className="text-white font-black text-2xl mb-2 uppercase tracking-tight">Snooze Duration</h2>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[2, 5, 10, 15, 20, 30].map(min => (
                    <button 
                      key={min} 
                      onClick={() => onSnooze(min)} 
                      className="py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-black hover:bg-white/20 transition-all active:scale-[0.97]"
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowSnoozeOptions(false)} 
                  className="mt-4 w-full py-3 bg-white/5 rounded-xl text-slate-500 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center w-full gap-4">
          <div className="flex items-center gap-4 w-full">
            {emergencyDismissEnabled && !showSnoozeOptions && (
              <button 
                onClick={() => setShowSnoozeOptions(true)} 
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-200 font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Snooze
              </button>
            )}
            <div className="flex flex-col items-center flex-[2] gap-1 overflow-hidden">
              <h3 className="text-white text-lg font-black truncate w-full text-center">{alarm.label}</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 w-full backdrop-blur-md overflow-hidden">
                <span className="material-symbols-outlined text-primary text-[16px]">music_note</span>
                <span className="text-[10px] font-bold text-slate-100 truncate">{customSounds.find(c => c.id === alarm.sound)?.name || alarm.sound}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RingingScreen;
