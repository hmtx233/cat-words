

// Synthesizes retro typewriter sounds using Web Audio API
// No external files required for offline functionality

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Simulate a mechanical keystroke "clack" mixed with a telegraph "beep"
export const playTypeSound = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    
    // --- 1. The Telegraph Tone (Square Wave Beep) ---
    const osc = ctx.createOscillator();
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(750, t); // ~750Hz is a classic telegraph pitch
    
    const oscFilter = ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.value = 2000; // Soften the harsh square edges

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.04, t); // Keep subtle
    // Shorter envelope for faster typing speeds (was 0.06)
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03); 

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    osc.start();
    // Shorter duration for faster typing speeds (was 0.07)
    osc.stop(t + 0.035);

    // --- 2. The Mechanical Click (Impact Noise) ---
    const bufferSize = ctx.sampleRate * 0.04; // 40ms duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill with noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Highpass filter for a "lighter", sharper click (teletype style)
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start();

  } catch (e) {
    console.warn("Audio play failed", e);
  }
};

// Simulate the mechanical motor "zip" of paper feeding out
export const playPrintSound = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const duration = 0.6; // Matches the initial animation kick

    // Use Brown noise for a deeper mechanical rumble
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter integration
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for gain loss
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass sweep to simulate motor spin up/down
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.linearRampToValueAtTime(600, t + (duration/2)); // Spin up
    filter.frequency.linearRampToValueAtTime(100, t + duration); // Spin down

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();

  } catch (e) {
    console.warn("Audio play failed", e);
  }
};