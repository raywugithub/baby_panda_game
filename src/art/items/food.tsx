import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE, Sparkle } from './primitives';
import { MushroomBody, SHOOT_PATH, STRAWBERRY_LEAF_PATH, STRAWBERRY_PATH } from './motifs';

// 食材圖示：食材不算重複，依 ing-* id 登記；畫在 100×100 方框中央。

/** 竹筍：淡綠色的筍尖與褐色外殼片。 */
export function BambooShoot({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d={SHOOT_PATH} fill={PAL.bamboo} {...OUTLINE} />
      <path d="M34 62 L44 56 M66 56 L56 52 M40 80 L50 74 M60 74 L68 68" fill="none" stroke={PAL.brownLight} stroke-width={3} stroke-linecap="round" />
      <path d="M50 8 Q56 2 60 8" fill="none" {...OUTLINE} stroke-width={2} />
    </ItemSvg>
  );
}

/** 草莓：紅色心形果實配金黃色的種子。 */
export function Strawberry({ size }: { size: number }): JSX.Element {
  const seeds: [number, number][] = [[38, 40], [62, 40], [50, 52], [36, 60], [64, 60], [50, 70]];
  return (
    <ItemSvg size={size}>
      <path d={STRAWBERRY_PATH} fill={PAL.strawberry} {...OUTLINE} />
      <path d={STRAWBERRY_LEAF_PATH} fill={PAL.bamboo} {...OUTLINE} stroke-width={1.8} />
      {seeds.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={1.8} ry={2.6} fill={PAL.goldLight} />)}
    </ItemSvg>
  );
}

/** 米粉：白色小碗裝著蓬鬆的米粉。 */
export function RiceFlour({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <path d="M14 52 H86 Q84 84 50 86 Q16 84 14 52Z" fill={PAL.terracotta} {...OUTLINE} />
      <path d="M18 50 Q30 22 46 38 Q52 18 66 36 Q80 26 84 50 Z" fill={PAL.white} {...OUTLINE} stroke-width={2} />
      <path d="M30 46 Q36 38 42 46 M54 44 Q60 36 68 44" fill="none" stroke={PAL.cream} stroke-width={2.5} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 紅豆：紅豆沙裝在碗裡，表面有一顆顆紅豆。 */
export function RedBean({ size }: { size: number }): JSX.Element {
  const beans: [number, number][] = [[32, 44], [46, 40], [60, 44], [72, 52], [40, 56], [54, 58], [28, 62], [66, 66]];
  return (
    <ItemSvg size={size}>
      <path d="M12 50 H88 Q86 84 50 86 Q14 84 12 50Z" fill={PAL.creamLight} {...OUTLINE} />
      <ellipse cx={50} cy={50} rx={38} ry={10} fill={PAL.strawberry} {...OUTLINE} stroke-width={2} />
      {beans.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={4} ry={3} fill={PAL.brown} />)}
    </ItemSvg>
  );
}

/** 蜂蜜（閃亮）：金色的蜂蜜罐，罐口有蜜滴。 */
export function Honey({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <rect x={34} y={12} width={32} height={12} rx={3} fill={PAL.brownLight} {...OUTLINE} />
      <path d="M26 30 H74 Q82 30 82 40 V80 Q82 90 72 90 H28 Q18 90 18 80 V40 Q18 30 26 30Z" fill={PAL.gold} {...OUTLINE} />
      <path d="M26 46 H74" stroke={PAL.goldLight} stroke-width={3} />
      <rect x={28} y={54} width={44} height={20} rx={4} fill={PAL.creamLight} {...OUTLINE} stroke-width={1.8} />
      <path d="M66 24 Q66 34 62 34" fill="none" stroke={PAL.gold} stroke-width={3} stroke-linecap="round" />
      <Sparkle x={86} y={22} />
    </ItemSvg>
  );
}

/** 蘑菇（閃亮）：棕粉色的傘蓋與白色的菇柄。 */
export function Mushroom({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <MushroomBody cap={PAL.pinkDeep} stem={PAL.creamLight} />
      <circle cx={30} cy={36} r={5} fill={PAL.white} />
      <circle cx={56} cy={30} r={4} fill={PAL.white} />
      <circle cx={70} cy={44} r={4.5} fill={PAL.white} />
      <Sparkle x={86} y={18} />
    </ItemSvg>
  );
}
