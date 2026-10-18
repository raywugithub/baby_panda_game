import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE, Rainbow, Sparkle } from './primitives';

/** 竹編小架（2×1）：牆上的兩層竹板架。 */
export function BambooShelf({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={10} y={46} width={6} height={30} fill={PAL.bambooDark} {...OUTLINE} />
      <rect x={84} y={46} width={6} height={30} fill={PAL.bambooDark} {...OUTLINE} />
      <rect x={4} y={36} width={92} height={9} rx={4} fill={PAL.bamboo} {...OUTLINE} />
      <rect x={4} y={68} width={92} height={9} rx={4} fill={PAL.bamboo} {...OUTLINE} />
      <rect x={18} y={24} width={14} height={12} rx={3} fill={PAL.cream} {...OUTLINE} />
      <rect x={60} y={27} width={18} height={9} rx={3} fill={PAL.pink} {...OUTLINE} />
    </ItemSvg>
  );
}

/** 小盆栽（1×1）。 */
export function PlantPot({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 30 C34 22 22 12 26 4 C40 8 50 18 50 30Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M50 30 C66 22 78 12 74 4 C60 8 50 18 50 30Z" fill={PAL.bambooDark} {...OUTLINE} />
      <path d="M50 34 C44 22 40 16 42 8 C52 14 56 22 50 34Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M26 56 H74 L68 88 Q50 94 32 88Z" fill={PAL.terracotta} {...OUTLINE} />
      <rect x={22} y={50} width={56} height={9} rx={4} fill={PAL.terracotta} {...OUTLINE} />
    </ItemSvg>
  );
}

/** 紙燈籠（1×1，掛牆）：粉色圓燈籠與暖黃光暈。 */
export function Lantern({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <line x1={50} y1={0} x2={50} y2={14} {...OUTLINE} />
      <circle cx={50} cy={56} r={38} fill={PAL.gold} opacity={0.25} />
      <rect x={38} y={12} width={24} height={7} rx={2} fill={PAL.brown} />
      <ellipse cx={50} cy={54} rx={24} ry={28} fill={PAL.pink} {...OUTLINE} />
      <path d="M36 34 Q50 40 64 34 M34 54 Q50 60 66 54 M36 74 Q50 80 64 74" fill="none" {...OUTLINE} stroke-width={1.5} />
      <rect x={38} y={80} width={24} height={7} rx={2} fill={PAL.brown} />
    </ItemSvg>
  );
}

/** 玩具箱（1×1）。 */
export function ToyBox({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={24} y={20} width={14} height={14} rx={2} fill={PAL.pink} {...OUTLINE} />
      <rect x={42} y={12} width={14} height={14} rx={2} fill={PAL.gold} {...OUTLINE} />
      <circle cx={70} cy={24} r={7} fill={PAL.bamboo} {...OUTLINE} />
      <rect x={14} y={40} width={72} height={48} rx={6} fill={PAL.cream} {...OUTLINE} />
      <rect x={14} y={36} width={72} height={10} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={42} y={52} width={16} height={6} rx={3} fill={PAL.brown} />
    </ItemSvg>
  );
}

