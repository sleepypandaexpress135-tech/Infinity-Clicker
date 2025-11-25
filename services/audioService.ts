
// AUDIO ENGINE 2.0 - "Cinematic Realism"
// Features: Pink/Brown Noise Synthesis, Convolution Reverb, Generative Pads, Sub-bass Rumble, Master Limiting

let ctx: AudioContext | null = null;
let masterBus: GainNode | null = null;
let reverbBus: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;

// State
let isMuted = true;
let ambientNodes: AudioNode[] = [];
let sequencerTimeout: number | null = null;

// --- UTILITIES ---

const createNoiseBuffer = (type: 'white' | 'pink' | 'brown', duration: number): AudioBuffer => {
  if (!ctx) throw new Error("No Audio Context");
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    // Pink noise approximation (1/f)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.075076;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // compensate for gain
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    // Brown noise (1/f^2)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // compensate for gain
    }
  }
  return buffer;
};

const createImpulseResponse = (duration: number, decay: number): AudioBuffer => {
  if (!ctx) throw new Error("No Audio Context");
  const length = ctx.sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  const L = impulse.getChannelData(0);
  const R = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    // Stereo decorrelated exponential decay
    const n = i / length;
    const envelope = Math.pow(1 - n, decay);
    L[i] = (Math.random() * 2 - 1) * envelope;
    R[i] = (Math.random() * 2 - 1) * envelope;
  }
  return impulse;
};

// Soft clipping distortion curve for "warmth"
const makeDistortionCurve = (amount: number) => {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

// --- INITIALIZATION ---

const initAudio = () => {
  const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
  if (!ctx || ctx.state === 'closed') {
    if (AudioContextClass) {
      ctx = new AudioContextClass({ latencyHint: 'interactive' });

      // 1. MASTER BUS (Limiter/Compressor)
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -2;
      limiter.knee.value = 10;
      limiter.ratio.value = 20; // Infinity:1 limiting
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;
      
      masterBus = ctx.createGain();
      masterBus.gain.value = 0.8; // Safe master level
      masterBus.connect(limiter);
      limiter.connect(ctx.destination);

      // 2. REVERB BUS (Space Ambience)
      reverbNode = ctx.createConvolver();
      reverbNode.buffer = createImpulseResponse(4, 3); // Large, dark hall
      reverbBus = ctx.createGain();
      reverbBus.gain.value = 0.4;
      reverbBus.connect(reverbNode);
      reverbNode.connect(masterBus);

      // 3. SUB-BUSES
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.6;
      musicBus.connect(masterBus);
      musicBus.connect(reverbBus); // Music goes to reverb

      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1.0;
      sfxBus.connect(masterBus);
      sfxBus.connect(reverbBus); // SFX goes to reverb too
    }
  }

  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(console.error);
  }
};

// --- AMBIENCE ENGINE ---

const startRumble = (now: number) => {
  if (!ctx || !musicBus) return;
  // Deep space hull rumble (Brown Noise + LPF)
  const buffer = createNoiseBuffer('brown', 5);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 80; // Deep sub bass

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 4);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(musicBus);
  source.start(now);
  ambientNodes.push(source, gain, filter);
};

const startSpaceWind = (now: number) => {
  if (!ctx || !musicBus) return;
  // High airy hiss (Pink Noise + HPF + Stereo Panning)
  const buffer = createNoiseBuffer('pink', 10);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;
  filter.Q.value = 1;

  // LFO for filter movement
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // Slow breathing
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const panner = ctx.createStereoPanner();
  // LFO for panning
  const panLfo = ctx.createOscillator();
  panLfo.frequency.value = 0.05;
  panLfo.connect(panner.pan);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 5);

  source.connect(filter);
  filter.connect(panner);
  panner.connect(gain);
  gain.connect(musicBus);
  
  source.start(now);
  lfo.start(now);
  panLfo.start(now);

  ambientNodes.push(source, filter, lfo, lfoGain, panner, panLfo, gain);
};

// Generative Chord Pad
const CHORDS = [
  [130.81, 196.00, 246.94, 311.13], // Cmaj7#11 (Lydian)
  [110.00, 164.81, 196.00, 261.63], // Am9
  [87.31, 130.81, 174.61, 220.00],  // Fmaj7
  [146.83, 220.00, 261.63, 349.23], // Dm11
];

const playGenerativePad = () => {
  if (!isMuted && ctx && musicBus) {
    const now = ctx.currentTime;
    // Pick a chord
    const chord = CHORDS[Math.floor(Math.random() * CHORDS.length)];
    
    // Play each note in the chord
    chord.forEach((freq, i) => {
      // Use Triangle for soft pad sound
      const osc = ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      // Slight detune for chorus effect
      osc.detune.value = (Math.random() * 10) - 5;

      const gain = ctx!.createGain();
      
      // Very slow attack/release for "Pad" feel
      const attack = 2 + Math.random();
      const hold = 4 + Math.random();
      const release = 4 + Math.random();
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + attack);
      gain.gain.setValueAtTime(0.04, now + attack + hold);
      gain.gain.linearRampToValueAtTime(0, now + attack + hold + release);

      // Stereo spread
      const panner = ctx!.createStereoPanner();
      panner.pan.value = (Math.random() * 2) - 1;

      osc.connect(panner);
      panner.connect(gain);
      gain.connect(musicBus!);

      osc.start(now);
      osc.stop(now + attack + hold + release);
    });

    // Schedule next chord
    const nextTime = (6 + Math.random() * 4) * 1000;
    sequencerTimeout = window.setTimeout(playGenerativePad, nextTime);
  }
};

