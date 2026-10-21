import type { GameState } from './state';
import type { Outcome } from './events';
import { applyReward } from './rewards';
import { WELCOME_LETTER_TEXT } from '../content/letters';

const H = 3600_000;
const MAX_OFFLINE_HOURS = 72;
const NEED_FLOOR = 30;
const DECAY_PER_HOUR = { tummy: 4, clean: 3, mood: 5 } as const;

export function localDate(now: number): string {
  const d = new Date(now);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function offlineMs(s: GameState, now: number): number {
  return Math.max(0, now - s.lastSeenAt);
}

function decay(cur: number, rate: number, hours: number): number {
  return cur > NEED_FLOOR ? Math.max(NEED_FLOOR, cur - rate * hours) : cur;
}

export function applyElapsed(s: GameState, now: number): GameState {
  const hours = Math.min(offlineMs(s, now) / H, MAX_OFFLINE_HOURS);
  return {
    ...s,
    needs: {
      tummy: decay(s.needs.tummy, DECAY_PER_HOUR.tummy, hours),
      clean: decay(s.needs.clean, DECAY_PER_HOUR.clean, hours),
      mood: decay(s.needs.mood, DECAY_PER_HOUR.mood, hours),
    },
    energy: Math.min(100, s.energy + 10 * hours),
    lastSeenAt: now,
  };
}

export function isNewDay(s: GameState, now: number): boolean {
  const today = localDate(now);
  if (today > s.lastDailyDate) return true;
  // 手機時間被往後調過又調回來：lastDailyDate 比明天還晚就視為壞值，讓每日重置恢復。
  return s.lastDailyDate > localDate(now + 36 * H);
}

/** 必須在 applyElapsed 之前呼叫（需要舊的 lastSeenAt）。 */
export function welcomeBack(s: GameState, now: number): Outcome | null {
  if (offlineMs(s, now) <= 24 * H) return null;
  const out = applyReward(s, { starSand: 30 });
  const letter = {
    id: `welcome-${now}`,
    date: localDate(now),
    from: 'mianhua' as const,
    text: WELCOME_LETTER_TEXT,
    read: false,
  };
  return { ...out, state: { ...out.state, letters: [letter, ...out.state.letters] } };
}
