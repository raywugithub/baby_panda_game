import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE, Rainbow } from './primitives';

// 貼紙（sticker-01…24）與相框（frame-01…06）。貼紙不含底色；相框中央挖空，照片會透出來。
// 貼紙順序與 content/items/collectibles.ts 的 STICKER_NAMES 相同。

const HEART = 'M50 86 C22 66 12 48 18 36 C24 22 42 22 50 34 C58 22 76 22 82 36 C88 48 78 66 50 86Z';

export function StickerStar({ size }: { size: number }): JSX.Element {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 40 : 18;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(52 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <ItemSvg size={size}><polygon points={pts} fill={PAL.gold} {...OUTLINE} /></ItemSvg>;
}

export function StickerHeart({ size }: { size: number }): JSX.Element {
  return <ItemSvg size={size}><path d={HEART} fill={PAL.pinkDeep} {...OUTLINE} /></ItemSvg>;
}

export function StickerBamboo({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M20 84 Q18 40 80 14 Q72 62 20 84Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M30 70 Q46 52 66 36" fill="none" stroke={PAL.bambooDark} stroke-width={2} />
    </ItemSvg>
  );
}

export function StickerCloud({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M22 74 Q8 74 12 60 Q16 48 30 52 Q32 30 52 32 Q70 32 72 50 Q88 46 90 62 Q92 74 76 74Z" fill={PAL.white} {...OUTLINE} />
    </ItemSvg>
  );
}

export function StickerMoon({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M62 14 Q26 22 28 54 Q32 84 66 86 Q42 74 42 52 Q42 28 62 14Z" fill={PAL.gold} {...OUTLINE} />
    </ItemSvg>
  );
}

export function StickerMushroom({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M12 52 Q12 18 50 18 Q88 18 88 52 Q50 60 12 52Z" fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={38} y={52} width={24} height={34} rx={8} fill={PAL.creamLight} {...OUTLINE} />
      <circle cx={30} cy={36} r={5} fill={PAL.white} />
      <circle cx={68} cy={40} r={4} fill={PAL.white} />
    </ItemSvg>
  );
}

export function StickerSnowflake({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <g transform="translate(50 50)" stroke={PAL.navyLight} stroke-width={5} stroke-linecap="round">
        {[0, 60, 120].map(a => <line key={a} x1={0} y1={-38} x2={0} y2={38} transform={`rotate(${a})`} />)}
      </g>
    </ItemSvg>
  );
}

export function StickerFlower({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      {[0, 72, 144, 216, 288].map(a => (
        <circle key={a} cx={50 + 24 * Math.cos((a - 90) * Math.PI / 180)} cy={50 + 24 * Math.sin((a - 90) * Math.PI / 180)} r={16} fill={PAL.pink} {...OUTLINE} stroke-width={2} />
      ))}
      <circle cx={50} cy={50} r={12} fill={PAL.gold} {...OUTLINE} stroke-width={2} />
    </ItemSvg>
  );
}

export function StickerCrown({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M14 66 L10 30 L34 48 L50 18 L66 48 L90 30 L86 66Z" fill={PAL.gold} {...OUTLINE} />
      <rect x={14} y={64} width={72} height={14} rx={4} fill={PAL.gold} {...OUTLINE} />
      <circle cx={50} cy={70} r={4} fill={PAL.pinkDeep} />
    </ItemSvg>
  );
}

export function StickerBow({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 50 C36 26 8 22 10 46 C12 66 36 62 50 50Z" fill={PAL.pink} {...OUTLINE} />
      <path d="M50 50 C64 26 92 22 90 46 C88 66 64 62 50 50Z" fill={PAL.pink} {...OUTLINE} />
      <circle cx={50} cy={50} r={8} fill={PAL.pinkDeep} {...OUTLINE} />
    </ItemSvg>
  );
}

export function StickerBubble({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={38} cy={58} r={24} fill={PAL.water} opacity={0.6} {...OUTLINE} />
      <circle cx={68} cy={30} r={14} fill={PAL.water} opacity={0.6} {...OUTLINE} />
      <circle cx={32} cy={50} r={5} fill={PAL.white} />
    </ItemSvg>
  );
}

export function StickerRainbow({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M8 74 A42 42 0 0 1 92 74" fill="none" stroke={PAL.pinkDeep} stroke-width={10} />
      <path d="M18 74 A32 32 0 0 1 82 74" fill="none" stroke={PAL.gold} stroke-width={10} />
      <path d="M28 74 A22 22 0 0 1 72 74" fill="none" stroke={PAL.bamboo} stroke-width={10} />
      <path d="M8 74 A42 42 0 0 1 92 74 M28 74 A22 22 0 0 1 72 74" fill="none" stroke={PAL.brown} stroke-width={1.5} />
    </ItemSvg>
  );
}

export function StickerFish({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M18 50 Q18 30 50 30 Q80 30 84 50 Q80 70 50 70 Q18 70 18 50Z" fill={PAL.water} {...OUTLINE} />
      <path d="M80 50 L96 34 L94 66Z" fill={PAL.water} {...OUTLINE} />
      <circle cx={34} cy={46} r={3} fill={PAL.brown} />
    </ItemSvg>
  );
}

export function StickerShell({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 22 C26 26 16 50 22 72 Q50 92 78 72 C84 50 74 26 50 22Z" fill={PAL.creamLight} {...OUTLINE} />
      <path d="M50 26 V82 M50 26 L30 78 M50 26 L70 78" fill="none" stroke={PAL.pinkDeep} stroke-width={2} />
    </ItemSvg>
  );
}

export function StickerHeartEyes({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d={HEART} fill={PAL.pink} {...OUTLINE} />
      <circle cx={38} cy={48} r={4} fill={PAL.brown} />
      <circle cx={62} cy={48} r={4} fill={PAL.brown} />
      <path d="M42 62 Q50 68 58 62" fill="none" {...OUTLINE} stroke-width={2} />
    </ItemSvg>
  );
}

export function StickerExclaim({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={50} cy={50} r={40} fill={PAL.strawberry} {...OUTLINE} />
      <rect x={44} y={22} width={12} height={42} rx={6} fill={PAL.white} />
      <circle cx={50} cy={76} r={6.5} fill={PAL.white} />
    </ItemSvg>
  );
}

export function StickerNote({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M38 18 L76 10 V64" fill="none" {...OUTLINE} stroke-width={4} />
      <ellipse cx={28} cy={70} rx={14} ry={10} fill={PAL.navy} {...OUTLINE} transform="rotate(-20 28 70)" />
      <ellipse cx={66} cy={64} rx={14} ry={10} fill={PAL.navy} {...OUTLINE} transform="rotate(-20 66 64)" />
    </ItemSvg>
  );
}

export function StickerSun({ size }: { size: number }): JSX.Element {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <ItemSvg size={size}>
      {rays.map(a => (
        <line key={a} x1={50} y1={6} x2={50} y2={18} transform={`rotate(${a} 50 50)`} stroke={PAL.gold} stroke-width={5} stroke-linecap="round" />
      ))}
      <circle cx={50} cy={50} r={26} fill={PAL.gold} {...OUTLINE} />
      <circle cx={42} cy={46} r={3} fill={PAL.brown} />
      <circle cx={58} cy={46} r={3} fill={PAL.brown} />
    </ItemSvg>
  );
}