export const toggleAmbientSound = (play: boolean) => {
  isMuted = !play;
  initAudio();
  
  if (!ctx) return;
  const now = ctx.currentTime;

  if (play) {
    // Start Ambience
    startRumble(now);
    startSpaceWind(now);
    playGenerativePad();
  } else {
    // Stop All
    ambientNodes.forEach(node => {
        // Ramp down gains before stopping if possible
        if (node instanceof GainNode) {
            node.gain.setTargetAtTime(0, now, 0.5);
        }
        // Disconnect/Stop after delay
        setTimeout(() => {
            node.disconnect();
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                try { node.stop(); } catch(e) {}
            }
        }, 1000);
    });
    ambientNodes = [];
    if (sequencerTimeout) window.clearTimeout(sequencerTimeout);
  }
};

// --- SFX ENGINE ---

export const playSound = (type: 'click' | 'buy' | 'unlock' | 'error' | 'prestige' | 'achievement' | 'hover' | 'purge') => {
  initAudio();
  if (!ctx || !sfxBus) return;
  const now = ctx.currentTime;

  switch (type) {
    case 'click': {
        // Mechanical Switch: High pass burst + Low Sine Thud
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.frequency.setValueAtTime(300, now);
        clickOsc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        clickGain.gain.setValueAtTime(0.5, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        clickOsc.connect(clickGain);
        clickGain.connect(sfxBus);
        clickOsc.start(now);
        clickOsc.stop(now + 0.05);

        // Texture: Pink Noise burst for "Tactile" feel
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer('pink', 0.1);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(sfxBus);
        noise.start(now);
        break;
    }
    case 'hover': {
        // Subtle high-tech tick
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(sfxBus);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
    }
    case 'buy': {
        // Hydraulic / Heavy Machinery Sound
        // Layer 1: Low frequency sine drop (The weight)
        const sub = ctx.createOscillator();
        sub.frequency.setValueAtTime(100, now);
        sub.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.6, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        sub.connect(subGain);
        subGain.connect(sfxBus);
        sub.start(now);
        sub.stop(now + 0.3);

        // Layer 2: Servo Motor (Sawtooth + LPF)
        const servo = ctx.createOscillator();
        servo.type = 'sawtooth';
        servo.frequency.setValueAtTime(150, now);
        servo.frequency.linearRampToValueAtTime(100, now + 0.2);
        const servoFilter = ctx.createBiquadFilter();
        servoFilter.type = 'lowpass';
        servoFilter.frequency.setValueAtTime(800, now);
        servoFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        const servoGain = ctx.createGain();
        servoGain.gain.setValueAtTime(0.1, now);
        servoGain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        servo.connect(servoFilter);
        servoFilter.connect(servoGain);
        servoGain.connect(sfxBus);
        servo.start(now);
        servo.stop(now + 0.2);
        break;
    }
    case 'unlock': {
        // Majestic Sci-Fi Swell
        const frequencies = [261.63, 392.00, 523.25, 783.99]; // C Major
        frequencies.forEach((f, i) => {
            const osc = ctx!.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = f;
            const gain = ctx!.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            
            // Pan them slightly apart
            const panner = ctx!.createStereoPanner();
            panner.pan.value = (Math.random() * 1.5) - 0.75;

            osc.connect(panner);
            panner.connect(gain);
            gain.connect(sfxBus!);
            osc.start(now);
            osc.stop(now + 2);
        });
        
        // Add a "shimmer" noise sweep
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer('white', 2);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 10;
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(5000, now + 1.5);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0, now);
        nGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
        nGain.gain.linearRampToValueAtTime(0, now + 1.5);
        
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(sfxBus);
        noise.start(now);
        break;
    }
    case 'prestige': {
        // "The Void Suck" - Flanged Noise Vacuum
        const duration = 3;
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer('pink', duration);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(100, now);
        filter.frequency.exponentialRampToValueAtTime(15000, now + duration - 0.5);

        // Flanger Effect (Comb Filter) via Delay
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.005;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5; // Fast wobble
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.002;
        lfo.connect(lfoGain);
        lfoGain.connect(delay.delayTime);

        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.8, now + duration - 0.5);
        mainGain.gain.linearRampToValueAtTime(0, now + duration);

        noise.connect(filter);
        filter.connect(delay);
        delay.connect(mainGain);
        mainGain.connect(sfxBus);
        
        lfo.start(now);
        noise.start(now);
        lfo.stop(now + duration);
        break;
    }
    case 'error': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.2);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(sfxBus);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
    case 'achievement': {
         // Bright, fast arpeggio
         [440, 554, 659, 880, 1108].forEach((f, i) => {
             const osc = ctx!.createOscillator();
             osc.type = 'square';
             osc.frequency.value = f;
             const gain = ctx!.createGain();
             gain.gain.setValueAtTime(0, now + i*0.05);
             gain.gain.linearRampToValueAtTime(0.05, now + i*0.05 + 0.05);
             gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.05 + 0.4);
             osc.connect(gain);
             gain.connect(sfxBus!);
             osc.start(now + i*0.05);
             osc.stop(now + i*0.05 + 0.4);
         });
         break;
    }
    case 'purge': {
        // Digital destruction
        const buffer = createNoiseBuffer('white', 1.5);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        // Bitcrush simulation (Sample & Hold via bandpass artifacts)
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(10, now + 1.5);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(sfxBus);
        src.start(now);
        break;
    }
  }
};
