import type { GameState, FriendId } from './state';
import type { DailyHandler } from './daily';
import type { Outcome } from './events';
import { addLetter, letterForDay } from './letters';
import { hash, mulberry32, pick, chance } from './rng';
import { localDate } from './time';
import { FRIEND_IDS } from '../content/friends';
import { INGREDIENT_IDS } from '../content/ingredients';

const VISIT_CHANCE = 0.3;

/** 每日重置冒險相關計數；清除所有地點的當日進度。 */
const resetAdventureDaily: DailyHandler = (s) => {
  const friends = { ...s.friends };
  for (const id of Object.keys(friends) as FriendId[]) {
    friends[id] = { ...friends[id], chatsToday: 0 };
  }
  return {
    ...s,
    daily: { ...s.daily, revisitXpCount: 0 },
    friends,
    map: {
      ...s.map,
      nodes: s.map.nodes.map(n => (n.progress === null ? n : { ...n, progress: null })),
    },
  };
};

/** 每天一封朋友來信；同一日期只加一次（id 為 letter-<date>）。 */
const dailyLetter: DailyHandler = (s, today) => {
  if (s.letters.some(l => l.id === `letter-${today}`)) return s;
  return addLetter(s, letterForDay(s.seed, today));
};

/** 每天 30% 機率有朋友來訪；未完成的來訪保留到玩家送客為止。 */
const dailyVisit: DailyHandler = (s, today) => {
  if (s.daily.visitor !== null && !s.daily.visitorDone) return s;
  const rand = mulberry32(hash(s.seed, today, 'visit'));
  if (chance(rand, VISIT_CHANCE)) {
    return { ...s, daily: { ...s.daily, visitor: pick(rand, FRIEND_IDS), visitorDone: false } };
  }
  // 今天沒有來訪：visitorDone 維持原值（沒有來訪時不改動）。
  return { ...s, daily: { ...s.daily, visitor: null } };
};

export const adventureHandlers: DailyHandler[] = [resetAdventureDaily, dailyLetter, dailyVisit];

/** 送客：結束今天的來訪並送出一份食材禮物。沒有進行中的來訪時回傳 null。 */
export function leaveVisit(s: GameState, now: number): Outcome | null {
  if (s.daily.visitor === null || s.daily.visitorDone) return null;
  const giftRand = mulberry32(hash(s.seed, localDate(now), 'gift'));
  const gift = pick(giftRand, INGREDIENT_IDS);
  const inventory = { ...s.inventory, [gift]: (s.inventory[gift] ?? 0) + 1 };
  return {
    state: { ...s, inventory, daily: { ...s.daily, visitorDone: true } },
    events: [],
  };
}