export function StickerBolt({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M58 6 L24 56 H48 L40 94 L78 40 H54 Z" fill={PAL.gold} {...OUTLINE} />
    </ItemSvg>
  );
}

export function StickerPaw({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <ellipse cx={50} cy={62} rx={20} ry={16} fill={PAL.brownLight} {...OUTLINE} />
      <circle cx={28} cy={38} r={8} fill={PAL.brownLight} {...OUTLINE} />
      <circle cx={44} cy={28} r={8} fill={PAL.brownLight} {...OUTLINE} />
      <circle cx={60} cy={28} r={8} fill={PAL.brownLight} {...OUTLINE} />
      <circle cx={74} cy={38} r={8} fill={PAL.brownLight} {...OUTLINE} />
    </ItemSvg>
  );
}

export function StickerShoot({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 8 Q70 40 66 80 Q50 92 34 80 Q30 40 50 8Z" fill={PAL.bamboo} {...OUTLINE} />
      <path d="M34 62 L44 56 M66 56 L56 52" fill="none" stroke={PAL.brownLight} stroke-width={3} stroke-linecap="round" />
    </ItemSvg>
  );
}

export function StickerStrawberry({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M50 88 C24 72 14 52 18 38 C22 24 40 22 50 32 C60 22 78 24 82 38 C86 52 76 72 50 88Z" fill={PAL.strawberry} {...OUTLINE} />
      <path d="M36 22 L44 30 L50 24 L56 30 L64 22 L60 34 L40 34Z" fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      <circle cx={38} cy={50} r={2} fill={PAL.goldLight} />
      <circle cx={62} cy={50} r={2} fill={PAL.goldLight} />
    </ItemSvg>
  );
}

