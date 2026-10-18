import type { GameState, Mood } from './state';

const H = 3600_000;
const SLEEP_START_HOUR = 23;
const SLEEP_END_HOUR = 6;
const LONG_OFFLINE_MS = 12 * H;

/** 依優先順序判斷熊貓情緒：睡覺 → 想睡 → 撒嬌 → 開心 → 普通。 */
export function moodOf(s: GameState, now: number, justOpenedAfterMs: number | null): Mood {
  const awake = s.awakeUntil !== null && now < s.awakeUntil;
  if (!awake) {
    const h = new Date(now).getHours();
    const nightTime = h >= SLEEP_START_HOUR || h < SLEEP_END_HOUR;
    const longOffline = justOpenedAfterMs !== null && justOpenedAfterMs > LONG_OFFLINE_MS;
    if (nightTime || longOffline) return 'sleeping';
  }
  if (s.energy < 25) return 'sleepy';
  const { tummy, clean, mood } = s.needs;
  if (tummy < 50 || clean < 50 || mood < 50) return 'clingy';
  if ((tummy + clean + mood) / 3 >= 70) return 'happy';
  return 'normal';
}

/** 回傳 PandaPose 字面值（字串；core 不匯入 UI 型別，見 C22）。 */
export function idlePoseFor(mood: Mood): string {
  switch (mood) {
    case 'sleeping': return 'sleep';
    case 'sleepy': return 'yawn';
    case 'clingy': return 'armsOut';
    case 'happy': return 'dance';
    case 'normal': return 'sit';
  }
}
