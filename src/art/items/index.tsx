import type { ComponentType } from 'preact';
import { BambooPendant, NestArt, LowTableArt, CushionArt } from './starter-art';

/** 物品圖登記表；C 計畫會擴充。沒有登記的 id 不會被渲染。 */
export const ITEM_ART: Record<string, ComponentType<{ size: number }>> = {
  'pendant-bamboo': BambooPendant,
  'furn-nest': NestArt,
  'furn-low-table': LowTableArt,
  'furn-cushion': CushionArt,
};
