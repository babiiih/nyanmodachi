// Lightweight WebAudio SFX — no assets, works offline.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.15,
  delay = 0,
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playFeed() {
  // Munch: two quick low pops
  tone(320, 0.09, "square", 0.12);
  tone(220, 0.1, "square", 0.12, 0.09);
}

export function playPet() {
  // Chime up
  tone(660, 0.12, "sine", 0.14);
  tone(880, 0.14, "sine", 0.12, 0.08);
}

export function playAlert() {
  tone(500, 0.15, "triangle", 0.1);
  tone(380, 0.2, "triangle", 0.1, 0.14);
}
