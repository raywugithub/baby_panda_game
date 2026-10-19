import type { FriendId, GameState } from './state';
import type { GameEvent, Outcome } from './events';
import { levelOf } from './friendLevel';
import { pendantModifiers } from './pendants';
import { FRIENDS } from '../content/friends';
import { FOOD_IDS } from '../content/foods';
import { INGREDIENT_IDS } from '../content/ingredients';

export { levelOf } from './friendLevel';

/** 朋友專屬家具發放的等級 → 家具編號（契約 §10.3）。 */
const FURNITURE_BY_LEVEL: Record<number, number> = { 3: 1, 6: 2, 10: 3 };

/** 增加好感度；愛心墜飾每次 +1；每跨越一個等級發一次事件，3／6／10 級發放專屬家具。 */
export function addAffinity(s: GameState, id: FriendId, amount: number): Outcome {
  if (!(amount > 0)) return { state: s, events: [] };
  const gain = amount + pendantModifiers(s).affinityBonus;
  const oldPoints = s.friends[id].points;
  const newPoints = oldPoints + gain;
  const oldLevel = levelOf(oldPoints);
  const newLevel = levelOf(newPoints);

  const inventory = { ...s.inventory };
  const events: GameEvent[] = [];
  for (let n = oldLevel + 1; n <= newLevel; n++) {
    events.push({ type: 'friendLevelUp', friendId: id, level: n });
    const k = FURNITURE_BY_LEVEL[n];
    if (k !== undefined) {
      const key = `furn-${id}-${k}`;
      inventory[key] = (inventory[key] ?? 0) + 1;
    }
  }

  const state: GameState = {
    ...s,
    inventory,
    friends: { ...s.friends, [id]: { ...s.friends[id], points: newPoints } },
  };
  return { state, events };
}

/** 每位朋友每天最多 3 次聊天，每次 +1 好感度。 */
export function chat(s: GameState, id: FriendId): Outcome {
  const friend = s.friends[id];
  if (friend.chatsToday >= 3) return { state: s, events: [] };
  const withChat: GameState = {
    ...s,
    friends: { ...s.friends, [id]: { ...friend, chatsToday: friend.chatsToday + 1 } },
  };
  return addAffinity(withChat, id, 1);
}

/** 送食物或食材；喜歡的禮物 +10，其他 +5；消耗一個。不符合條件或沒有庫存則回傳 null。 */
export function giveGift(s: GameState, id: FriendId, itemId: string): Outcome | null {
  const edible = FOOD_IDS.includes(itemId) || INGREDIENT_IDS.includes(itemId);
  const owned = s.inventory[itemId] ?? 0;
  if (!edible || owned < 1) return null;

  const inventory = { ...s.inventory };
  if (owned === 1) delete inventory[itemId];
  else inventory[itemId] = owned - 1;

  const liked = FRIENDS.find((f) => f.id === id)?.likes.includes(itemId) ?? false;
  return addAffinity({ ...s, inventory }, id, liked ? 10 : 5);
}

/** 等級 n 解鎖故事段落 1..n，最多 5 段。 */
export function storySegmentsUnlocked(level: number): number {
  return Math.min(level, 5);
}
