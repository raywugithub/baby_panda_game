import type { ComponentChildren, JSX } from 'preact';
import { PAL } from './items/primitives';
import type { SHAPES } from '../core/puzzles';

// 影子配對謎題的六種形狀：silhouette 為深色剪影（影子），預設為上色的可愛版本。
// 全部畫在 100×100 座標系，並以 viewBox 等比縮放。

export type ShapeName = (typeof SHAPES)[number];

export interface ShapeArtProps {
  size: number;
  /** true 時畫成深色剪影（影子），不畫臉與細節。 */
  silhouette?: boolean;
}

const INK = '#2A2826';
const EDGE = { stroke: PAL.brown, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;
const SIL = { fill: INK, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

/** 五角星的十個頂點，外圈半徑 42、內圈半徑 18，中心 (50, 53)。 */
function starPoints(): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 42 : 18;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)} ${(53 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}
const STAR_POINTS = starPoints();

/** 小臉：兩顆眼睛與兩團腮紅，讓形狀看起來像娃娃風的小角色。 */
function Face({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <g>
      <circle cx={x - 9} cy={y} r={2.6} fill={PAL.brown} />
      <circle cx={x + 9} cy={y} r={2.6} fill={PAL.brown} />
      <ellipse cx={x - 14} cy={y + 7} rx={3.5} ry={2.2} fill={PAL.pinkDeep} opacity={0.6} />
      <ellipse cx={x + 14} cy={y + 7} rx={3.5} ry={2.2} fill={PAL.pinkDeep} opacity={0.6} />
    </g>
  );
}

function Frame({ size, children }: { size: number; children?: ComponentChildren }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" overflow="visible" role="img">
      {children}
    </svg>
  );
}

/** 葉子：竹葉般的尖葉，帶一條葉脈。 */
function Leaf({ silhouette, size }: ShapeArtProps): JSX.Element {
  const d = 'M16 84 C2 52 28 12 86 14 C90 52 70 86 16 84 Z';
  return (
    <Frame size={size}>
      <path d={d} {...(silhouette ? SIL : { fill: PAL.bamboo, ...EDGE })} />
      {!silhouette && (
        <>
          <path d="M18 82 Q48 56 80 20" fill="none" stroke={PAL.bambooDark} stroke-width={2.2} stroke-linecap="round" />
          <Face x={46} y={52} />
        </>
      )}
    </Frame>
  );
}

/** 月亮：淡紫色的月牙。 */
function Moon({ silhouette, size }: ShapeArtProps): JSX.Element {
  const d = 'M62 12 A40 40 0 1 0 90 74 A34 34 0 0 1 62 12 Z';
  return (
    <Frame size={size}>
      <path d={d} {...(silhouette ? SIL : { fill: '#B7AEE6', ...EDGE })} />
      {!silhouette && <Face x={44} y={52} />}
    </Frame>
  );
}

/** 星星：金色的五角星。 */
function Star({ silhouette, size }: ShapeArtProps): JSX.Element {
  return (
    <Frame size={size}>
      <polygon points={STAR_POINTS} {...(silhouette ? SIL : { fill: PAL.gold, ...EDGE })} />
      {!silhouette && <Face x={50} y={54} />}
    </Frame>
  );
}

/** 水滴：水藍色的雨滴，左上有一小塊高光。 */
function Drop({ silhouette, size }: ShapeArtProps): JSX.Element {
  const d = 'M50 8 C50 8 20 44 20 62 A30 30 0 0 0 80 62 C80 44 50 8 50 8 Z';
  return (
    <Frame size={size}>
      <path d={d} {...(silhouette ? SIL : { fill: PAL.water, ...EDGE })} />
      {!silhouette && (
        <>
          <ellipse cx={36} cy={58} rx={3.5} ry={6} fill={PAL.white} opacity={0.8} transform="rotate(20 36 58)" />
          <Face x={50} y={66} />
        </>
      )}
    </Frame>
  );
}

/** 雲朵：淡藍色的蓬鬆小雲。 */
function Cloud({ silhouette, size }: ShapeArtProps): JSX.Element {
  const d = 'M26 76 A18 18 0 0 1 28 40 A24 24 0 0 1 70 36 A18 18 0 0 1 82 76 Z';
  return (
    <Frame size={size}>
      <path d={d} {...(silhouette ? SIL : { fill: '#DCEBFB', ...EDGE })} />
      {!silhouette && <Face x={54} y={60} />}
    </Frame>
  );
}

/** 貝殼：粉色的扇形扇貝，帶三道放射狀的紋路。 */
function Shell({ silhouette, size }: ShapeArtProps): JSX.Element {
  const d = 'M50 90 L14 50 Q16 22 36 18 Q42 14 50 14 Q58 14 64 18 Q84 22 86 50 Z';
  return (
    <Frame size={size}>
      <path d={d} {...(silhouette ? SIL : { fill: PAL.pink, ...EDGE })} />
      {!silhouette && (
        <>
          <path d="M50 88 L30 24 M50 88 L50 15 M50 88 L70 24" fill="none" stroke={PAL.pinkDeep} stroke-width={2} stroke-linecap="round" />
          <Face x={50} y={60} />
        </>
      )}
    </Frame>
  );
}

/** 每種形狀的圖：同一個元件，silhouette 切換剪影與上色版本。 */
export const SHAPE_ART: Record<ShapeName, (props: ShapeArtProps) => JSX.Element> = {
  leaf: Leaf,
  moon: Moon,
  star: Star,
  drop: Drop,
  cloud: Cloud,
  shell: Shell,
};

/** 形狀的中文名稱，供無障礙標籤使用。 */
export const SHAPE_LABEL: Record<ShapeName, string> = {
  leaf: '葉子',
  moon: '月亮',
  star: '星星',
  drop: '水滴',
  cloud: '雲朵',
  shell: '貝殼',
};