export function StickerMarshmallow({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <circle cx={36} cy={40} r={20} fill={PAL.white} {...OUTLINE} />
      <circle cx={62} cy={36} r={18} fill={PAL.pink} {...OUTLINE} />
      <circle cx={50} cy={64} r={18} fill={PAL.white} {...OUTLINE} />
    </ItemSvg>
  );
}

export function StickerGift({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={16} y={40} width={68} height={46} rx={4} fill={PAL.pink} {...OUTLINE} />
      <rect x={14} y={30} width={72} height={14} rx={4} fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={44} y={30} width={12} height={56} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <path d="M50 30 Q34 10 26 22 Q32 30 50 30 Q68 10 74 22 Q68 30 50 30Z" fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
    </ItemSvg>
  );
}

// 相框：外框與中央挖空（evenodd），中央透明讓照片透出。
const FRAME_HOLE = 'M4 4 H96 V96 H4Z M16 16 V84 H84 V16Z';

export function FrameBamboo({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d={FRAME_HOLE} fill={PAL.bamboo} fill-rule="evenodd" {...OUTLINE} />
      {[[10, 10], [90, 10], [10, 90], [90, 90]].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={7} ry={3.5} fill={PAL.bambooDark} transform={`rotate(${x < 50 ? 45 : -45} ${x} ${y})`} />
      ))}
    </ItemSvg>
  );
}

export function FrameCloud({ size }: { size: number }): JSX.Element {
  const bumps = [14, 34, 54, 74, 90];
  return (
    <ItemSvg size={size}>
      <path d={FRAME_HOLE} fill="#DCEAF5" fill-rule="evenodd" {...OUTLINE} />
      {bumps.map(x => <circle key={`t${x}`} cx={x} cy={6} r={6} fill={PAL.white} />)}
      {bumps.map(x => <circle key={`b${x}`} cx={x} cy={94} r={6} fill={PAL.white} />)}
    </ItemSvg>
  );
}

export function FrameStarNight({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d={FRAME_HOLE} fill={PAL.navy} fill-rule="evenodd" {...OUTLINE} />
      {[[24, 8], [72, 6], [92, 30], [6, 60], [94, 70], [28, 94], [70, 92]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 2 : 2.8} fill={i % 2 ? PAL.gold : PAL.white} />
      ))}
    </ItemSvg>
  );
}

export function FrameRainbow({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="frame-rainbow" /></defs>
      <path d={FRAME_HOLE} fill="url(#rb-frame-rainbow)" fill-rule="evenodd" {...OUTLINE} />
    </ItemSvg>
  );
}

export function FrameMushroom({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d={FRAME_HOLE} fill={PAL.pink} fill-rule="evenodd" {...OUTLINE} />
      {[[8, 8], [92, 8], [8, 92], [92, 92]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <path d={`M${x - 7} ${y} Q${x - 7} ${y - 8} ${x} ${y - 8} Q${x + 7} ${y - 8} ${x + 7} ${y} Z`} fill={PAL.pinkDeep} {...OUTLINE} stroke-width={1.5} />
          <rect x={x - 2} y={y} width={4} height={5} fill={PAL.creamLight} />
        </g>
      ))}
      {[30, 50, 70].map(x => <circle key={x} cx={x} cy={4} r={1.8} fill={PAL.white} />)}
    </ItemSvg>
  );
}

export function FrameGold({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d={FRAME_HOLE} fill={PAL.gold} fill-rule="evenodd" {...OUTLINE} />
      <rect x={14} y={14} width={72} height={72} fill="none" stroke={PAL.goldLight} stroke-width={2} />
      <circle cx={4} cy={4} r={4} fill={PAL.goldLight} />
      <circle cx={96} cy={4} r={4} fill={PAL.goldLight} />
      <circle cx={4} cy={96} r={4} fill={PAL.goldLight} />
      <circle cx={96} cy={96} r={4} fill={PAL.goldLight} />
    </ItemSvg>
  );
}
