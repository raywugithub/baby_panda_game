import type { ItemDef } from '../types';
import { FRIEND_FURNITURE } from '../friendFurniture';

/** 朋友專屬家具（不在禮盒池，只由好感度等級發放）。 */
export const FRIEND_ITEMS: ItemDef[] = FRIEND_FURNITURE.map(r => ({
  id: r.itemId,
  name: r.name,
  category: 'furniture',
  rarity: 'shiny',
  inGiftPool: false,
  size: r.size,
  ...(r.wallMounted ? { wallMounted: true } : {}),
  hint: r.hint,
}));
