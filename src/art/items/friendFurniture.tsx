import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE, Sparkle } from './primitives';

/** 郵筒（1×1）：粉色信箱立在小柱子上，插著一封信。 */
export function MianhuaMailbox({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={46} y={60} width={8} height={32} fill={PAL.brownLight} {...OUTLINE} stroke-width={2} />
      <path d="M16 62 V38 Q16 18 50 18 Q84 18 84 38 V62Z" fill={PAL.pink} {...OUTLINE} />
      <rect x={28} y={38} width={44} height={8} rx={3} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <rect x={60} y={24} width={12} height={9} rx={2} fill={PAL.white} {...OUTLINE} stroke-width={1.5} />
      <circle cx={80} cy={34} r={4} fill={PAL.gold} {...OUTLINE} stroke-width={1.2} />
    </ItemSvg>
  );
}

/** 信件櫃（2×1）：許多小格子，每格都放著一封信。 */
export function MianhuaLetterCabinet({ size }: { size: number }): JSX.Element {
  const cells = [0, 1, 2, 3, 4, 5];
  return (
    <ItemSvg size={size}>
      <rect x={6} y={14} width={88} height={74} rx={6} fill={PAL.brownLight} {...OUTLINE} />
      {cells.map(i => {
        const x = 12 + (i % 3) * 28;
        const y = 22 + Math.floor(i / 3) * 34;
        return (
          <g key={i}>
            <rect x={x} y={y} width={22} height={26} rx={2} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.6} />
            <path d={`M${x + 2} ${y + 3} L${x + 11} ${y + 11} L${x + 20} ${y + 3}`} fill="none" stroke={i % 2 ? PAL.pinkDeep : PAL.pink} stroke-width={2} />
          </g>
        );
      })}
    </ItemSvg>
  );
}

