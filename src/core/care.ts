import type { CareKind, GameState, NeedKey } from './state';
import type { GameEvent, Outcome } from './events';
import { applyReward } from './rewards';
import { recordVisit } from './daily';
import { diaryDreamOn } from './dream';
import { FOODS, FOOD_MYSTERY_ID } from '../content/foods';
import { RECIPES } from '../content/recipes';

const H = 3600_000;
const FEED_WINDOW = 3 * 60_000;
const HUG_HOURLY_CAP = 5;
const NEED_FOR: Record<CareKind, NeedKey> = { feed: 'tummy', bath: 'clean', play: 'mood', hug: 'mood' };

/** 有效照顧：對應指標 < 100；抱抱另需最近一小時未達 5 次。 */
export function isEffective(s: GameState, kind: CareKind, now: number): boolean {
  if (kind === 'hug' && s.hugLog.filter(t => now - t < H).length >= HUG_HOURLY_CAP) return false;
  return s.needs[NEED_FOR[kind]] < 100;
}

export function care(s: GameState, kind: CareKind, now: number): Outcome {
  if (!isEffective(s, kind, now)) return { state: s, events: [] };
  const key = NEED_FOR[kind];
  const needs = { ...s.needs, [key]: Math.min(100, s.needs[key] + 25) };
  const hugLog = kind === 'hug'
    ? [...s.hugLog.filter(t => now - t < H), now]
    : s.hugLog;
  const updated: GameState = { ...s, needs, hugLog };
  return applyReward(updated, { xp: 5, starSand: 2, energy: 15, chain: 1 });
}

function foodNameOf(id: string): string {
  if (id === FOOD_MYSTERY_ID) return '謎之料理';
  return FOODS.find(f => f.id === id)?.name
    ?? RECIPES.find(r => r.id === id)?.name
    ?? id;
}

/** 餵食：消耗一份食物（即使指標已滿）；數量為 0 時原狀態不變。 */
export function feed(s: GameState, foodId: string, now: number): Outcome {
  const have = s.inventory[foodId] ?? 0;
  if (have < 1) return { state: s, events: [] };
  const inventory = { ...s.inventory };
  if (have > 1) inventory[foodId] = have - 1;
  else delete inventory[foodId];
  const feedLog = [...s.feedLog.filter(t => now - t < FEED_WINDOW), now];
  const out = care({ ...s, inventory, feedLog }, 'feed', now);
  return { state: recordVisit(out.state, 'foods', foodNameOf(foodId)), events: out.events };
}

/** 料理：食材不足時拋出錯誤（UI 必須先檢查）；結果放入背包，首次做出食譜給獎勵。 */
export function cook(s: GameState, a: string, b: string, now: number): Outcome & { result: string } {
  const need: Record<string, number> = {};
  need[a] = (need[a] ?? 0) + 1;
  need[b] = (need[b] ?? 0) + 1;
  for (const [id, n] of Object.entries(need)) {
    if ((s.inventory[id] ?? 0) < n) throw new Error('missing ingredient');
  }

  const inventory = { ...s.inventory };
  for (const [id, n] of Object.entries(need)) {
    const left = (inventory[id] ?? 0) - n;
    if (left > 0) inventory[id] = left;
    else delete inventory[id];
  }

  const recipe = RECIPES.find(r =>
    (r.inputs[0] === a && r.inputs[1] === b) || (r.inputs[0] === b && r.inputs[1] === a));
  const result = recipe ? recipe.id : 'mystery';
  const itemId = recipe ? recipe.id : FOOD_MYSTERY_ID;
  inventory[itemId] = (inventory[itemId] ?? 0) + 1;

  let state: GameState = { ...s, inventory };
  const events: GameEvent[] = [];
  if (recipe && !s.recipes.includes(recipe.id)) {
    state = { ...state, recipes: [...s.recipes, recipe.id] };
    events.push({ type: 'recipeDiscovered', recipeId: recipe.id });
    const reward = applyReward(state, { xp: 10, starSand: 5 });
    state = reward.state;
    events.push(...reward.events);
  }
  state = recordVisit(state, 'foods', foodNameOf(itemId));
  return { state, events, result };
}

/** 打嗝（規格 5.2）：3 分鐘內吃超過 3 個；裝備月亮鈴鐺時門檻為 2。 */
export function shouldHiccup(s: GameState, now: number): boolean {
  const recent = s.feedLog.filter(t => now - t < FEED_WINDOW).length;
  return recent > (diaryDreamOn(s) ? 2 : 3);
}
