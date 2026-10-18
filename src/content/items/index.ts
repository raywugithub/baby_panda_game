import type { ItemDef } from '../types';
import { INGREDIENTS } from '../ingredients';
import { STARTER_ITEMS } from './starter';

export const ITEMS: ItemDef[] = [...STARTER_ITEMS, ...INGREDIENTS];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map(i => [i.id, i]));
