import type { GameState, Rarity } from './state';
import type { Outcome } from './events';
import { getItem } from './catalog';

const PRICE: Record<Rarity, number> = { common: 20, shiny: 60, rainbow: 200 };
const ONE_PER_PLAYER: ReadonlySet<string> = new Set(['outfit', 'pendant', 'wall', 'floor']);

export function priceOf(rarity: Rarity): number {
  return PRICE[rarity];
}

export function buy(s: GameState, itemId: string): Outcome | null {
  const item = getItem(itemId);
  if (!item.inGiftPool) return null;
  const price = priceOf(item.rarity);
  if (s.marshmallow < price) return null;
  if (ONE_PER_PLAYER.has(item.category) && (s.inventory[itemId] ?? 0) > 0) return null;
  return {
    state: {
      ...s,
      inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + 1 },
      marshmallow: s.marshmallow - price,
    },
    events: [],
  };
}
