import { describe, it, expect } from 'vitest';
import { FOODS, FOOD_IDS, FOOD_MYSTERY_ID } from './foods';
import { INGREDIENTS, INGREDIENT_IDS } from './ingredients';
import { RECIPES } from './recipes';
import { STAGE_NAMES, TITLE_ADJECTIVES, TITLE_NOUNS } from './titles';
import { ITEMS, ITEM_BY_ID } from './items';
import { CATEGORY_PREFIX } from './types';

describe('內容資料完整性', () => {
  it('數量', () => {
    expect(FOODS).toHaveLength(5);
    expect(INGREDIENTS).toHaveLength(6);
    expect(RECIPES).toHaveLength(12);
    expect(STAGE_NAMES).toHaveLength(8);
    expect(TITLE_ADJECTIVES).toHaveLength(30);
    expect(TITLE_NOUNS).toHaveLength(30);
  });
  it('食物包含謎之料理且 id 正確', () => {
    expect(FOODS.map(f => f.id)).toContain(FOOD_MYSTERY_ID);
    expect(FOOD_MYSTERY_ID).toBe('food-mystery');
  });
  it('食譜食材存在、兩格不同、配對不重複', () => {
    const ingIds = new Set(INGREDIENTS.map(i => i.id));
    const keys = new Set<string>();
    for (const r of RECIPES) {
      expect(ingIds.has(r.inputs[0])).toBe(true);
      expect(ingIds.has(r.inputs[1])).toBe(true);
      expect(r.inputs[0]).not.toBe(r.inputs[1]);
      expect(r.id.startsWith('recipe-')).toBe(true);
      keys.add([...r.inputs].sort().join('+'));
    }
    expect(keys.size).toBe(12);
  });
  it('物品 id 唯一且前綴符合類別', () => {
    const ids = ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const it of ITEMS) expect(it.id.startsWith(CATEGORY_PREFIX[it.category])).toBe(true);
    for (const id of ['wall-default', 'floor-default', 'furn-nest', 'furn-low-table', 'furn-cushion', 'pendant-bamboo']) {
      expect(ITEM_BY_ID[id]).toBeDefined();
    }
  });
  it('FOOD_IDS 為 4 種基本食物且不含謎之料理，星空蘋果 id 正確', () => {
    expect(FOOD_IDS).toEqual(['food-bamboo-cake', 'food-strawberry-mochi', 'food-sour-plum', 'food-starry-apple']);
    expect(FOOD_IDS).not.toContain(FOOD_MYSTERY_ID);
  });
  it('INGREDIENT_IDS 為 6 種，稀有度 4 common、2 shiny', () => {
    expect(INGREDIENT_IDS).toHaveLength(6);
    expect(INGREDIENTS.filter(i => i.rarity === 'common')).toHaveLength(4);
    expect(INGREDIENTS.filter(i => i.rarity === 'shiny').map(i => i.id).sort()).toEqual(['ing-honey', 'ing-mushroom']);
  });
  it('初始物品的禮盒池旗標：家具為 true，牆紙、地板、墜飾為 false，且 A 沒有貼紙', () => {
    const pool = (id: string) => ITEM_BY_ID[id].inGiftPool;
    expect(['furn-nest', 'furn-low-table', 'furn-cushion'].map(pool)).toEqual([true, true, true]);
    expect(['wall-default', 'floor-default', 'pendant-bamboo'].map(pool)).toEqual([false, false, false]);
    expect(ITEMS.filter(i => i.category === 'sticker')).toHaveLength(0);
  });
  it('詞庫不重複', () => {
    expect(new Set(TITLE_ADJECTIVES).size).toBe(30);
    expect(new Set(TITLE_NOUNS).size).toBe(30);
  });
});
