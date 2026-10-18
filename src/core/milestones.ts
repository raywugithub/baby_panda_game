import type { GameState } from './state';
import type { GameEvent, Outcome } from './events';
import { ITEMS } from '../content/items';

const CATEGORIES = ['furniture', 'outfit', 'pendant'] as const;
const EARLY_THRESHOLDS = [10, 30, 50];
const EARLY_TITLES = ['收藏新星', '收藏達人', '收藏大師'];

/** 第 k 個里程碑所需的收藏數：10、30、50，之後每多一個加 25。 */
export function milestoneThreshold(k: number): number {
  if (k <= EARLY_THRESHOLDS.length) return EARLY_THRESHOLDS[k - 1];
  return 50 + 25 * (k - 3);
}

export function milestoneTitle(k: number): string {
  if (k <= EARLY_TITLES.length) return EARLY_TITLES[k - 1];
  return `收藏傳說 ${k - 3}`;
}

/**
 * 依收藏數發放里程碑禮盒。朋友家具不在此發放（由 addAffinity 依好感度等級發放）。
 * 冪等：相同狀態再次呼叫不會產生事件。
 */
export function checkMilestones(s: GameState): Outcome {
  const events: GameEvent[] = [];
  const claimed: Record<string, number> = { ...s.milestonesClaimed };
  let freeBoxes = s.freeBoxes;

  for (const cat of CATEGORIES) {
    const owned = ITEMS.filter((i) => i.category === cat && (s.inventory[i.id] ?? 0) > 0).length;
    let k = claimed[cat] ?? 0;
    while (owned >= milestoneThreshold(k + 1)) {
      k += 1;
      claimed[cat] = k;
      freeBoxes += 1;
      events.push({ type: 'milestone', category: cat, count: milestoneThreshold(k) });
    }
  }

  return { state: { ...s, milestonesClaimed: claimed, freeBoxes }, events };
}
