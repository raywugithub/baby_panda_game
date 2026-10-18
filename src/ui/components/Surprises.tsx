import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { game, commit } from '../store';
import { recordPoke } from '../../core/surprises';
import { now } from '../../platform/clock';

const BUSY_MS = 2000;

interface Props {
  onBusy?: () => void;
  children?: ComponentChildren;
}

/** 包住熊貓的戳戳區：3 秒內戳 8 下顯示「假裝很忙」，並通知呼叫端切換姿勢。 */
export function PandaTapZone({ onBusy, children }: Props) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setBusy(false), BUSY_MS);
    return () => clearTimeout(t);
  }, [busy]);

  function onPointerDown() {
    const cur = game.value;
    const r = recordPoke(cur.pokeLog, now());
    commit({ ...cur, pokeLog: r.pokeLog });
    if (r.trigger) {
      setBusy(true);
      onBusy?.();
    }
  }

  return (
    <div class="panda-tap-zone" data-testid="panda-tap-zone" onPointerDown={onPointerDown}>
      {children}
      {busy ? <p class="surprise-msg" role="status">假裝很忙，拿出一本書擋住臉</p> : null}
    </div>
  );
}