/** 小地毯（2×1）。 */
export function Rug({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={4} y={28} width={92} height={44} rx={22} fill={PAL.pink} {...OUTLINE} />
      <ellipse cx={50} cy={50} rx={36} ry={14} fill="none" stroke={PAL.creamLight} stroke-width={3} stroke-dasharray="4 4" />
      <path d="M4 42 L-2 36 M4 58 L-2 64 M96 42 L102 36 M96 58 L102 64" stroke={PAL.cream} stroke-width={3} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 竹椅（1×1）。 */
export function BambooChair({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={20} y={8} width={60} height={44} rx={6} fill={PAL.bamboo} {...OUTLINE} />
      <line x1={36} y1={14} x2={36} y2={46} {...OUTLINE} stroke-width={1.8} />
      <line x1={50} y1={14} x2={50} y2={46} {...OUTLINE} stroke-width={1.8} />
      <line x1={64} y1={14} x2={64} y2={46} {...OUTLINE} stroke-width={1.8} />
      <rect x={14} y={52} width={72} height={12} rx={5} fill={PAL.bamboo} {...OUTLINE} />
      <rect x={20} y={64} width={7} height={28} fill={PAL.bambooDark} {...OUTLINE} />
      <rect x={73} y={64} width={7} height={28} fill={PAL.bambooDark} {...OUTLINE} />
    </ItemSvg>
  );
}

/** 小檯燈（1×1）。 */
export function Lamp({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={46} cy={34} r={22} fill={PAL.goldLight} opacity={0.5} />
      <path d="M30 40 L58 16 L70 26 L40 44Z" fill={PAL.gold} {...OUTLINE} />
      <line x1={44} y1={70} x2={60} y2={34} {...OUTLINE} stroke-width={4} />
      <ellipse cx={50} cy={78} rx={22} ry={7} fill={PAL.navy} {...OUTLINE} />
    </ItemSvg>
  );
}

/** 小櫃子（2×1）。 */
export function Cabinet({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={6} y={22} width={88} height={60} rx={5} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={12} y={28} width={36} height={48} rx={3} fill={PAL.cream} {...OUTLINE} stroke-width={1.8} />
      <rect x={52} y={28} width={36} height={48} rx={3} fill={PAL.cream} {...OUTLINE} stroke-width={1.8} />
      <circle cx={42} cy={52} r={3} fill={PAL.gold} {...OUTLINE} stroke-width={1.2} />
      <circle cx={58} cy={52} r={3} fill={PAL.gold} {...OUTLINE} stroke-width={1.2} />
      <rect x={14} y={82} width={10} height={6} rx={2} fill={PAL.brown} />
      <rect x={76} y={82} width={10} height={6} rx={2} fill={PAL.brown} />
    </ItemSvg>
  );
}

/** 點心籃（1×1）。 */
export function SnackBasket({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={34} cy={36} r={10} fill={PAL.pink} {...OUTLINE} />
      <circle cx={60} cy={30} r={9} fill={PAL.gold} {...OUTLINE} />
      <ellipse cx={48} cy={42} rx={9} ry={6} fill={PAL.bamboo} {...OUTLINE} />
      <path d="M10 48 H90 Q86 84 50 86 Q14 84 10 48Z" fill={PAL.terracotta} {...OUTLINE} />
      <path d="M18 60 H82 M22 72 H78" fill="none" stroke={PAL.brown} stroke-width={1.5} opacity={0.5} />
    </ItemSvg>
  );
}

/** 竹籬笆（2×1）。 */
export function BambooFence({ size }: { size: number }): JSX.Element {
  const posts = [8, 24, 40, 56, 72, 88];
  return (
    <ItemSvg size={size}>
      <rect x={4} y={40} width={92} height={6} rx={3} fill={PAL.bambooDark} {...OUTLINE} stroke-width={1.8} />
      <rect x={4} y={66} width={92} height={6} rx={3} fill={PAL.bambooDark} {...OUTLINE} stroke-width={1.8} />
      {posts.map(x => (
        <g key={x}>
          <rect x={x - 5} y={28} width={10} height={58} rx={2} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
          <path d={`M${x - 5} 28 L${x} 18 L${x + 5} 28Z`} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
        </g>
      ))}
    </ItemSvg>
  );
}

/** 蘑菇小凳（1×1）。 */
export function MushroomStool({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={38} y={52} width={24} height={36} rx={6} fill={PAL.cream} {...OUTLINE} />
      <path d="M8 56 Q8 14 50 14 Q92 14 92 56 Q50 64 8 56Z" fill={PAL.pinkDeep} {...OUTLINE} />
      <circle cx={30} cy={34} r={5} fill={PAL.white} />
      <circle cx={56} cy={26} r={4} fill={PAL.white} />
      <circle cx={70} cy={44} r={5} fill={PAL.white} />
    </ItemSvg>
  );
}

/** 花瓶（1×1）。 */
export function FlowerVase({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={34} cy={22} r={8} fill={PAL.pink} {...OUTLINE} />
      <circle cx={56} cy={16} r={8} fill={PAL.gold} {...OUTLINE} />
      <circle cx={66} cy={30} r={6} fill={PAL.pink} {...OUTLINE} />
      <path d="M46 40 Q30 46 36 70 L42 84 H58 L64 70 Q70 46 54 40Z" fill={PAL.navy} {...OUTLINE} />
      <path d="M46 40 L50 30 L54 40" fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      <path d="M40 60 Q50 54 60 60" fill="none" stroke={PAL.goldLight} stroke-width={3} />
    </ItemSvg>
  );
}

/** 小沙發（2×1，閃亮）。 */
export function Sofa({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={6} y={26} width={88} height={34} rx={12} fill={PAL.pink} {...OUTLINE} />
      <rect x={2} y={36} width={16} height={38} rx={7} fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={82} y={36} width={16} height={38} rx={7} fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={20} y={48} width={28} height={18} rx={6} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <rect x={52} y={48} width={28} height={18} rx={6} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <rect x={8} y={70} width={84} height={8} rx={3} fill={PAL.brownLight} />
      <Sparkle />
    </ItemSvg>
  );
}

/** 小床（2×2，閃亮）。 */
export function Bed({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={6} y={14} width={12} height={76} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={12} y={44} width={84} height={30} rx={6} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={20} y={36} width={36} height={16} rx={7} fill={PAL.white} {...OUTLINE} stroke-width={1.8} />
      <path d="M32 46 H94 V64 H32Z" fill={PAL.navy} {...OUTLINE} stroke-width={1.8} />
      <circle cx={70} cy={55} r={4} fill={PAL.gold} />
      <rect x={6} y={74} width={6} height={12} fill={PAL.brown} />
      <rect x={90} y={74} width={6} height={12} fill={PAL.brown} />
      <Sparkle />
    </ItemSvg>
  );
}

/** 鞦韆（2×2，閃亮）。 */
export function Swing({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M4 10 Q50 2 96 10" fill="none" {...OUTLINE} stroke-width={5} />
      <circle cx={20} cy={14} r={9} fill={PAL.bamboo} {...OUTLINE} />
      <circle cx={78} cy={12} r={8} fill={PAL.bamboo} {...OUTLINE} />
      <line x1={34} y1={10} x2={36} y2={56} {...OUTLINE} stroke-width={2} />
      <line x1={70} y1={10} x2={68} y2={56} {...OUTLINE} stroke-width={2} />
      <rect x={28} y={56} width={46} height={8} rx={4} fill={PAL.gold} {...OUTLINE} />
      <ellipse cx={51} cy={74} rx={20} ry={5} fill={PAL.brownLight} opacity={0.3} />
      <Sparkle x={90} y={60} />
    </ItemSvg>
  );
}

/** 閱讀角椅（1×1，閃亮）。 */
export function ReadingNook({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M20 30 Q20 12 50 12 Q80 12 80 30 V60 H20Z" fill={PAL.navyLight} {...OUTLINE} />
      <rect x={12} y={52} width={76} height={20} rx={8} fill={PAL.navy} {...OUTLINE} />
      <rect x={30} y={44} width={40} height={12} rx={2} fill={PAL.pink} {...OUTLINE} stroke-width={1.8} transform="rotate(-6 50 50)" />
      <rect x={26} y={72} width={8} height={16} fill={PAL.brown} />
      <rect x={66} y={72} width={8} height={16} fill={PAL.brown} />
      <Sparkle />
    </ItemSvg>
  );
}

/** 書架（2×1，閃亮）。 */
export function Bookshelf({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={6} y={6} width={88} height={88} rx={5} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={14} y={16} width={10} height={26} fill={PAL.navy} />
      <rect x={26} y={18} width={9} height={24} fill={PAL.pink} />
      <rect x={37} y={14} width={8} height={28} fill={PAL.bamboo} />
      <rect x={47} y={20} width={10} height={22} fill={PAL.gold} />
      <rect x={60} y={16} width={9} height={26} fill={PAL.navyLight} />
      <rect x={71} y={18} width={12} height={24} fill={PAL.pinkDeep} />
      <rect x={14} y={50} width={12} height={24} fill={PAL.gold} />
      <rect x={28} y={54} width={9} height={20} fill={PAL.bamboo} />
      <rect x={39} y={52} width={10} height={22} fill={PAL.navy} />
      <rect x={52} y={56} width={9} height={18} fill={PAL.pink} />
      <rect x={63} y={50} width={11} height={24} fill={PAL.navyLight} />
      <Sparkle x={88} y={22} />
    </ItemSvg>
  );
}

/** 掛鐘（1×1，掛牆，閃亮）。 */
export function Clock({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={50} cy={50} r={38} fill={PAL.brownLight} {...OUTLINE} />
      <circle cx={50} cy={50} r={30} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <line x1={50} y1={50} x2={50} y2={30} {...OUTLINE} stroke-width={3} />
      <line x1={50} y1={50} x2={64} y2={56} {...OUTLINE} stroke-width={2.5} />
      <circle cx={50} cy={50} r={3} fill={PAL.gold} />
      <Sparkle />
    </ItemSvg>
  );
}

/** 吊床（2×2，彩虹）：兩棵樹之間的彩虹網。 */
export function Hammock({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="furn-hammock" /></defs>
      <rect x={2} y={6} width={10} height={88} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <rect x={88} y={6} width={10} height={88} rx={4} fill={PAL.brownLight} {...OUTLINE} />
      <path d="M12 26 Q50 96 88 26 Q50 58 12 26Z" fill="url(#rb-furn-hammock)" {...OUTLINE} />
      <path d="M12 26 Q50 96 88 26" fill="none" {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

/** 豆袋椅（1×1，彩虹）。 */
export function Beanbag({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="furn-beanbag" /></defs>
      <path d="M14 58 Q10 18 50 16 Q90 18 86 58 Q88 86 50 88 Q12 86 14 58Z" fill="url(#rb-furn-beanbag)" {...OUTLINE} />
      <path d="M34 50 Q50 58 66 50" fill="none" stroke={PAL.brown} stroke-width={2} opacity={0.4} />
    </ItemSvg>
  );
}

/** 小噴泉（2×2，彩虹）。 */
export function Fountain({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="furn-fountain" /></defs>
      <ellipse cx={50} cy={72} rx={46} ry={20} fill={PAL.cream} {...OUTLINE} />
      <ellipse cx={50} cy={70} rx={36} ry={13} fill={PAL.water} {...OUTLINE} stroke-width={1.8} />
      <rect x={44} y={40} width={12} height={28} rx={3} fill={PAL.cream} {...OUTLINE} />
      <path d="M50 40 Q30 34 22 18 M50 40 Q70 34 78 18 M50 40 V14" fill="none" stroke={PAL.water} stroke-width={4} stroke-linecap="round" />
      <circle cx={22} cy={16} r={4} fill="url(#rb-furn-fountain)" />
      <circle cx={78} cy={16} r={4} fill="url(#rb-furn-fountain)" />
      <circle cx={50} cy={12} r={4} fill="url(#rb-furn-fountain)" />
    </ItemSvg>
  );
}
