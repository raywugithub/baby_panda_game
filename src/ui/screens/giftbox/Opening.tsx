import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { GameState, Rarity } from '../../../core/state';
import { currentStage } from '../../../core/growth';
import { idlePoseFor } from '../../../core/mood';
import { MARSHMALLOW_FOR_DUPLICATE } from '../../../core/giftbox';
import { getItem } from '../../../core/catalog';
import { Panda, type PandaPose } from '../../../panda/Panda';
import { ITEM_ART } from '../../../art/items';
import { PAL, OUTLINE } from '../../../art/items/primitives';
import { burst } from '../../../platform/particles';

export type Phase = 'idle' | 'shaking' | 'reveal';
export interface OpenResult { itemId: string; duplicate: boolean }

const RARITY_LABEL: Record<Rarity, string> = {
  common: '普通',
  shiny: '✨ 閃亮',
  rainbow: '🌈 彩虹',
};

/** 娃娃風禮盒：粉色盒身、金色緞帶與蝴蝶結，與物品插圖共用描邊。 */
function GiftBoxArt({ size }: { size: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="禮盒">
      <rect x={18} y={46} width={64} height={44} rx={6} fill={PAL.pink} {...OUTLINE} />
      <rect x={45} y={46} width={10} height={44} fill={PAL.gold} />
      <rect x={12} y={34} width={76} height={16} rx={5} fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={45} y={34} width={10} height={16} fill={PAL.gold} />
      <ellipse cx={38} cy={28} rx={11} ry={8} fill={PAL.gold} {...OUTLINE} stroke-width={2} />
      <ellipse cx={62} cy={28} rx={11} ry={8} fill={PAL.gold} {...OUTLINE} stroke-width={2} />
      <circle cx={50} cy={31} r={5} fill={PAL.goldLight} {...OUTLINE} stroke-width={2} />
    </svg>
  );
}

interface StageProps {
  s: GameState;
  phase: Phase;
}

/** 開箱舞台：熊貓搖盒子、探頭；揭曉時物品卡在下方顯示。 */
export function Opening({ s, phase }: StageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== 'reveal' || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    burst('stars', r.left + r.width / 2, r.top + r.height / 3);
  }, [phase]);

  const pose: PandaPose =
    phase === 'shaking' ? 'shakeBox' : phase === 'reveal' ? 'boxPeek' : (idlePoseFor('normal') as PandaPose);

  return (
    <div class="giftbox-stage" ref={stageRef}>
      <Panda
        pose={pose}
        stage={currentStage(s)}
        outfit={s.equipped.outfit}
        pendants={s.equipped.pendants}
        chainLinks={s.chainLinks}
        size={200}
      />
      <div class={`giftbox-box${phase === 'shaking' ? ' is-shaking' : ''}`}>
        <GiftBoxArt size={112} />
      </div>
    </div>
  );
}

interface RevealProps {
  result: OpenResult;
  onAck: () => void;
}

/** 揭曉卡：物品插圖、名稱、稀有度與是否重複。 */
export function Reveal({ result, onAck }: RevealProps) {
  const item = getItem(result.itemId);
  const Art = ITEM_ART[item.id] as (typeof ITEM_ART)[string] | undefined;
  return (
    <div class="giftbox-reveal">
      {Art ? <Art size={96} /> : null}
      <div class="giftbox-name">{item.name}</div>
      <div class="giftbox-rarity">{RARITY_LABEL[item.rarity]}</div>
      <div class="giftbox-status">
        {result.duplicate ? `已經有了！換成 ${MARSHMALLOW_FOR_DUPLICATE[item.rarity]} 🍡` : '新收藏！'}
      </div>
      <button type="button" class="giftbox-ack" onClick={onAck}>好耶</button>
    </div>
  );
}