/** 郵差小推車（2×1）：藍色小車裝滿信件，兩顆輪子。 */
export function MianhuaCart({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <line x1={86} y1={22} x2={96} y2={6} {...OUTLINE} stroke-width={3} />
      <path d="M8 34 H86 L80 70 H14Z" fill={PAL.navy} {...OUTLINE} />
      <rect x={18} y={24} width={22} height={14} rx={2} fill={PAL.white} {...OUTLINE} stroke-width={1.8} />
      <path d="M18 24 L29 33 L40 24" fill="none" stroke={PAL.pinkDeep} stroke-width={2} />
      <rect x={44} y={20} width={24} height={16} rx={2} fill={PAL.white} {...OUTLINE} stroke-width={1.8} />
      <circle cx={24} cy={80} r={7} fill={PAL.brown} {...OUTLINE} stroke-width={1.8} />
      <circle cx={70} cy={80} r={7} fill={PAL.brown} {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

/** 糖果罐（1×1）：透明玻璃罐裝滿橘色糖果。 */
export function JuziCandyJar({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={34} y={8} width={32} height={10} rx={3} fill={PAL.gold} {...OUTLINE} />
      <path d="M24 22 H76 Q82 22 82 30 V84 Q82 92 74 92 H26 Q18 92 18 84 V30 Q18 22 24 22Z" fill={PAL.creamLight} {...OUTLINE} />
      <circle cx={34} cy={50} r={8} fill={PAL.terracotta} {...OUTLINE} stroke-width={1.8} />
      <circle cx={56} cy={44} r={8} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <circle cx={66} cy={66} r={8} fill={PAL.terracotta} {...OUTLINE} stroke-width={1.8} />
      <circle cx={40} cy={72} r={8} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

/** 糖果櫃檯（2×1）：木頭櫃檯上擺著一排亮晶晶的糖果。 */
export function JuziCounter({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={6} y={32} width={88} height={10} rx={4} fill={PAL.terracotta} {...OUTLINE} />
      <rect x={10} y={42} width={80} height={44} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <circle cx={24} cy={24} r={8} fill={PAL.terracotta} {...OUTLINE} stroke-width={1.8} />
      <circle cx={42} cy={24} r={8} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <circle cx={60} cy={24} r={8} fill={PAL.pink} {...OUTLINE} stroke-width={1.8} />
      <circle cx={78} cy={24} r={8} fill={PAL.terracotta} {...OUTLINE} stroke-width={1.8} />
      <rect x={30} y={60} width={40} height={16} rx={3} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

/** 狐狸燈籠（1×1，掛牆）：橘色狐狸臉，暖橘色光暈。 */
export function JuziFoxLantern({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <line x1={50} y1={0} x2={50} y2={12} {...OUTLINE} />
      <circle cx={50} cy={56} r={40} fill={PAL.gold} opacity={0.22} />
      <path d="M22 30 L30 8 L44 24Z M78 30 L70 8 L56 24Z" fill={PAL.terracotta} {...OUTLINE} />
      <path d="M50 26 Q80 26 80 56 Q80 84 50 90 Q20 84 20 56 Q20 26 50 26Z" fill={PAL.terracotta} {...OUTLINE} />
      <path d="M50 56 Q62 56 66 70 Q50 82 34 70 Q38 56 50 56Z" fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <circle cx={38} cy={50} r={3} fill={PAL.brown} />
      <circle cx={62} cy={50} r={3} fill={PAL.brown} />
      <circle cx={50} cy={64} r={3} fill={PAL.brown} />
    </ItemSvg>
  );
}

/** 烏龜石（1×1）：慢慢最愛的石頭，上面趴著一隻小烏龜。 */
export function ManmanStone({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <ellipse cx={50} cy={74} rx={42} ry={18} fill={PAL.brownLight} {...OUTLINE} />
      <path d="M22 62 Q22 30 50 30 Q78 30 78 62Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M50 30 V62 M32 42 L50 62 L68 42" fill="none" stroke={PAL.bambooDark} stroke-width={1.8} />
      <circle cx={82} cy={62} r={8} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      <circle cx={84} cy={60} r={1.6} fill={PAL.brown} />
      <path d="M20 66 L14 70 M80 66 L86 72" fill="none" {...OUTLINE} stroke-width={3} />
    </ItemSvg>
  );
}

/** 故事書櫃（2×1）：幾本故事書疊著，旁邊一隻小烏龜。 */
export function ManmanStoryShelf({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={6} y={14} width={88} height={76} rx={5} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={14} y={24} width={36} height={12} rx={2} fill={PAL.pink} {...OUTLINE} stroke-width={1.8} />
      <rect x={16} y={36} width={32} height={12} rx={2} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      <rect x={14} y={48} width={34} height={12} rx={2} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <rect x={14} y={72} width={72} height={12} rx={2} fill={PAL.navy} {...OUTLINE} stroke-width={1.8} />
      <circle cx={70} cy={48} r={9} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      <circle cx={74} cy={44} r={2} fill={PAL.brown} />
    </ItemSvg>
  );
}

/** 龜殼帳篷（2×2）：竹綠色圓頂帳篷，入口掀開一角。 */
export function ManmanTent({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M6 88 Q6 20 50 16 Q94 20 94 88Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M50 16 L50 88 M28 30 L40 88 M72 30 L60 88" fill="none" stroke={PAL.bambooDark} stroke-width={2} />
      <path d="M36 88 Q50 56 64 88Z" fill={PAL.navy} {...OUTLINE} stroke-width={2} />
      <circle cx={24} cy={70} r={6} fill={PAL.gold} {...OUTLINE} stroke-width={1.6} />
    </ItemSvg>
  );
}

/** 發明工作台（2×1）：木桌上擺著齒輪與小工具。 */
export function GuluWorkbench({ size }: { size: number }): JSX.Element {
  const tooth = (cx: number, cy: number, r: number, fill: string) => (
    <circle cx={cx} cy={cy} r={r} fill={fill} {...OUTLINE} stroke-width={1.8} stroke-dasharray="4 3" />
  );
  return (
    <ItemSvg size={size}>
      <rect x={6} y={44} width={88} height={10} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={12} y={54} width={6} height={34} fill={PAL.brown} />
      <rect x={82} y={54} width={6} height={34} fill={PAL.brown} />
      {tooth(28, 34, 12, PAL.gold)}
      <circle cx={28} cy={34} r={4} fill={PAL.creamLight} />
      {tooth(66, 30, 9, PAL.bamboo)}
      <rect x={50} y={36} width={6} height={8} fill={PAL.navy} />
    </ItemSvg>
  );
}

/** 齒輪掛鐘（1×1，掛牆）：鐘面後方有兩個齒輪。 */
export function GuluGearClock({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={34} cy={36} r={18} fill={PAL.gold} {...OUTLINE} stroke-dasharray="5 3" />
      <circle cx={70} cy={70} r={14} fill={PAL.bamboo} {...OUTLINE} stroke-dasharray="4 3" />
      <circle cx={34} cy={36} r={12} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <line x1={34} y1={36} x2={34} y2={28} {...OUTLINE} stroke-width={2} />
      <line x1={34} y1={36} x2={41} y2={38} {...OUTLINE} stroke-width={1.8} />
      <circle cx={70} cy={70} r={4} fill={PAL.creamLight} />
    </ItemSvg>
  );
}

/** 小機器人（1×1）：藍色方塊機器人，頭上有天線，眼睛是粉紅色螢幕。 */
export function GuluRobot({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <line x1={50} y1={10} x2={50} y2={22} {...OUTLINE} />
      <circle cx={50} cy={8} r={5} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <rect x={24} y={22} width={52} height={38} rx={10} fill={PAL.navyLight} {...OUTLINE} />
      <rect x={32} y={32} width={36} height={16} rx={5} fill={PAL.pink} {...OUTLINE} stroke-width={1.8} />
      <circle cx={40} cy={40} r={3} fill={PAL.navy} />
      <circle cx={60} cy={40} r={3} fill={PAL.navy} />
      <rect x={30} y={62} width={40} height={24} rx={6} fill={PAL.navy} {...OUTLINE} />
      <circle cx={50} cy={74} r={4} fill={PAL.gold} />
    </ItemSvg>
  );
}
