import type { ItemDef } from '../types';

const STICKER_NAMES = [
  '星星', '愛心', '竹葉', '雲朵', '月亮', '蘑菇', '雪花', '小花', '皇冠', '蝴蝶結', '泡泡', '彩虹',
  '小魚', '貝殼', '愛心眼', '驚嘆號', '音符', '太陽', '閃電', '腳印', '竹筍', '草莓', '棉花糖', '禮盒',
];

const FRAME_NAMES = ['竹框', '雲框', '星空框', '彩虹框', '蘑菇框', '金邊框'];

/** 貼紙 sticker-01…sticker-24：日記貼紙與拍照貼紙共用，不在禮盒池。 */
export const STICKER_ITEMS: ItemDef[] = STICKER_NAMES.map((name, i) => ({
  id: `sticker-${String(i + 1).padStart(2, '0')}`,
  name,
  category: 'sticker',
  rarity: 'common',
  inGiftPool: false,
  hint: '可以貼在日記或照片上的小東西',
}));

/** 相框 frame-01…frame-06：拍照時套用，不在禮盒池。 */
export const FRAME_ITEMS: ItemDef[] = FRAME_NAMES.map((name, i) => ({
  id: `frame-${String(i + 1).padStart(2, '0')}`,
  name,
  category: 'frame',
  rarity: 'common',
  inGiftPool: false,
  hint: '拍照的時候可以套上的花框',
}));
