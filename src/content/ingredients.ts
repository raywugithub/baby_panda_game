import type { ItemDef } from './types';
import type { Rarity } from '../core/state';

const HINT = '禮盒或冒險可能找到';
const ing = (id: string, name: string, rarity: Rarity): ItemDef =>
  ({ id, name, category: 'ingredient', rarity, inGiftPool: true, hint: HINT });

export const INGREDIENTS: ItemDef[] = [
  ing('ing-bamboo-shoot', '竹筍', 'common'),
  ing('ing-strawberry', '草莓', 'common'),
  ing('ing-rice-flour', '米粉', 'common'),
  ing('ing-red-bean', '紅豆', 'common'),
  ing('ing-honey', '蜂蜜', 'shiny'),
  ing('ing-mushroom', '蘑菇', 'shiny'),
];

export const INGREDIENT_IDS: string[] = INGREDIENTS.map(i => i.id);
