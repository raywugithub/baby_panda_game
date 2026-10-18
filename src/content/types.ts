import type { Terrain, Rarity, OutfitSlot } from '../core/state';

export type ItemCategory = 'furniture' | 'wall' | 'floor' | 'outfit' | 'pendant' | 'food' | 'ingredient' | 'sticker' | 'frame';
export type Interaction = 'sit' | 'sleep' | 'swing' | 'read';
export type PendantEffect =
  | { kind: 'terrainStarSand'; terrain: Terrain; pct: number }
  | { kind: 'terrainExtraTreasure'; terrain: Terrain }
  | { kind: 'minigameStarSand'; pct: number }
  | { kind: 'diaryDream' }
  | { kind: 'ingredientChance'; pct: number }
  | { kind: 'affinityBonus'; amount: number };
export interface ItemDef {
  id: string; name: string; category: ItemCategory; rarity: Rarity;
  inGiftPool: boolean;
  size?: { w: number; h: number };      // furniture
  wallMounted?: boolean;                 // furniture 掛牆
  interaction?: Interaction;
  slot?: OutfitSlot;                     // outfit
  pendant?: PendantEffect;               // pendant
  sound?: string;                        // pendant 叮噹音色 id
  hint: string;                          // 圖鑑剪影提示
}
export interface FoodDef { id: string; name: string; reaction: 'patBelly' | 'blush' | 'sour' | 'starEyes' | 'mystery' | 'yum' }
export interface RecipeDef { id: string; name: string; inputs: [string, string]; reaction: FoodDef['reaction'] }

export const CATEGORY_PREFIX: Record<ItemCategory, string> = {
  furniture: 'furn-',
  wall: 'wall-',
  floor: 'floor-',
  outfit: 'outfit-',
  pendant: 'pendant-',
  food: 'food-',
  ingredient: 'ing-',
  sticker: 'sticker-',
  frame: 'frame-',
};
