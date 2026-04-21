// Cute "huat" notification chime using Web Audio API
// Two-tone ascending chime: warm and friendly

const SOUND_KEY = "huat_sound_enabled";

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== "false"; } catch { return true; }
}

export function setSoundEnabled(enabled: boolean) {
  try { localStorage.setItem(SOUND_KEY, String(enabled)); } catch { /* */ }
}

let audioCtx: AudioContext | null = null;

export function playMessageSound() {
  if (!isSoundEnabled()) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const ctx = audioCtx;
    const t = ctx.currentTime;

    // Ka-ching! Cash register sound
    // 1. Short metallic "ka" — noise burst
    const noiseLen = 0.04;
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.6;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseLen);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 4000;
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(t);

    // 2. "Ching" — bright metallic ring (two detuned high sines)
    const ring1 = ctx.createOscillator();
    const ring1Gain = ctx.createGain();
    ring1.type = "sine";
    ring1.frequency.value = 3520; // A7
    ring1Gain.gain.setValueAtTime(0.12, t + 0.03);
    ring1Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    ring1.connect(ring1Gain).connect(ctx.destination);
    ring1.start(t + 0.03);
    ring1.stop(t + 0.35);

    const ring2 = ctx.createOscillator();
    const ring2Gain = ctx.createGain();
    ring2.type = "sine";
    ring2.frequency.value = 4698; // D8
    ring2Gain.gain.setValueAtTime(0.08, t + 0.03);
    ring2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    ring2.connect(ring2Gain).connect(ctx.destination);
    ring2.start(t + 0.03);
    ring2.stop(t + 0.3);

    // 3. Coin shimmer — quick descending sparkle
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(6000, t + 0.05);
    shimmer.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
    shimmerGain.gain.setValueAtTime(0.06, t + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    shimmer.connect(shimmerGain).connect(ctx.destination);
    shimmer.start(t + 0.05);
    shimmer.stop(t + 0.25);
  } catch { /* audio not available */ }
}
