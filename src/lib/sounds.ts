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

    // First tone (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 523;
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second tone (E5) — slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 659;
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.3);

    // Third tone (G5) — happy ascending
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.value = 784;
    gain3.gain.setValueAtTime(0.12, ctx.currentTime + 0.2);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc3.connect(gain3).connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.2);
    osc3.stop(ctx.currentTime + 0.45);
  } catch { /* audio not available */ }
}
