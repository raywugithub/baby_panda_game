import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE, Rainbow, Sparkle } from './primitives';

// 各部位的繪製原點皆在 100×100 方框中央；頭飾畫在頂端、臉飾對齊眼睛（約 y=21）、
// 身體衣物覆蓋肚子（約 y=50）、手持與尾巴物件則置中於方框。

/** 竹葉帽：竹黃色圓錐斗笠，帽頂綴一片竹葉。 */
export function BambooHat({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M20 50 Q50 -4 80 50 Z" fill={PAL.gold} {...OUTLINE} />
      <ellipse cx={50} cy={52} rx={44} ry={9} fill={PAL.gold} {...OUTLINE} />
      <path d="M50 14 C40 6 34 -2 40 -6 C50 0 54 6 50 14Z" fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      <path d="M24 46 Q50 38 76 46" fill="none" stroke={PAL.bambooDark} stroke-width={4} />
    </ItemSvg>
  );
}

/** 蝴蝶結髮圈：粉色雙環蝴蝶結，停在頭頂。 */
export function BowHeadband({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 46 C40 30 18 28 20 42 C22 52 40 50 50 46Z" fill={PAL.pink} {...OUTLINE} />
      <path d="M50 46 C60 30 82 28 80 42 C78 52 60 50 50 46Z" fill={PAL.pink} {...OUTLINE} />
      <circle cx={50} cy={46} r={6} fill={PAL.pinkDeep} {...OUTLINE} stroke-width={1.8} />
      <path d="M26 52 Q50 46 74 52" fill="none" stroke={PAL.pinkDeep} stroke-width={3} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 小毛帽（閃亮）：奶油色針織帽，頂端有毛球。 */
export function KnitCap({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={50} cy={10} r={7} fill={PAL.white} {...OUTLINE} stroke-width={1.8} />
      <path d="M18 56 Q18 22 50 22 Q82 22 82 56Z" fill={PAL.creamLight} {...OUTLINE} />
      <rect x={16} y={48} width={68} height={14} rx={6} fill={PAL.pink} {...OUTLINE} />
      <path d="M32 48 V62 M50 48 V62 M68 48 V62" fill="none" stroke={PAL.pinkDeep} stroke-width={1.6} />
      <Sparkle x={86} y={18} />
    </ItemSvg>
  );
}

/** 星星小皇冠（彩虹）：三尖皇冠與小寶石。 */
export function StarCrown({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="outfit-head-crown" /></defs>
      <path d="M18 60 L14 26 L34 42 L50 14 L66 42 L86 26 L82 60Z" fill="url(#rb-outfit-head-crown)" {...OUTLINE} />
      <rect x={18} y={58} width={64} height={12} rx={4} fill="url(#rb-outfit-head-crown)" {...OUTLINE} />
      <circle cx={50} cy={60} r={3.5} fill={PAL.white} />
      <circle cx={30} cy={60} r={2.5} fill={PAL.white} />
      <circle cx={70} cy={60} r={2.5} fill={PAL.white} />
    </ItemSvg>
  );
}

/** 圓框眼鏡：兩個圓框蓋在眼睛上，中間有鼻樑。 */
export function RoundGlasses({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M26 20 Q50 14 74 20" fill="none" {...OUTLINE} stroke={PAL.navy} stroke-width={3} />
      <line x1={2} y1={18} x2={0} y2={14} stroke={PAL.navy} stroke-width={2.5} stroke-linecap="round" />
      <line x1={98} y1={18} x2={100} y2={14} stroke={PAL.navy} stroke-width={2.5} stroke-linecap="round" />
      <circle cx={14} cy={21} r={12} fill={PAL.white} opacity={0.35} stroke={PAL.navy} stroke-width={3} />
      <circle cx={86} cy={21} r={12} fill={PAL.white} opacity={0.35} stroke={PAL.navy} stroke-width={3} />
    </ItemSvg>
  );
}

/** 小眼罩：深藍色眼罩橫跨眼睛，兩側有細帶子。 */
export function SleepMask({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M0 14 Q50 4 100 14 Q98 34 74 32 Q50 22 26 32 Q2 34 0 14Z" fill={PAL.navy} {...OUTLINE} stroke={PAL.navyLight} />
      <path d="M8 22 Q12 26 18 24 M92 22 Q88 26 82 24" fill="none" stroke={PAL.white} stroke-width={2} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 腮紅貼（閃亮）：兩片粉紅色圓形腮紅。 */
export function BlushPatch({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <ellipse cx={16} cy={70} rx={12} ry={8} fill={PAL.pinkDeep} opacity={0.75} />
      <ellipse cx={84} cy={70} rx={12} ry={8} fill={PAL.pinkDeep} opacity={0.75} />
      <Sparkle x={90} y={44} r={3} />
    </ItemSvg>
  );
}

/** 虎紋彩繪（彩虹）：臉頰與額頭上的彩虹色條紋。 */
export function TigerPaint({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="outfit-face-tiger" /></defs>
      <path d="M4 32 L24 40 M8 48 L26 50 M4 64 L22 60" fill="none" stroke="url(#rb-outfit-face-tiger)" stroke-width={5} stroke-linecap="round" />
      <path d="M96 32 L76 40 M92 48 L74 50 M96 64 L78 60" fill="none" stroke="url(#rb-outfit-face-tiger)" stroke-width={5} stroke-linecap="round" />
      <path d="M40 4 L46 16 M60 4 L54 16" fill="none" stroke="url(#rb-outfit-face-tiger)" stroke-width={5} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 小圍巾：粉色針織圍巾繞著脖子，垂下一小段。 */
export function Scarf({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M12 22 Q50 40 88 22 L90 36 Q50 54 10 36Z" fill={PAL.pink} {...OUTLINE} />
      <path d="M22 30 L26 40 M40 36 L42 46 M60 36 L58 46 M78 30 L74 40" fill="none" stroke={PAL.pinkDeep} stroke-width={2} />
      <rect x={60} y={44} width={14} height={30} rx={5} fill={PAL.pink} {...OUTLINE} />
    </ItemSvg>
  );
}

/** 小背心：深藍色背心配金色扣子。 */
export function Vest({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M22 20 L40 20 L50 34 L60 20 L78 20 L80 86 Q50 94 20 86Z" fill={PAL.navy} {...OUTLINE} />
      <circle cx={50} cy={46} r={3} fill={PAL.gold} />
      <circle cx={50} cy={60} r={3} fill={PAL.gold} />
      <circle cx={50} cy={74} r={3} fill={PAL.gold} />
    </ItemSvg>
  );
}

/** 小雨衣（閃亮）：金黃色雨衣，帶有帽緣與拉鍊線。 */
export function Raincoat({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M20 20 Q50 8 80 20 L80 86 Q50 94 20 86Z" fill={PAL.gold} {...OUTLINE} />
      <path d="M50 20 V88" stroke={PAL.brown} stroke-width={1.8} stroke-dasharray="3 3" />
      <path d="M30 34 Q50 22 70 34" fill="none" stroke={PAL.goldLight} stroke-width={3} />
      <Sparkle x={84} y={14} />
    </ItemSvg>
  );
}

/** 小漢服（彩虹）：彩虹色長袍配深藍色腰帶。 */
export function Hanfu({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="outfit-body-hanfu" /></defs>
      <path d="M26 16 L74 16 L88 92 L12 92Z" fill="url(#rb-outfit-body-hanfu)" {...OUTLINE} />
      <path d="M50 16 L50 92" stroke={PAL.white} stroke-width={1.5} opacity={0.6} />
      <rect x={18} y={42} width={64} height={8} rx={3} fill={PAL.navy} {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

/** 竹葉扇：竹綠色摺扇，扇面有竹骨紋路。 */
export function BambooFan({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 88 L8 40 Q50 -6 92 40Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M50 88 L30 14 M50 88 L50 8 M50 88 L70 14" fill="none" stroke={PAL.bambooDark} stroke-width={2} />
      <line x1={50} y1={88} x2={50} y2={100} {...OUTLINE} stroke-width={4} />
    </ItemSvg>
  );
}

/** 小氣球：粉色氣球，綁著一條細繩。 */
export function Balloon({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <ellipse cx={56} cy={34} rx={28} ry={31} fill={PAL.pink} {...OUTLINE} />
      <path d="M50 64 L56 72 L62 64Z" fill={PAL.pinkDeep} {...OUTLINE} stroke-width={1.8} />
      <path d="M56 72 Q44 84 50 98" fill="none" {...OUTLINE} stroke-width={1.6} />
      <path d="M38 22 Q42 14 48 14" fill="none" stroke={PAL.white} stroke-width={3} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 小雨傘（閃亮）：粉色與深藍色交錯的傘面，帶有彎柄。 */
export function Umbrella({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M6 50 Q50 -6 94 50 Q82 44 72 50 Q62 44 50 50 Q38 44 28 50 Q18 44 6 50Z" fill={PAL.pink} {...OUTLINE} />
      <path d="M50 14 Q34 14 30 40 M50 14 Q66 14 70 40 M50 14 V6" fill="none" stroke={PAL.navy} stroke-width={2} />
      <line x1={50} y1={22} x2={50} y2={88} {...OUTLINE} stroke-width={3} />
      <path d="M50 88 Q50 98 40 96" fill="none" {...OUTLINE} stroke-width={3} />
      <Sparkle x={88} y={18} />
    </ItemSvg>
  );
}

/** 竹笛（彩虹）：斜放的長笛，上面有幾個音孔。 */
export function BambooFlute({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="outfit-hand-flute" /></defs>
      <line x1={4} y1={86} x2={96} y2={14} stroke={PAL.brown} stroke-width={13} stroke-linecap="round" />
      <line x1={4} y1={86} x2={96} y2={14} stroke="url(#rb-outfit-hand-flute)" stroke-width={8} stroke-linecap="round" />
      <circle cx={34} cy={62} r={2.5} fill={PAL.brown} />
      <circle cx={48} cy={52} r={2.5} fill={PAL.brown} />
      <circle cx={62} cy={42} r={2.5} fill={PAL.brown} />
    </ItemSvg>
  );
}

/** 尾巴蝴蝶結：粉色蝴蝶結。 */
export function TailBow({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 50 C36 30 10 24 12 44 C14 60 36 56 50 50Z" fill={PAL.pink} {...OUTLINE} />
      <path d="M50 50 C64 30 90 24 88 44 C86 60 64 56 50 50Z" fill={PAL.pink} {...OUTLINE} />
      <circle cx={50} cy={50} r={7} fill={PAL.pinkDeep} {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

/** 緞帶：一條波浪形的粉色緞帶。 */
export function Ribbon({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M8 66 Q28 24 50 50 T92 34" fill="none" {...OUTLINE} stroke-width={12} />
      <path d="M8 66 Q28 24 50 50 T92 34" fill="none" stroke={PAL.gold} stroke-width={7} stroke-linecap="round" />
      <path d="M50 50 L60 40 M92 34 L84 20" stroke={PAL.gold} stroke-width={1.5} />
    </ItemSvg>
  );
}

/** 毛絨尾套（閃亮）：奶白色毛茸茸的圓形尾套。 */
export function FluffyTail({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={50} cy={50} r={40} fill={PAL.creamLight} {...OUTLINE} />
      <circle cx={24} cy={30} r={9} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <circle cx={76} cy={30} r={9} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <circle cx={24} cy={70} r={9} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <circle cx={76} cy={70} r={9} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <path d="M36 48 Q42 56 50 48 Q58 56 64 48" fill="none" stroke={PAL.brownLight} stroke-width={2} opacity={0.6} />
      <Sparkle x={88} y={16} />
    </ItemSvg>
  );
}

/** 星星尾飾（彩虹）：尾巴尖上的彩虹色小星星。 */
export function StarTail({ size }: { size: number }): JSX.Element {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 44 : 19;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(52 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="outfit-tail-star" /></defs>
      <polygon points={pts} fill="url(#rb-outfit-tail-star)" {...OUTLINE} />
    </ItemSvg>
  );
}
