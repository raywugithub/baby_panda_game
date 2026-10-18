import type { ItemDef } from '../types';
import { INGREDIENTS } from '../ingredients';
import { STARTER_ITEMS } from './starter';
import { FURNITURE_ITEMS } from './furniture';
import { FRIEND_ITEMS } from './friends';
import { DECOR_ITEMS } from './decor';
import { OUTFIT_ITEMS } from './outfits';
import { PENDANT_ITEMS } from './pendants';
import { STICKER_ITEMS, FRAME_ITEMS } from './collectibles';

export const ITEMS: ItemDef[] = [
  ...STARTER_ITEMS,
  ...INGREDIENTS,
  ...FURNITURE_ITEMS,
  ...FRIEND_ITEMS,
  ...DECOR_ITEMS,
  ...OUTFIT_ITEMS,
  ...PENDANT_ITEMS,
  ...STICKER_ITEMS,
  ...FRAME_ITEMS,
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map(i => [i.id, i]));
