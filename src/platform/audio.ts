// Web Audio 合成音效；任何失敗都靜默略過，不影響遊戲。
export type SfxName = 'pop' | 'munch' | 'giggle' | 'snore' | 'jingle' | 'splash' | 'sparkle' | 'whoosh' | 'boing' | 'tada';

type Note = readonly [freq: number, start: number, dur: number, type: OscillatorType];

const SFX_NOTES: Record<SfxName, readonly Note[]> = {
  pop: [[660, 0, 0.08, 'sine'], [990, 0.03, 0.06, 'sine']],
  munch: [[220, 0, 0.06, 'square'], [180, 0.08, 0.06, 'square']],
  giggle: [[880, 0, 0.07, 'triangle'], [1046, 0.08, 0.07, 'triangle'], [880, 0.16, 0.07, 'triangle']],
  snore: [[110, 0, 0.5, 'sine'], [98, 0.6, 0.5, 'sine']],
  jingle: [[523, 0, 0.12, 'triangle'], [659, 0.12, 0.12, 'triangle'], [784, 0.24, 0.2, 'triangle']],
  splash: [[400, 0, 0.15, 'sine'], [200, 0.05, 0.25, 'sine']],
  sparkle: [[1318, 0, 0.1, 'sine'], [1760, 0.08, 0.12, 'sine'], [2093, 0.16, 0.16, 'sine']],
  whoosh: [[300, 0, 0.3, 'sawtooth'], [900, 0.1, 0.25, 'sawtooth']],
  boing: [[200, 0, 0.3, 'sine'], [400, 0.05, 0.2, 'sine']],
  tada: [[523, 0, 0.15, 'square'], [659, 0.15, 0.15, 'square'], [784, 0.3, 0.15, 'square'], [1046, 0.45, 0.35, 'square']],
};

let ctx: AudioContext | null = null;
let enabled = true;
let unlockRegistered = false;

function ensureCtx(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

function resumeCtx(): void {
  try {
    const c = ensureCtx();
    if (c && c.state !== 'running') void Promise.resolve(c.resume()).catch(() => {});
  } catch {
    // 靜默
  }
}

export function unlockAudio(): void {
  resumeCtx();
  if (unlockRegistered || typeof window === 'undefined') return;
  unlockRegistered = true;
  // 持續監聽：iOS 可能在背景或來電後再次暫停 context，之後每次點擊都要能恢復。
  window.addEventListener('pointerdown', resumeCtx, { capture: true });
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function sfx(name: SfxName): void {
  if (!enabled || !ctx) return;
  try {
    const c = ctx;
    const t0 = c.currentTime;
    for (const [freq, start, dur, type] of SFX_NOTES[name]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0 + start);
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + dur);
    }
  } catch {
    // 音效失敗靜默略過
  }
}
