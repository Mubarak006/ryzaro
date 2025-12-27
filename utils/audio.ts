
export const PRESET_SOUNDS = [
  'Loud Beep', 'Siren', 'Digital Alarm', 'Morning Bell', 
  'Cyber Pulse', 'Classic Bell', 'Zen Strings', 'Industrial Tech', 
  'Radar', 'Nuclear', 'Submarine', 'Orbit', 'Static'
];

let audioCtx: AudioContext | null = null;

export const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playPresetSound = (name: string, volume: number = 0.5, duration: number = 1.5, secondsElapsed: number = 0) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  const v = Math.min(1.0, volume);

  switch (name) {
    case 'Radar':
      osc.type = 'square';
      osc.frequency.setValueAtTime(2000, now);
      gain.gain.setValueAtTime(0.8 * v, now);
      gain.gain.setValueAtTime(0, now + 0.1);
      gain.gain.setValueAtTime(0.8 * v, now + 0.2);
      gain.gain.setValueAtTime(0, now + 0.3);
      break;
    case 'Nuclear':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(600, now + 0.2);
      osc.frequency.setValueAtTime(1200, now + 0.4);
      gain.gain.setValueAtTime(v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      break;
    case 'Submarine':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 1.2);
      gain.gain.setValueAtTime(0.7 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      break;
    case 'Orbit':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(3000, now + 0.8);
      gain.gain.setValueAtTime(0.5 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      break;
    case 'Static':
      osc.type = 'square';
      osc.frequency.setValueAtTime(Math.random() * 5000 + 100, now);
      gain.gain.setValueAtTime(v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      break;
    case 'Cyber Pulse':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.8 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      break;
    case 'Classic Bell':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      break;
    case 'Zen Strings':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440 + (secondsElapsed * 10), now + 1.0);
      gain.gain.setValueAtTime(0.3 * v, now);
      gain.gain.linearRampToValueAtTime(0.8 * v, now + 1.0);
      break;
    case 'Industrial Tech':
      osc.type = 'square';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.setValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(v, now);
      gain.gain.setValueAtTime(0, now + 0.05);
      gain.gain.setValueAtTime(v, now + 0.1);
      break;
    case 'Siren':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440 + secondsElapsed, now);
      osc.frequency.exponentialRampToValueAtTime(880 + secondsElapsed, now + 0.5);
      gain.gain.setValueAtTime(0.5 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      break;
    case 'Morning Bell':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      break;
    case 'Loud Beep':
    case 'Digital Alarm':
    default:
      osc.type = 'square';
      osc.frequency.setValueAtTime(name === 'Loud Beep' ? 2200 : 2000, now);
      gain.gain.setValueAtTime(0.6 * v, now);
      gain.gain.setValueAtTime(0, now + 0.1);
      gain.gain.setValueAtTime(0.6 * v, now + 0.2);
      break;
  }

  osc.start(now);
  osc.stop(now + duration);
  
  return { osc, gain };
};
