import type { ComponentChildren, JSX } from 'preact';

/** 物品圖色票：主色取自計畫 C 共用規則，其餘為同色系的明暗變化。 */
export const PAL = {
  cream: '#E8DCCB',
  creamLight: '#F6EEDF',
  brown: '#6B4F3A',
  brownLight: '#9A7A5C',
  bamboo: '#7FA66B',
  bambooDark: '#5E8C52',
  pink: '#F4B6C2',
  pinkDeep: '#E8879A',
  gold: '#E5B94E',
  goldLight: '#F6DA8A',
  navy: '#2E3A59',
  navyLight: '#4A5A80',
  terracotta: '#C98A63',
  strawberry: '#E0566B',
  water: '#9FD3E6',
  white: '#FFFFFF',
} as const;

/** 統一描邊：圓角線條、棕色細邊，讓所有物品看起來像同一套娃娃風小物。 */
export const OUTLINE = {
  stroke: PAL.brown,
  'stroke-width': 2.5,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
} as const;

/** 彩虹漸層（每個物品 id 唯一，避免 SVG id 衝突）。 */
export function Rainbow({ id }: { id: string }): JSX.Element {
  return (
    <linearGradient id={`rb-${id}`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F4B6C2" />
      <stop offset="0.35" stop-color="#E5B94E" />
      <stop offset="0.65" stop-color="#7FA66B" />
      <stop offset="1" stop-color="#8FC4E8" />
    </linearGradient>
  );
}

/** 閃亮物品的單一星芒。 */
export function Sparkle({ x = 86, y = 14, r = 4 }: { x?: number; y?: number; r?: number }): JSX.Element {
  return <circle cx={x} cy={y} r={r} fill={PAL.white} stroke={PAL.gold} stroke-width={1.5} />;
}

/**
 * 物品圖外框：100×100 座標系，以中心對齊 (0,0)，實際大小由 size 決定。
 * 放在房間（viewBox -50 -50 100 100）與熊貓錨點（translate）時都能正確置中。
 */
export function ItemSvg({ size, children }: { size: number; children?: ComponentChildren }): JSX.Element {
  return (
    <svg x={-size / 2} y={-size / 2} width={size} height={size} viewBox="0 0 100 100" overflow="visible">
      {children}
    </svg>
  );
}
