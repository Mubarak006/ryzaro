
export const PRESET_SOUNDS = [
  'Loud Beep', 'Siren', 'Digital Alarm', 'Morning Bell', 
  'Cyber Pulse', 'Classic Bell', 'Zen Strings', 'Industrial Tech', 
  'Radar', 'Nuclear', 'Submarine', 'Orbit', 'Static'
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

export const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Global chain for loudness and protection
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

    compressor.connect(masterGain);
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
};

export const playPresetSound = (name: string, volume: number = 0.5, duration: number = 1.5, secondsElapsed: number = 0) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(compressor!);

  // Adjust volume for high-urgency alarms
  // If we've been ringing for more than 45 seconds, we ignore the user setting and go to 100%
  const urgencyBoost = secondsElapsed > 45 ? 1.0 : volume;
  const v = Math.min(1.0, urgencyBoost);

  const createOsc = (freq: number, type: OscillatorType, startTime: number) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(gain);
    return osc;
  };

  switch (name) {
    case 'Nuclear': {
      // Harmonic stack for maximum dissonance and loudness
      const osc1 = createOsc(1200, 'sawtooth', now);
      const osc2 = createOsc(1210, 'square', now); // Detuned for thickness
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(v, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
      break;
    }
    case 'Siren': {
      const osc = createOsc(400, 'sawtooth', now);
      // Sweeping frequency is very piercing
      osc.frequency.exponentialRampToValueAtTime(1200 + (secondsElapsed * 2), now + 0.5);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(v * 0.8, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      osc.start(now);
      osc.stop(now + 1.0);
      break;
    }
    case 'Radar': {
      const osc = createOsc(2500, 'square', now); // High pitch square wave is very annoying/loud
      gain.gain.setValueAtTime(v, now);
      gain.gain.setValueAtTime(0, now + 0.08);
      gain.gain.setValueAtTime(v, now + 0.15);
      gain.gain.setValueAtTime(0, now + 0.23);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }
    case 'Loud Beep':
    case 'Digital Alarm': {
      const osc = createOsc(name === 'Loud Beep' ? 2800 : 2200, 'square', now);
      gain.gain.setValueAtTime(v, now);
      gain.gain.setValueAtTime(0, now + 0.15);
      gain.gain.setValueAtTime(v, now + 0.3);
      gain.gain.setValueAtTime(0, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }
    case 'Industrial Tech': {
      const osc = createOsc(60, 'square', now);
      const osc2 = createOsc(180, 'sawtooth', now);
      gain.gain.setValueAtTime(v, now);
      gain.gain.setValueAtTime(0, now + 0.05);
      gain.gain.setValueAtTime(v, now + 0.1);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.2);
      osc2.stop(now + 0.2);
      break;
    }
    default: {
      // Fallback to basic loud pulse
      const osc = createOsc(1000, 'sawtooth', now);
      gain.gain.setValueAtTime(v, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    }
  }

  return { gain };
};
