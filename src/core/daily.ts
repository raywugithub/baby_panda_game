import type { GameState } from './state';
import { isNewDay, localDate } from './time';
import { diaryHandler } from './diary';
import { adventureHandlers } from './adventureDaily';

export type DailyHandler = (s: GameState, today: string, now: number) => GameState;

const resetDaily: DailyHandler = (s) => {
  const friends = { ...s.friends };
  for (const id of Object.keys(friends) as (keyof typeof friends)[]) {
    friends[id] = { ...friends[id], chatsToday: 0 };
  }
  // 未完成的來訪不限時，跨日保留到玩家送客為止。
  const keepVisit = s.daily.visitor !== null && !s.daily.visitorDone;
  return {
    ...s,
    daily: {
      revisitXpCount: 0,
      freeBoxUsed: false,
      visitor: keepVisit ? s.daily.visitor : null,
      visitorDone: false,
    },
    friends,
  };
};

export const dailyHandlers: DailyHandler[] = [resetDaily, diaryHandler, ...adventureHandlers];

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
