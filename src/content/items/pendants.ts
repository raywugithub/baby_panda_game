import type { ItemDef } from '../types';

export const PENDANT_ITEMS: ItemDef[] = [
  { id: 'pendant-shell', name: '貝殼墜飾', category: 'pendant', rarity: 'common', inGiftPool: true,
    pendant: { kind: 'terrainExtraTreasure', terrain: 'beach' }, sound: 'chime-shell', hint: '把耳朵貼上去，好像能聽見海浪聲…' },
  { id: 'pendant-mushroom', name: '蘑菇墜飾', category: 'pendant', rarity: 'common', inGiftPool: true,
    pendant: { kind: 'ingredientChance', pct: 30 }, sound: 'chime-mushroom', hint: '森林深處長出來的小傘，找東西特別在行…' },
  { id: 'pendant-snowflake', name: '雪花墜飾', category: 'pendant', rarity: 'shiny', inGiftPool: true,
    pendant: { kind: 'terrainStarSand', terrain: 'snow', pct: 20 }, sound: 'chime-snow', hint: '每一片都不一樣，是冬天寄來的信…' },
  { id: 'pendant-cloud', name: '雲朵墜飾', category: 'pendant', rarity: 'shiny', inGiftPool: true,
    pendant: { kind: 'terrainExtraTreasure', terrain: 'cloud' }, sound: 'chime-cloud', hint: '輕飄飄的，好像隨時會飛走…' },
  { id: 'pendant-star', name: '星星墜飾', category: 'pendant', rarity: 'shiny', inGiftPool: true,
    pendant: { kind: 'minigameStarSand', pct: 20 }, sound: 'chime-star', hint: '晚上抬頭找找看，它住在最亮的那一顆…' },
  { id: 'pendant-moon-bell', name: '月亮鈴鐺', category: 'pendant', rarity: 'rainbow', inGiftPool: true,
    pendant: { kind: 'diaryDream' }, sound: 'chime-moon', hint: '搖一搖，夢裡的故事就會慢慢浮現…' },
  { id: 'pendant-heart', name: '愛心墜飾', category: 'pendant', rarity: 'rainbow', inGiftPool: true,
    pendant: { kind: 'affinityBonus', amount: 1 }, sound: 'chime-heart', hint: '戴著它，朋友們都會覺得你更親近…' },
];
