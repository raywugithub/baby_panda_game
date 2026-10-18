import type { GameState } from './state';
import { isNewDay, localDate } from './time';

export type DailyHandler = (s: GameState, today: string, now: number) => GameState;

const resetDaily: DailyHandler = (s) => {
  const friends = { ...s.friends };
  for (const id of Object.keys(friends) as (keyof typeof friends)[]) {
    friends[id] = { ...friends[id], chatsToday: 0 };
  }
  return {
    ...s,
    daily: { revisitXpCount: 0, freeBoxUsed: false, visitor: null, visitorDone: false },
    friends,
  };
};

export const dailyHandlers: DailyHandler[] = [resetDaily];

export function runDaily(s: GameState, now: number): GameState {
  if (!isNewDay(s, now)) return s;
  const today = localDate(now);
  let state = s;
  for (const h of dailyHandlers) state = h(state, today, now);
  return { ...state, lastDailyDate: today, lastVisitedSummary: { locations: [], foods: [] } };
}

export function recordVisit(s: GameState, kind: 'locations' | 'foods', name: string): GameState {
  const list = s.lastVisitedSummary[kind];
  if (list.includes(name)) return s;
  return { ...s, lastVisitedSummary: { ...s.lastVisitedSummary, [kind]: [...list, name] } };
}
