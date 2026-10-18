// 共用圖樣：同一個主題（竹筍、草莓、蘑菇、貝殼、星星）在貼紙、食材、墜飾、衣物之間共用同一組路徑，
// 避免各檔案複製貼上同一段 path data。各檔案只負責自己的額外細節（種子、斑點、肋紋等）。

import type { JSX } from 'preact';
import { OUTLINE } from './primitives';

/** 竹筍外形（貼紙與食材共用）。 */
export const SHOOT_PATH = 'M50 8 Q70 40 66 80 Q50 92 34 80 Q30 40 50 8Z';

/** 草莓外形與頂端葉片（貼紙與食材共用）。 */
export const STRAWBERRY_PATH = 'M50 88 C24 72 14 52 18 38 C22 24 40 22 50 32 C60 22 78 24 82 38 C86 52 76 72 50 88Z';
export const STRAWBERRY_LEAF_PATH = 'M36 22 L44 30 L50 24 L56 30 L64 22 L60 34 L40 34Z';

/** 蘑菇傘蓋與菇柄（貼紙與食材共用）。 */
export const MUSHROOM_CAP_PATH = 'M12 52 Q12 18 50 18 Q88 18 88 52 Q50 60 12 52Z';
export const MUSHROOM_STEM = { x: 38, y: 52, width: 24, height: 34, rx: 8 } as const;

/** 貝殼外形與基本肋紋（貼紙與墜飾共用；墜飾會加上額外肋紋）。 */
export const SHELL_PATH = 'M50 22 C26 26 16 50 22 72 Q50 92 78 72 C84 50 74 26 50 22Z';
export const SHELL_RIBS_PATH = 'M50 26 V82 M50 26 L30 78 M50 26 L70 78';

/** 五角星頂點字串；outer / inner 為外圈與內圈半徑，中心為 (cx, cy)。 */
export function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** 蘑菇本體（傘蓋＋菇柄）的 SVG 片段，供貼紙與食材共用。 */
export function MushroomBody({ cap, stem }: { cap: string; stem: string }): JSX.Element {
  return (
    <>
      <path d={MUSHROOM_CAP_PATH} fill={cap} {...OUTLINE} />
      <rect {...MUSHROOM_STEM} fill={stem} {...OUTLINE} />
    </>
  );
}
