import type { JSX } from 'preact';
import { PAL, OUTLINE } from './items/primitives';

// 小遊戲的目標物：接星星的星星、跳石頭的石頭、泡泡配對的泡泡，以及跳石頭的小熊貓。
// 全部畫在 100×100 座標系（與物品圖相同的描邊風格），實際大小由 size 決定。

const STAR = '50,6 61,36 93,37 67,56 76,88 50,70 24,88 33,56 7,37 39,36';

function Frame({ size, children, label }: { size: number; children?: JSX.Element | JSX.Element[]; label: string }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" overflow="visible" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** 墜落的小星星：金色五角星，臉頰帶腮紅，頂端一顆白色星芒。 */
export function FallingStar({ size }: { size: number }): JSX.Element {
  return (
    <Frame size={size} label="星星">
      <polygon points={STAR} fill={PAL.gold} {...OUTLINE} />
      <circle cx={40} cy={54} r={3} fill={PAL.brown} />
      <circle cx={60} cy={54} r={3} fill={PAL.brown} />
      <ellipse cx={33} cy={62} rx={4} ry={2.4} fill={PAL.pinkDeep} opacity={0.7} />
      <ellipse cx={67} cy={62} rx={4} ry={2.4} fill={PAL.pinkDeep} opacity={0.7} />
      <path d="M50 62 Q53 65 56 62" fill="none" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />
      <path d="M22 22 L24 17 L26 22 L31 24 L26 26 L24 31 L22 26 L17 24Z" fill={PAL.white} stroke={PAL.gold} stroke-width={1.2} />
    </Frame>
  );
}

/** 石頭：灰褐色的圓潤踏腳石，上方長了一小片苔蘚。 */
export function SteppingStone({ size }: { size: number }): JSX.Element {
  return (
    <Frame size={size} label="踏腳石">
      <ellipse cx={50} cy={60} rx={42} ry={26} fill="#B9AE9C" {...OUTLINE} />
      <path d="M18 56 Q50 34 84 54" fill="none" stroke={PAL.creamLight} stroke-width={3} stroke-linecap="round" opacity={0.7} />
      <path d="M28 66 Q44 52 62 66" fill="none" stroke="#8C8273" stroke-width={2} stroke-linecap="round" />
      <ellipse cx={30} cy={36} rx={14} ry={7} fill={PAL.bamboo} {...OUTLINE} />
      <circle cx={24} cy={34} r={2.2} fill={PAL.goldLight} />
      <circle cx={36} cy={38} r={1.8} fill={PAL.goldLight} />
    </Frame>
  );
}

/** 泡泡配對用的四種顏色（同色才能配成一對）。 */
export const BUBBLE_TINTS = {
  pink: '#F4B6C2',
  blue: '#9FD3E6',
  yellow: '#F6DA8A',
  green: '#B9DDA0',
} as const;
export type BubbleTint = keyof typeof BUBBLE_TINTS;

/** 泡泡：半透明的彩色圓泡，左上有高光，底部帶一點彩虹色的反光。 */
export function Bubble({ size, tint = 'blue' }: { size: number; tint?: BubbleTint }): JSX.Element {
  return (
    <Frame size={size} label="泡泡">
      <circle cx={50} cy={50} r={42} fill={BUBBLE_TINTS[tint]} opacity={0.9} {...OUTLINE} stroke="#3D8FD1" />
      <path d="M22 58 Q30 80 56 84" fill="none" stroke={PAL.pink} stroke-width={4} stroke-linecap="round" opacity={0.8} />
      <path d="M70 66 Q76 58 80 60" fill="none" stroke={PAL.goldLight} stroke-width={3} stroke-linecap="round" opacity={0.9} />
      <ellipse cx={34} cy={32} rx={9} ry={6} fill={PAL.white} opacity={0.9} transform="rotate(-30 34 32)" />
      <circle cx={62} cy={24} r={3} fill={PAL.white} opacity={0.9} />
    </Frame>
  );
}

/** 跳石頭的小熊貓：圓耳朵、黑眼圈、腮紅，站在石頭上。 */
export function HopperPanda({ size }: { size: number }): JSX.Element {
  return (
    <Frame size={size} label="小熊貓">
      <circle cx={24} cy={26} r={12} fill={PAL.white} {...OUTLINE} />
      <circle cx={76} cy={26} r={12} fill={PAL.white} {...OUTLINE} />
      <circle cx={24} cy={26} r={5} fill={PAL.navy} />
      <circle cx={76} cy={26} r={5} fill={PAL.navy} />
      <ellipse cx={50} cy={54} rx={38} ry={34} fill={PAL.white} {...OUTLINE} />
      <ellipse cx={34} cy={48} rx={11} ry={9} fill={PAL.navy} transform="rotate(-20 34 48)" />
      <ellipse cx={66} cy={48} rx={11} ry={9} fill={PAL.navy} transform="rotate(20 66 48)" />
      <circle cx={36} cy={49} r={3.2} fill={PAL.white} />
      <circle cx={64} cy={49} r={3.2} fill={PAL.white} />
      <circle cx={36} cy={49} r={1.6} fill={PAL.navy} />
      <circle cx={64} cy={49} r={1.6} fill={PAL.navy} />
      <ellipse cx={50} cy={64} rx={5} ry={3.4} fill={PAL.navy} />
      <ellipse cx={27} cy={62} rx={5} ry={3} fill={PAL.pinkDeep} opacity={0.6} />
      <ellipse cx={73} cy={62} rx={5} ry={3} fill={PAL.pinkDeep} opacity={0.6} />
    </Frame>
  );
}
