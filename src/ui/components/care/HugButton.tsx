import { useEffect, useState } from 'preact/hooks';
import { game, commit } from '../../store';
import { care, isEffective } from '../../../core/care';
import { now } from '../../../platform/clock';
import { burst } from '../../../platform/particles';

const SHY_MS = 600;

/** 抱抱：有效時加心情並噴愛心；無效（每小時上限）只播放害羞動畫，不改狀態。 */
export function HugButton({ onHug }: { onHug?: () => void } = {}) {
  const [shy, setShy] = useState(false);

  useEffect(() => {
    if (!shy) return;
    const t = setTimeout(() => setShy(false), SHY_MS);
    return () => clearTimeout(t);
  }, [shy]);

  function onClick(e: MouseEvent) {
    const t = now();
    onHug?.();
    if (!isEffective(game.value, 'hug', t)) {
      setShy(true);
      return;
    }
    commit(care(game.value, 'hug', t));
    const r = (document.querySelector('.home-panda') ?? e.currentTarget as HTMLElement).getBoundingClientRect();
    burst('hearts', r.left + r.width / 2, r.top + r.height / 3);
  }

  return (
    <button
      type="button"
      aria-label="抱抱"
      data-testid="care-hug"
      class={shy ? 'shy-bounce' : undefined}
      onClick={onClick}
    >
      🤗 抱抱
    </button>
  );
}
