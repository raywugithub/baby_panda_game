import type { ComponentChildren, ComponentType, JSX } from 'preact';
import { PAL, OUTLINE } from './items/primitives';

// 地標：100×100 的座標系，底部中心在 (50, 96)。以 size 決定實際大小，錨點在底部中心（0,0）。
// 呼叫端以 <g transform="translate(x y)"> 放到場景上，地標會站在 (x, y) 上。

type LmProps = { size: number };

function Lm({ size, children }: { size: number; children?: ComponentChildren }): JSX.Element {
  return (
    <svg x={-size / 2} y={-size} width={size} height={size} viewBox="0 0 100 100" overflow="visible">
      {children}
    </svg>
  );
}

const SHADOW = <ellipse cx={50} cy={95} rx={36} ry={4} fill={PAL.brown} opacity={0.18} />;

/** 樹屋：大樹幹、綠色樹冠、木頭平台與小窗。 */
export function TreehouseArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M44 96 Q42 70 46 50 L54 50 Q58 70 56 96Z" fill="#B88A62" {...OUTLINE} />
      <path d="M46 60 Q30 58 26 46" fill="none" stroke="#B88A62" stroke-width={5} stroke-linecap="round" />
      <circle cx={50} cy={34} r={30} fill="#8FC27A" {...OUTLINE} />
      <circle cx={28} cy={48} r={16} fill="#8FC27A" {...OUTLINE} />
      <circle cx={72} cy={46} r={16} fill="#8FC27A" {...OUTLINE} />
      <circle cx={40} cy={22} r={5} fill="#F4B6C2" />
      <circle cx={66} cy={30} r={4} fill="#F4B6C2" />
      <circle cx={56} cy={44} r={3} fill="#F6DA8A" />
      <rect x={20} y={58} width={60} height={8} rx={3} fill="#D9A777" {...OUTLINE} />
      <path d="M36 66 H64 V76 H36Z" fill={PAL.creamLight} {...OUTLINE} />
      <path d="M32 66 L50 52 L68 66Z" fill={PAL.terracotta} {...OUTLINE} />
      <circle cx={50} cy={72} r={3} fill={PAL.gold} />
      <path d="M38 96 L28 90 M62 96 L72 90" fill="none" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />
    </Lm>
  );
}

/** 石橋：拱形石橋跨過小河，橋下有水波。 */
export function StoneBridgeArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M2 74 Q50 66 98 74 L98 84 Q50 78 2 84Z" fill={PAL.water} opacity={0.9} />
      <path d="M8 60 Q50 16 92 60 L92 70 Q50 30 8 70Z" fill="#CFC6B8" {...OUTLINE} />
      <path d="M26 60 Q50 34 74 60" fill="none" stroke={PAL.brownLight} stroke-width={3} stroke-dasharray="4 4" />
      <path d="M40 66 Q50 48 60 66" fill="none" stroke="#8D8377" stroke-width={2.5} />
      <rect x={6} y={58} width={12} height={14} rx={3} fill="#E0D8CB" {...OUTLINE} />
      <rect x={82} y={58} width={12} height={14} rx={3} fill="#E0D8CB" {...OUTLINE} />
      <path d="M22 84 Q28 80 34 84 M60 88 Q66 84 72 88" fill="none" stroke="#FFFFFF" stroke-width={2} stroke-linecap="round" opacity={0.8} />
      <circle cx={84} cy={24} r={3} fill={PAL.gold} />
      <circle cx={16} cy={28} r={2.5} fill={PAL.pink} />
    </Lm>
  );
}

/** 風車：白色塔身、紅屋頂與四片風帆。 */
export function WindmillArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M36 96 L40 46 H60 L64 96Z" fill={PAL.creamLight} {...OUTLINE} />
      <path d="M34 46 L50 26 L66 46Z" fill={PAL.strawberry} {...OUTLINE} />
      <rect x={45} y={80} width={10} height={16} rx={4} fill="#B88A62" {...OUTLINE} />
      <g transform="translate(50 36)">
        {[0, 90, 180, 270].map(a => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M-3 0 L-4 -30 L4 -30 L3 0Z" fill={PAL.gold} {...OUTLINE} />
            <path d="M-2 -6 L-14 -6 M2 -14 L14 -14" stroke={PAL.brown} stroke-width={1} opacity={0.5} />
          </g>
        ))}
        <circle r={5} fill={PAL.brown} />
        <circle r={2} fill={PAL.gold} />
      </g>
      <path d="M22 96 Q50 84 78 96" fill="#9BCB7B" {...OUTLINE} />
    </Lm>
  );
}

