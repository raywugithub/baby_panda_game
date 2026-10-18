import type { JSX } from 'preact';
import { ItemSvg, PAL, Rainbow, Sparkle } from './primitives';

// 牆紙與地板皆為 100×100 的花樣色塊，填滿整個方框。

/** 家裡本來就有的竹青色牆紙（預設）：淡綠底配細直紋。 */
export function WallDefault({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#CFE3C0" />
      {[12, 30, 48, 66, 84].map(x => <line key={x} x1={x} y1={0} x2={x} y2={100} stroke="#B7D4A6" stroke-width={3} />)}
    </ItemSvg>
  );
}

/** 竹影牆紙：竹竿與葉影。 */
export function WallBamboo({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#DDEBCF" />
      {[18, 56, 84].map(x => (
        <g key={x}>
          <rect x={x - 3} y={0} width={6} height={100} fill={PAL.bamboo} opacity={0.7} />
          <rect x={x - 3} y={24} width={6} height={2} fill={PAL.bambooDark} />
          <rect x={x - 3} y={62} width={6} height={2} fill={PAL.bambooDark} />
        </g>
      ))}
      <ellipse cx={36} cy={40} rx={14} ry={4} fill={PAL.bamboo} opacity={0.55} transform="rotate(-25 36 40)" />
      <ellipse cx={70} cy={76} rx={14} ry={4} fill={PAL.bamboo} opacity={0.55} transform="rotate(25 70 76)" />
    </ItemSvg>
  );
}

/** 雲朵牆紙：淡藍底配白雲。 */
export function WallCloud({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#DCEAF5" />
      <path d="M8 30 Q8 20 18 22 Q22 12 32 18 Q40 14 42 24 Q50 24 48 32 Q40 36 30 34 Q16 38 8 30Z" fill={PAL.white} />
      <path d="M52 70 Q52 60 62 62 Q66 52 76 58 Q84 54 86 64 Q94 64 92 72 Q84 76 74 74 Q60 78 52 70Z" fill={PAL.white} />
    </ItemSvg>
  );
}

/** 薄荷條紋：薄荷綠與奶白交替的直條紋。 */
export function WallStripe({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill={PAL.creamLight} />
      {[0, 2, 4, 6].map(i => <rect key={i} x={i * 16 + 8} y={0} width={8} height={100} fill="#BFE3D6" />)}
    </ItemSvg>
  );
}

/** 星空牆紙（閃亮）：深藍夜空配金色星點。 */
export function WallStarnight({ size }: { size: number }): JSX.Element {
  const stars: [number, number][] = [[14, 18], [42, 10], [70, 22], [88, 46], [24, 56], [56, 60], [80, 82], [12, 84], [46, 88]];
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill={PAL.navy} />
      {stars.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.6} fill={i % 2 ? PAL.gold : PAL.white} />)}
      <Sparkle x={62} y={36} r={3} />
    </ItemSvg>
  );
}

/** 彩虹牆紙（彩虹）：整面彩虹漸層。 */
export function WallRainbow({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="wall-rainbow" /></defs>
      <rect x={0} y={0} width={100} height={100} fill="url(#rb-wall-rainbow)" />
    </ItemSvg>
  );
}

/** 木紋地板（預設）：暖棕色木板。 */
export function FloorDefault({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#D9B98C" />
      {[25, 50, 75].map(y => <line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#BF9A6C" stroke-width={2} />)}
      <path d="M10 12 Q30 10 46 14 M60 62 Q80 60 92 64" fill="none" stroke="#BF9A6C" stroke-width={1.6} />
    </ItemSvg>
  );
}

/** 木板地：淺色長條木板與木紋。 */
export function FloorWood({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#E2C49A" />
      {[20, 40, 60, 80].map(y => <line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#B98F5E" stroke-width={2} />)}
      <path d="M8 30 Q30 28 50 32 M52 70 Q76 68 94 72" fill="none" stroke="#C9A36F" stroke-width={1.6} />
    </ItemSvg>
  );
}

/** 苔蘚石板：灰綠石磚，石縫中有小綠點。 */
export function FloorMoss({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#B9B7A6" />
      <path d="M0 50 H100 M50 0 V50 M25 50 V100 M75 50 V100" stroke="#9C9A88" stroke-width={3} />
      {[[14, 20], [36, 66], [62, 14], [84, 58], [70, 84], [20, 86]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={PAL.bamboo} />
      ))}
    </ItemSvg>
  );
}

/** 草蓆：淡綠色編織紋。 */
export function FloorTatami({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill="#D9E3B5" />
      {[0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5].map(v => (
        <g key={v}>
          <line x1={v * 1.0} y1={0} x2={v * 1.0} y2={100} stroke="#BCCB92" stroke-width={1.5} />
          <line x1={0} y1={v} x2={100} y2={v} stroke="#BCCB92" stroke-width={1.5} />
        </g>
      ))}
    </ItemSvg>
  );
}

/** 棉花地毯（閃亮）：奶白色毛茸茸的圓點。 */
export function FloorCotton({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={0} y={0} width={100} height={100} fill={PAL.creamLight} />
      {[[16, 16], [50, 14], [84, 18], [30, 48], [70, 50], [14, 80], [50, 82], [86, 78]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9} fill={PAL.white} stroke={PAL.cream} stroke-width={1.5} />
      ))}
      <Sparkle x={88} y={40} r={3} />
    </ItemSvg>
  );
}

/** 星砂地板（彩虹）：深藍底配彩虹色星砂。 */
export function FloorStarfield({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="floor-starfield" /></defs>
      <rect x={0} y={0} width={100} height={100} fill={PAL.navy} />
      {[[18, 22], [52, 16], [82, 30], [30, 56], [64, 62], [88, 84], [14, 86], [46, 90]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y - 2} L${x + 3} ${y + 1} L${x + 4} ${y + 5} L${x} ${y + 2} L${x - 4} ${y + 5} L${x - 3} ${y + 1} L${x - 6} ${y - 2} L${x - 2} ${y - 2}Z`} fill="url(#rb-floor-starfield)" />
      ))}
    </ItemSvg>
  );
}
