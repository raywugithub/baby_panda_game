import type { JSX } from 'preact';
import type { Outfit, OutfitSlot } from '../core/state';
import { POSE_TABLE, type PandaPose, type PartMove } from './poses';
import {
  PIVOTS, BodyShape, Strap, Tail, Leg, Arm, Ear, HeadShape, Eye, Cheek, Nose, Mouth, Nightcap,
} from './parts';

export type { PandaPose } from './poses';

export interface PandaProps {
  pose: PandaPose;
  stage: number;
  outfit: Outfit;
  pendants: string[];
  chainLinks: number;
  size?: number;
  onPokeArea?: (area: 'body' | 'arms' | 'collar' | 'mouth') => void;
}

/** 占位座標（viewBox 0 0 200 240）；Task 21 會依最終形狀修正。 */
export const ANCHORS: Record<OutfitSlot | 'pendant', { x: number; y: number }> = {
  head: { x: 100, y: 50 },
  face: { x: 100, y: 70 },
  body: { x: 100, y: 140 },
  hand: { x: 150, y: 150 },
  tail: { x: 170, y: 200 },
  pendant: { x: 100, y: 110 },
};

type Area = 'body' | 'arms' | 'collar' | 'mouth';

function areaOf(part: string | null): Area {
  if (part === 'armL' || part === 'armR') return 'arms';
  if (part === 'mouth') return 'mouth';
  if (part === 'collar') return 'collar';
  return 'body';
}

/** 依部件移動量產生 transform：先位移，再以部件中心為軸旋轉。 */
function moveTransform(m: PartMove | undefined, [px, py]: readonly [number, number]): string {
  return `translate(${m?.dx ?? 0} ${m?.dy ?? 0}) rotate(${m?.rot ?? 0} ${px} ${py})`;
}

export function Panda({ pose, size = 240, onPokeArea }: PandaProps): JSX.Element {
  const spec = POSE_TABLE[pose];
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size}
      data-pose={pose}
      role="img"
      aria-label="熊貓"
      onPointerDown={(e) => {
        const target = e.target as Element | null;
        const part = target?.closest?.('[data-part]')?.getAttribute('data-part') ?? null;
        onPokeArea?.(areaOf(part));
      }}
    >
      <g data-part="body" data-testid="panda-body" transform={moveTransform(spec.body, PIVOTS.body)}>
        <Tail transform={moveTransform(spec.tail, PIVOTS.tail)} />
        <Leg side="L" transform={moveTransform(spec.legL, PIVOTS.legL)} />
        <Leg side="R" transform={moveTransform(spec.legR, PIVOTS.legR)} />
        <BodyShape />
        <Strap />
        <Arm side="L" transform={moveTransform(spec.armL, PIVOTS.armL)} />
        <Arm side="R" transform={moveTransform(spec.armR, PIVOTS.armR)} />
        <g data-part="head" transform={moveTransform(spec.head, PIVOTS.head)}>
          <Ear side="L" />
          <Ear side="R" />
          <HeadShape />
          <Eye side="L" state={spec.eyes} />
          <Eye side="R" state={spec.eyes} />
          <Cheek side="L" on={spec.cheeks} />
          <Cheek side="R" on={spec.cheeks} />
          <Nose />
          <Mouth kind={spec.mouth} />
          {spec.nightcap ? <Nightcap /> : null}
        </g>
      </g>
    </svg>
  );
}