/** 燈塔：紅白條紋塔身、頂端燈火與光束。 */
export function LighthouseArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M50 18 L70 40 L30 40Z" fill="#FFF6C9" opacity={0.55} />
      <path d="M36 96 L42 34 H58 L64 96Z" fill={PAL.white} {...OUTLINE} />
      <path d="M39.5 74 H60.5 L61.5 84 H38.5Z" fill={PAL.strawberry} />
      <path d="M41 54 H59 L60 64 H40Z" fill={PAL.strawberry} />
      <path d="M40 34 Q50 22 60 34Z" fill={PAL.navy} {...OUTLINE} />
      <rect x={44} y={40} width={12} height={10} rx={3} fill={PAL.gold} {...OUTLINE} />
      <circle cx={50} cy={45} r={2.5} fill={PAL.white} />
      <path d="M26 96 Q50 84 74 96" fill="#B9B0A3" {...OUTLINE} />
      <path d="M46 96 V84 H54 V96Z" fill={PAL.brown} />
      <circle cx={50} cy={16} r={3} fill={PAL.gold} />
    </Lm>
  );
}

/** 螢火燈籠：細長竹竿掛著發光的燈籠，四周飛著螢火蟲。 */
export function FireflyLampArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <rect x={48} y={24} width={4} height={72} rx={2} fill={PAL.bambooDark} />
      <rect x={38} y={92} width={24} height={5} rx={2} fill={PAL.bamboo} {...OUTLINE} />
      <path d="M50 30 V38" stroke={PAL.brown} stroke-width={2} />
      <ellipse cx={50} cy={50} rx={18} ry={14} fill={PAL.goldLight} opacity={0.5} />
      <ellipse cx={50} cy={50} rx={13} ry={17} fill={PAL.gold} {...OUTLINE} />
      <path d="M40 40 Q50 36 60 40 M38 50 H62 M40 60 Q50 64 60 60" fill="none" stroke={PAL.brown} stroke-width={1.5} opacity={0.6} />
      <path d="M44 33 H56" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />
      {[[18, 30], [78, 24], [84, 60], [16, 66], [30, 14]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5} fill={PAL.goldLight} opacity={0.35} />
          <circle cx={x} cy={y} r={2} fill="#FFF6C9" />
        </g>
      ))}
    </Lm>
  );
}

/** 小木屋：原木牆、三角屋頂、冒煙的煙囪。 */
export function CabinArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <rect x={66} y={18} width={9} height={24} fill="#A8745A" {...OUTLINE} />
      <path d="M70 12 Q64 6 70 0 Q76 -4 70 -10" fill="none" stroke="#FFFFFF" stroke-width={3} stroke-linecap="round" opacity={0.9} />
      <rect x={20} y={54} width={60} height={42} fill="#C98A63" {...OUTLINE} />
      {[60, 70, 80, 90].map(y => <path key={y} d={`M20 ${y} H80`} stroke="#A8745A" stroke-width={1.5} opacity={0.6} />)}
      <path d="M10 56 L50 22 L90 56Z" fill="#8C5E45" {...OUTLINE} />
      <path d="M10 56 L50 22 L90 56" fill="none" stroke={PAL.brown} stroke-width={4} stroke-linejoin="round" />
      <rect x={42} y={70} width={16} height={26} rx={3} fill={PAL.creamLight} {...OUTLINE} />
      <rect x={26} y={64} width={11} height={11} rx={2} fill="#FFF0B3" {...OUTLINE} />
      <rect x={63} y={64} width={11} height={11} rx={2} fill="#FFF0B3" {...OUTLINE} />
      <path d="M31 64 V75 M26 69.5 H37 M68 64 V75 M63 69.5 H74" stroke={PAL.brown} stroke-width={1.2} />
      <circle cx={54} cy={84} r={1.6} fill={PAL.brown} />
      <path d="M12 96 H88" stroke={PAL.brownLight} stroke-width={3} stroke-linecap="round" />
    </Lm>
  );
}

