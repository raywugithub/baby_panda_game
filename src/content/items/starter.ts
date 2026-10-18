import type { ItemDef } from '../types';

export const STARTER_ITEMS: ItemDef[] = [
  { id: 'wall-default', name: '竹青色牆紙', category: 'wall', rarity: 'common', inGiftPool: false, hint: '家裡本來就有的牆紙' },
  { id: 'floor-default', name: '木紋地板', category: 'floor', rarity: 'common', inGiftPool: false, hint: '家裡本來就有的地板' },
  { id: 'furn-nest', name: '小窩', category: 'furniture', rarity: 'common', inGiftPool: true, size: { w: 2, h: 2 }, interaction: 'sleep', hint: '軟軟的，適合團成一球' },
  { id: 'furn-low-table', name: '矮桌', category: 'furniture', rarity: 'common', inGiftPool: true, size: { w: 2, h: 1 }, hint: '剛好放得下一盤竹筍糕' },
  { id: 'furn-cushion', name: '竹編坐墊', category: 'furniture', rarity: 'common', inGiftPool: true, size: { w: 1, h: 1 }, interaction: 'sit', hint: '坐下去會嘎吱一聲' },
  { id: 'pendant-bamboo', name: '竹葉墜飾', category: 'pendant', rarity: 'common', inGiftPool: false,
    pendant: { kind: 'terrainStarSand', terrain: 'bamboo', pct: 20 }, sound: 'bell-soft', hint: '帶著竹林的味道' },
];
