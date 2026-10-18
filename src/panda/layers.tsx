import type { ComponentType, JSX } from 'preact';
import type { Outfit, OutfitSlot } from '../core/state';
import { ITEM_ART } from '../art/items';

/** 錨點（viewBox 0 0 200 240，依身形量測；縮放與姿勢前的座標）。 */
export const ANCHORS: Record<OutfitSlot | 'pendant', { x: number; y: number }> = {
  head: { x: 100, y: 46 },
  face: { x: 100, y: 100 },
  body: { x: 100, y: 170 },
  hand: { x: 136, y: 196 },
  tail: { x: 156, y: 198 },
  pendant: { x: 100, y: 150 },
};

const SLOT_SIZE: Record<OutfitSlot, number> = { head: 64, face: 56, body: 84, hand: 36, tail: 36 };
const PENDANT_SIZE = 26;
const PENDANT_SPACING = 26;

function artFor(id: string | undefined): ComponentType<{ size: number }> | undefined {
  if (!id || !Object.prototype.hasOwnProperty.call(ITEM_ART, id)) return undefined;
  return ITEM_ART[id];
}

/** 衣物與墜飾圖層：找不到圖的 id 直接略過。 */
export function OutfitLayers({ outfit, pendants }: { outfit: Outfit; pendants: string[] }): JSX.Element {
  const slotNodes = (Object.keys(SLOT_SIZE) as OutfitSlot[]).flatMap((slot) => {
    const Art = artFor(outfit[slot]);
    if (!Art) return [];
    const a = ANCHORS[slot];
    return [
      <g key={slot} data-part={`outfit-${slot}`} transform={`translate(${a.x} ${a.y})`}>
        <Art size={SLOT_SIZE[slot]} />
      </g>,
    ];
  });

  const shown = pendants.filter((id) => artFor(id));
  const pendantNodes = shown.map((id, i) => {
    const a = ANCHORS.pendant;
    const x = a.x + (i - (shown.length - 1) / 2) * PENDANT_SPACING;
    const Art = artFor(id)!;
    return (
      <g key={id} data-part={`pendant-${id}`} transform={`translate(${x} ${a.y})`}>
        <Art size={PENDANT_SIZE} />
      </g>
    );
  });

  return (
    <>
      {slotNodes}
      {pendantNodes}
    </>
  );
}
