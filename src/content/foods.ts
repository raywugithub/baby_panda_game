import type { FoodDef } from './types';

export const FOOD_MYSTERY_ID = 'food-mystery';

export const FOODS: FoodDef[] = [
  { id: 'food-bamboo-cake', name: '竹筍糕', reaction: 'patBelly' },
  { id: 'food-strawberry-mochi', name: '草莓麻糬', reaction: 'blush' },
  { id: 'food-sour-plum', name: '酸梅', reaction: 'sour' },
  { id: 'food-starry-apple', name: '星空蘋果', reaction: 'starEyes' },
  { id: FOOD_MYSTERY_ID, name: '謎之料理', reaction: 'mystery' },
];

/** 4 種基本食物，不含謎之料理 */
export const FOOD_IDS: string[] = [
  'food-bamboo-cake',
  'food-strawberry-mochi',
  'food-sour-plum',
  'food-starry-apple',
];