/** 鞦韆樹：大樹與掛在枝上的木頭鞦韆。 */
export function SwingTreeArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M40 96 Q42 66 44 46 L56 46 Q58 66 60 96Z" fill="#B88A62" {...OUTLINE} />
      <path d="M46 56 Q30 46 22 40 M54 52 Q70 44 80 40" fill="none" stroke="#B88A62" stroke-width={4} stroke-linecap="round" />
      <circle cx={50} cy={30} r={26} fill="#A8D48C" {...OUTLINE} />
      <circle cx={22} cy={40} r={12} fill="#A8D48C" {...OUTLINE} />
      <circle cx={80} cy={36} r={14} fill="#A8D48C" {...OUTLINE} />
      <circle cx={60} cy={18} r={4} fill="#F4B6C2" />
      <circle cx={34} cy={28} r={3} fill="#F4B6C2" />
      <path d="M32 44 L32 70 M62 44 L62 70" stroke={PAL.brownLight} stroke-width={1.5} />
      <path d="M26 70 Q47 80 68 70 L68 74 Q47 84 26 74Z" fill={PAL.pinkDeep} {...OUTLINE} />
      <path d="M22 96 Q50 88 78 96" fill="#9BCB7B" {...OUTLINE} />
    </Lm>
  );
}

/** 水車：木頭大輪子與小水車屋，旁邊是流水。 */
export function WaterwheelArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M2 88 Q50 80 98 88 L98 96 H2Z" fill={PAL.water} opacity={0.85} />
      <path d="M58 70 H94 L94 96 H58Z" fill={PAL.cream} {...OUTLINE} />
      <path d="M54 70 L76 52 L98 70Z" fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={68} y={80} width={10} height={16} rx={2} fill="#B88A62" {...OUTLINE} />
      <g transform="translate(32 60)">
        <circle r={26} fill="none" stroke={PAL.brown} stroke-width={6} />
        <circle r={26} fill="none" stroke="#C9A071" stroke-width={3} />
        {[0, 45, 90, 135].map(a => (
          <g key={a} transform={`rotate(${a})`}>
            <rect x={-2.5} y={-27} width={5} height={54} fill="#C9A071" stroke={PAL.brown} stroke-width={1.5} />
          </g>
        ))}
        <circle r={5} fill={PAL.brown} />
      </g>
      <rect x={24} y={60} width={6} height={36} fill={PAL.brownLight} />
      <path d="M8 96 Q40 92 58 96" fill="none" stroke={PAL.bambooDark} stroke-width={3} stroke-linecap="round" />
      <path d="M14 76 Q18 72 22 76 M74 92 Q78 88 82 92" fill="none" stroke="#FFFFFF" stroke-width={2} stroke-linecap="round" />
    </Lm>
  );
}

/** 空中花園：一座飄浮的草地小島，島上有花與小樹，垂下幾條藤蔓。 */
export function SkyGardenArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      <ellipse cx={50} cy={92} rx={30} ry={4} fill={PAL.brown} opacity={0.12} />
      <path d="M14 62 Q14 56 22 56 H78 Q86 56 86 62 Q80 84 50 90 Q20 84 14 62Z" fill="#C98A63" {...OUTLINE} />
      <path d="M14 62 Q14 56 22 56 H78 Q86 56 86 62 Q84 62 78 62 H22 Q16 62 14 62Z" fill="#9BCB7B" {...OUTLINE} />
      <circle cx={34} cy={48} r={14} fill="#8FC27A" {...OUTLINE} />
      <circle cx={58} cy={44} r={18} fill="#A8D48C" {...OUTLINE} />
      <circle cx={56} cy={28} r={3} fill="#F4B6C2" />
      <circle cx={40} cy={40} r={2.5} fill={PAL.gold} />
      <circle cx={68} cy={38} r={2.5} fill={PAL.white} />
      <path d="M22 60 Q20 72 26 80 M80 60 Q82 72 74 84" fill="none" stroke={PAL.bambooDark} stroke-width={2} stroke-linecap="round" />
      <circle cx={26} cy={80} r={3} fill={PAL.pink} />
      <circle cx={74} cy={84} r={3} fill={PAL.pink} />
      <path d="M50 6 L52 10 L56 10 L53 13 L54 17 L50 14.5 L46 17 L47 13 L44 10 L48 10Z" fill={PAL.gold} />
    </Lm>
  );
}

