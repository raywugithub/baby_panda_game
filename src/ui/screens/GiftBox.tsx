import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameState } from '../../core/state';
import { openGiftBox, canOpen, GIFT_COST } from '../../core/giftbox';
import { mulberry32 } from '../../core/rng';
import { randomSeed } from '../../platform/clock';
import { game, commit } from '../store';
import { Opening, Reveal, type Phase, type OpenResult } from './giftbox/Opening';

const SHAKE_MS = 1200;

type Segment = 'box' | 'shop';
const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'box', label: '禮盒機' },
  { key: 'shop', label: '棉花糖小舖' },
];

/** 按鈕文字依序檢查：每日免費 → freeBoxes → 50 星砂。 */
function openLabel(s: GameState): string {
  if (!s.daily.freeBoxUsed) return '今日免費禮盒';
  if (s.freeBoxes > 0) return '用一個禮盒打開';
  if (s.starSand >= GIFT_COST) return `花 ${GIFT_COST} ⭐ 打開禮盒`;
  return '星砂還不夠，去冒險吧';
}

export function GiftBox() {
  const s = game.value;
  const [seg, setSeg] = useState<Segment>('box');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<OpenResult | null>(null);
  // 同步鎖：快速連點時 state 尚未重繪，以 ref 擋住重複開箱。
  const busy = useRef(false);

  useEffect(() => {
    if (phase !== 'shaking') return;
    const t = setTimeout(() => setPhase('reveal'), SHAKE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  function onOpen() {
    if (busy.current || phase !== 'idle' || !canOpen(game.value)) return;
    busy.current = true;
    const out = openGiftBox(game.value, mulberry32(randomSeed()));
    commit(out);
    setResult({ itemId: out.itemId, duplicate: out.duplicate });
    setPhase('shaking');
  }

  function onAck() {
    if (phase !== 'reveal') return;
    busy.current = false;
    setResult(null);
    setPhase('idle');
  }

  return (
    <div class="giftbox">
      <div class="giftbox-segments" role="group" aria-label="禮盒分段">
        {SEGMENTS.map((x) => (
          <button type="button" key={x.key} aria-pressed={seg === x.key} onClick={() => setSeg(x.key)}>
            {x.label}
          </button>
        ))}
      </div>
      {seg === 'box' ? (
        <div class="giftbox-machine">
          <Opening s={s} phase={phase} />
          {phase === 'reveal' && result ? (
            <Reveal result={result} onAck={onAck} />
          ) : (
            <>
              <p class="giftbox-rates">普通 75%｜✨ 閃亮 22%｜🌈 彩虹 3%</p>
              <button
                type="button"
                class="giftbox-open"
                data-testid="giftbox-open"
                disabled={phase !== 'idle' || !canOpen(s)}
                onClick={onOpen}
              >
                {openLabel(s)}
              </button>
            </>
          )}
        </div>
      ) : (
        <p class="giftbox-soon">即將推出</p>
      )}
    </div>
  );
}
