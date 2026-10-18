import { ITEMS, ITEM_BY_ID } from '../content/items';
import type { ItemDef } from '../content/types';
import type { Rarity } from './state';

export { ITEM_BY_ID } from '../content/items';

export function getItem(id: string): ItemDef {
  const item = ITEM_BY_ID[id];
  if (!item) throw new Error('unknown item: ' + id);
  return item;
}

export function giftPool(rarity: Rarity): ItemDef[] {
  return ITEMS.filter((i) => i.inGiftPool && i.rarity === rarity);
}
