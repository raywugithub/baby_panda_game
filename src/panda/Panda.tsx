import type { JSX } from 'preact';
import type { Outfit } from '../core/state';
import { scaleForStage, shineTier, chainThickness } from '../core/growth';
import { POSE_TABLE, type PandaPose, type PartMove } from './poses';
import {
  PIVOTS, HEAD, BodyShape, Strap, Tail, Leg, Arm, Ear, HeadShape, Muzzle, Eye, Cheek, Nose, Mouth, Nightcap,
} from './parts';
import { Halo, FurShine, ShineDefs } from './shine';
import { Collar } from './collar';
import { OutfitLayers } from './layers';

export type { PandaPose } from './poses';
export { ANCHORS } from './layers';

export interface PandaProps {
  pose: PandaPose;
  stage: number;
  outfit: Outfit;
  pendants: string[];
  chainLinks: number;
  size?: number;
  onPokeArea?: (area: 'body' | 'arms' | 'collar' | 'mouth') => void;
}

type Area = 'body' | 'arms' | 'collar' | 'mouth';

function areaOf(part: string | null): Area {
  if (part === 'armL' || part === 'armR') return 'arms';
  if (part === 'mouth') return 'mouth';
  if (part === 'collar' || part === 'link' || part === 'link-count') return 'collar';
  return 'body';
}

/** 依部件移動量產生 transform：先位移，再以部件中心為軸旋轉。 */
function moveTransform(m: PartMove | undefined, [px, py]: readonly [number, number]): string {
  const base = `translate(${m?.dx ?? 0} ${m?.dy ?? 0}) rotate(${m?.rot ?? 0} ${px} ${py})`;
  if (m?.sx === undefined && m?.sy === undefined) return base;
  return `${base} translate(${px} ${py}) scale(${m?.sx ?? 1} ${m?.sy ?? 1}) translate(${-px} ${-py})`;
}

/** 嬰兒圓頭：階段 1 為 1.15，每升一階少 0.05，階段 4 起為 1。 */
function babyHeadScale(stage: number): number {
  return stage <= 4 ? Number((1.15 - 0.05 * (stage - 1)).toFixed(2)) : 1;
}

export function Panda({ pose, stage, outfit, pendants, chainLinks, size = 240, onPokeArea }: PandaProps): JSX.Element {
  const spec = POSE_TABLE[pose];
  const tier = shineTier(stage);
  const headS = babyHeadScale(stage);
  const [hx, hy] = PIVOTS.head;
  const rootScale = scaleForStage(stage);
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
      <ShineDefs />
      <g data-part="root" transform={`translate(100 240) scale(${rootScale}) translate(-100 -240)`}>
        {tier >= 1 ? <Halo tier={tier} /> : null}
        <g data-part="body" data-testid="panda-body" transform={moveTransform(spec.body, PIVOTS.body)}>
          <Tail transform={moveTransform(spec.tail, PIVOTS.tail)} />
          <Leg side="L" transform={moveTransform(spec.legL, PIVOTS.legL)} />
          <Leg side="R" transform={moveTransform(spec.legR, PIVOTS.legR)} />
          <BodyShape />
          <FurShine tier={tier} cx={100} cy={165} rx={48} ry={50} />
          <Strap />
          <Arm side="L" transform={moveTransform(spec.armL, PIVOTS.armL)} />
          <Arm side="R" transform={moveTransform(spec.armR, PIVOTS.armR)} />
          <g data-part="head" transform={moveTransform(spec.head, PIVOTS.head)}>
            <g transform={`translate(${hx} ${hy}) scale(${headS}) translate(${-hx} ${-hy})`}>
              <Ear side="L" />
              <Ear side="R" />
              <HeadShape />
              <FurShine tier={tier} cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
              <Muzzle />
              <Eye side="L" state={spec.eyes} />
              <Eye side="R" state={spec.eyes} />
              <Cheek side="L" on={spec.cheeks} />
              <Cheek side="R" on={spec.cheeks} />
              <Nose />
              <Mouth kind={spec.mouth} />
              {spec.nightcap ? <Nightcap /> : null}
            </g>
          </g>
          <Collar links={chainLinks} thickness={chainThickness(chainLinks)} />
        </g>
        <OutfitLayers outfit={outfit} pendants={pendants} />
      </g>
    </svg>
  );
}
