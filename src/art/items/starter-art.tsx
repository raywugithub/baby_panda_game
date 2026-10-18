import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE } from './primitives';

// 新手物品用的編織色：竹編坐墊與小窩的藤色（與 PAL 同色系，不依賴 CSS 變數）。
const RATTAN = '#D2A56B';
const RATTAN_DARK = '#B07E4A';

/** 竹葉墜飾（1×1，掛胸前）：金色小圈吊著兩片綠竹葉。 */
export function BambooPendant({ size }: { size: number }): JSX.Element {
  const leaf = 'M0 0 Q14 -9 30 0 Q14 9 0 0Z';
  const midrib = 'M3 0 L24 0';
  return (
    <ItemSvg size={size}>
      <line x1={50} y1={0} x2={50} y2={12} {...OUTLINE} stroke-width={2} />
      <circle cx={50} cy={18} r={6} fill="none" stroke={PAL.gold} stroke-width={3.5} />
      <line x1={50} y1={24} x2={50} y2={34} {...OUTLINE} stroke-width={2} />
      <g transform="translate(50 34) rotate(150) scale(1.15)">
        <path d={leaf} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
        <path d={midrib} fill="none" stroke={PAL.creamLight} stroke-width={1.2} />
      </g>
      <g transform="translate(50 34) rotate(30) scale(1.15)">
        <path d={leaf} fill={PAL.bambooDark} {...OUTLINE} stroke-width={1.8} />
        <path d={midrib} fill="none" stroke={PAL.creamLight} stroke-width={1.2} />
      </g>
    </ItemSvg>
  );
}

/** 小窩（2×2，房間用）：圓形竹編籃，內襯奶油色軟墊，旁邊一片竹葉。 */
export function NestArt({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <ellipse cx={50} cy={70} rx={42} ry={22} fill={RATTAN_DARK} {...OUTLINE} />
      <path d="M10 66 Q50 84 90 66" fill="none" stroke={PAL.brown} stroke-width={1.6} stroke-linecap="round" />
      <path d="M12 76 Q50 94 88 76" fill="none" stroke={PAL.brown} stroke-width={1.6} stroke-linecap="round" />
      <ellipse cx={50} cy={56} rx={32} ry={12} fill={PAL.brown} {...OUTLINE} />
      <ellipse cx={50} cy={57} rx={26} ry={9} fill={PAL.creamLight} {...OUTLINE} />
      <path d="M30 55 Q50 50 70 55" fill="none" stroke={PAL.cream} stroke-width={2} stroke-linecap="round" />
      <g transform="translate(80 46) rotate(-30)">
        <path d="M0 0 Q9 -7 18 0 Q9 7 0 0Z" fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      </g>
    </ItemSvg>
  );
}

/** 矮桌（2×1，房間用）：木色桌面與深棕桌腳，附下層橫板。 */
export function LowTableArt({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={4} y={34} width={92} height={14} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <line x1={12} y1={39} x2={88} y2={39} stroke={PAL.cream} stroke-width={1.5} stroke-linecap="round" />
      <rect x={12} y={48} width={8} height={44} rx={3} fill={PAL.brown} {...OUTLINE} />
      <rect x={80} y={48} width={8} height={44} rx={3} fill={PAL.brown} {...OUTLINE} />
      <rect x={16} y={70} width={68} height={5} rx={2} fill={PAL.brown} {...OUTLINE} />
    </ItemSvg>
  );
}

/** 竹編坐墊（1×1，房間用）：圓形藤編坐墊，交錯的編織紋、虛線車縫邊與流蘇。 */
export function CushionArt({ size }: { size: number }): JSX.Element {
  const cy = 56;
  const rx = 40;
  const ry = 28;
  const rows = [42, 50, 58, 66, 74];
  return (
    <ItemSvg size={size}>
      <ellipse cx={50} cy={cy} rx={rx} ry={ry} fill={RATTAN} {...OUTLINE} />
      {rows.map((y, i) => {
        const t = (y - cy) / ry;
        const half = rx * Math.sqrt(1 - t * t) - 6;
        return (
          <path
            key={y}
            d={`M${(50 - half).toFixed(1)} ${y} Q50 ${y + 5} ${(50 + half).toFixed(1)} ${y}`}
            fill="none"
            stroke={RATTAN_DARK}
            stroke-width={2}
            stroke-linecap="round"
            stroke-dasharray={i % 2 ? '5 3' : undefined}
          />
        );
      })}
      <ellipse cx={50} cy={cy} rx={35} ry={23} fill="none" stroke={PAL.creamLight} stroke-width={1.6} stroke-dasharray="3 3" />
      <line x1={50} y1={84} x2={50} y2={88} {...OUTLINE} stroke-width={2} />
      <circle cx={50} cy={90} r={3.5} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <path d="M47 93 L46 97 M50 93.5 L50 98 M53 93 L54 97" fill="none" stroke={PAL.gold} stroke-width={1.8} stroke-linecap="round" />
    </ItemSvg>
  );
}
