import type { GameState, Rarity } from './state';
import type { Outcome } from './events';
import { giftPool, getItem } from './catalog';

export const GIFT_COST = 50;
export const GIFT_RATES: Record<Rarity, number> = { common: 0.75, shiny: 0.22, rainbow: 0.03 };
export const MARSHMALLOW_FOR_DUPLICATE: Record<Rarity, number> = { common: 5, shiny: 15, rainbow: 40 };

export function rollRarity(r: number): Rarity {
  if (r < GIFT_RATES.common) return 'common';
  if (r < GIFT_RATES.common + GIFT_RATES.shiny) return 'shiny';
  return 'rainbow';
}

export function canOpen(s: GameState): boolean {
  return !s.daily.freeBoxUsed || s.freeBoxes > 0 || s.starSand >= GIFT_COST;
}

export function openGiftBox(
  s: GameState,
  rand: () => number,
): Outcome & { itemId: string; duplicate: boolean } {
  if (!canOpen(s)) return { state: s, events: [], itemId: '', duplicate: false };

  const next: GameState = { ...s, inventory: { ...s.inventory }, daily: { ...s.daily } };
  // Payment order: daily free box → freeBoxes → star sand.
  if (!s.daily.freeBoxUsed) {
    next.daily.freeBoxUsed = true;
  } else if (s.freeBoxes > 0) {
    next.freeBoxes = s.freeBoxes - 1;
  } else {
    next.starSand = s.starSand - GIFT_COST;
  }

  const rarity = rollRarity(rand());
  const pool = giftPool(rarity);
  const itemId = pool[Math.floor(rand() * pool.length)].id;
  const item = getItem(itemId);

  const duplicate = item.category !== 'ingredient' && (s.inventory[itemId] ?? 0) > 0;
  if (duplicate) {
    next.marshmallow = s.marshmallow + MARSHMALLOW_FOR_DUPLICATE[rarity];
  } else {
    next.inventory[itemId] = (next.inventory[itemId] ?? 0) + 1;
  }

  return { state: next, events: [], itemId, duplicate };
}