/** 巨菇：超大紅色蘑菇傘、白點與門窗。 */
export function GiantMushroomArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M38 96 Q40 66 42 52 H58 Q60 66 62 96Z" fill={PAL.creamLight} {...OUTLINE} />
      <path d="M46 96 V78 Q46 72 50 72 Q54 72 54 78 V96Z" fill="#E8C49C" {...OUTLINE} />
      <path d="M6 56 Q6 10 50 10 Q94 10 94 56 Q80 62 66 58 Q50 66 34 58 Q20 62 6 56Z" fill={PAL.strawberry} {...OUTLINE} />
      {[[24, 30], [44, 20], [66, 24], [80, 40], [54, 40], [30, 48], [70, 54]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 5.5} fill={PAL.white} />
      ))}
      <path d="M16 56 Q50 64 84 56" fill="none" stroke="#C4475D" stroke-width={2} opacity={0.5} />
      <circle cx={84} cy={14} r={2.5} fill={PAL.gold} />
      <circle cx={14} cy={20} r={2} fill={PAL.white} opacity={0.8} />
      <path d="M22 96 Q50 88 78 96" fill="#9BCB7B" {...OUTLINE} />
    </Lm>
  );
}

/** 小涼亭：八角形屋頂、四根紅柱與木頭長椅。 */
export function PavilionArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M10 40 Q28 30 50 22 Q72 30 90 40 Q82 38 74 40 H26 Q18 38 10 40Z" fill={PAL.navy} {...OUTLINE} />
      <path d="M14 42 Q50 26 86 42 Q50 34 14 42Z" fill={PAL.navyLight} />
      <path d="M22 40 Q50 30 78 40 L72 46 H28Z" fill={PAL.navyLight} {...OUTLINE} />
      <circle cx={50} cy={22} r={3} fill={PAL.gold} />
      <rect x={20} y={46} width={6} height={44} rx={2} fill={PAL.strawberry} {...OUTLINE} />
      <rect x={74} y={46} width={6} height={44} rx={2} fill={PAL.strawberry} {...OUTLINE} />
      <rect x={36} y={46} width={4} height={44} rx={2} fill={PAL.strawberry} />
      <rect x={60} y={46} width={4} height={44} rx={2} fill={PAL.strawberry} />
      <rect x={18} y={84} width={64} height={6} rx={3} fill="#C9A071" {...OUTLINE} />
      <path d="M30 76 H66" stroke={PAL.brown} stroke-width={1.5} />
      <path d="M10 96 H90" stroke={PAL.brownLight} stroke-width={3} stroke-linecap="round" />
      <circle cx={84} cy={14} r={2} fill={PAL.white} />
    </Lm>
  );
}

/** 流星井：石頭井沿、木頭井架與一顆從井裡升起的星星。 */
export function StarWellArt({ size }: LmProps): JSX.Element {
  return (
    <Lm size={size}>
      {SHADOW}
      <path d="M20 12 L24 2 M34 14 L30 4" stroke={PAL.brownLight} stroke-width={3} stroke-linecap="round" />
      <path d="M22 40 L50 18 L78 40" fill="none" stroke={PAL.brown} stroke-width={4} stroke-linejoin="round" />
      <path d="M22 40 L50 18 L78 40" fill="none" stroke="#C9A071" stroke-width={2} />
      <path d="M34 38 V76 M66 38 V76" stroke={PAL.brown} stroke-width={3} />
      <path d="M22 76 Q22 68 50 68 Q78 68 78 76 V92 Q78 96 50 96 Q22 96 22 92Z" fill="#B9B0A3" {...OUTLINE} />
      <ellipse cx={50} cy={76} rx={22} ry={6} fill="#5E6F93" {...OUTLINE} />
      <path d="M44 74 Q50 70 56 74" fill="none" stroke="#FFFFFF" stroke-width={1.5} opacity={0.8} />
      <path d="M50 22 V40" stroke={PAL.brown} stroke-width={1.5} />
      <path d="M46 40 H54 L56 46 H44Z" fill={PAL.brownLight} {...OUTLINE} />
      <path d="M50 2 L53 10 L62 10 L55 15 L58 24 L50 19 L42 24 L45 15 L38 10 L47 10Z" fill={PAL.gold} {...OUTLINE} />
      <circle cx={50} cy={13} r={16} fill={PAL.goldLight} opacity={0.25} />
    </Lm>
  );
}

export const LANDMARK_ART: Record<string, ComponentType<LmProps>> = {
  'lm-treehouse': TreehouseArt,
  'lm-stone-bridge': StoneBridgeArt,
  'lm-windmill': WindmillArt,
  'lm-lighthouse': LighthouseArt,
  'lm-firefly-lamp': FireflyLampArt,
  'lm-cabin': CabinArt,
  'lm-swing-tree': SwingTreeArt,
  'lm-waterwheel': WaterwheelArt,
  'lm-sky-garden': SkyGardenArt,
  'lm-giant-mushroom': GiantMushroomArt,
  'lm-pavilion': PavilionArt,
  'lm-star-well': StarWellArt,
};
