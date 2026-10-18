// 墜飾叮噹音效：Web Audio 合成；任何失敗都靜默略過。呼叫端負責檢查音效設定。
import { ensureCtx } from './audio';

/** 每個墜飾音色 id 對應的音符頻率（Hz）。 */
export const PENDANT_TONES: Record<string, number[]> = {
  'bell-soft': [880, 1320],
  'chime-shell': [1046, 1568, 1318],
  'chime-mushroom': [659, 988],
  'chime-snow': [1568, 2093, 1760],
  'chime-cloud': [784, 1046],
  'chime-star': [1318, 1760, 2093],
  'chime-moon': [987, 1318, 1480],
  'chime-heart': [880, 1109, 1397],
};

const NOTE_SPACING_S = 0.15;
const NOTE_GAIN = 0.15;
const NOTE_LENGTH_S = 0.3;

export function playPendantSound(soundId: string): void {
  const notes = PENDANT_TONES[soundId];
  if (!notes) return;
  try {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') void Promise.resolve(c.resume()).catch(() => {});
    const t0 = c.currentTime;
    notes.forEach((freq, i) => {
      const start = t0 + i * NOTE_SPACING_S;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(NOTE_GAIN, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + NOTE_LENGTH_S);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(start);
      osc.stop(start + NOTE_LENGTH_S);
    });
  } catch {
    // 靜默
  }
}

/** 第 i 個音色在 i × gapMs 後播放（i = 0 立即播放）。 */
export function playPendantSounds(
  soundIds: string[],
  gapMs: number,
  play: (id: string) => void = playPendantSound,
): void {
  soundIds.forEach((id, i) => {
    if (i === 0) play(id);
    else setTimeout(() => play(id), i * gapMs);
  });
}
