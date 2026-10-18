import { useEffect, useRef, useState } from 'preact/hooks';
import { eventQueue } from '../store';
import type { GameEvent } from '../../core/events';
import { RECIPES } from '../../content/recipes';

const SHOW_MS = 2500;
const TOASTABLE = new Set<GameEvent['type']>(['reward', 'markUp', 'stageUp', 'slotUnlocked', 'recipeDiscovered']);

function isToastable(e: GameEvent): boolean {
  return TOASTABLE.has(e.type);
}

/** 正數加「+」置前；負數不加號，改為「名稱 -N」（例：元氣 -25）。 */
function amount(value: number, label: string): string {
  return value > 0 ? `+${value} ${label}` : `${label} ${value}`;
}

function textsOf(e: GameEvent): string[] {
  switch (e.type) {
    case 'reward': {
      const out: string[] = [];
      if (e.starSand !== 0) out.push(amount(e.starSand, '星砂'));
      if (e.energy !== 0) out.push(amount(e.energy, '元氣'));
      return out;
    }
    case 'markUp':
      return ['成長刻度 +1'];
    case 'stageUp':
      return [`升上階段 ${e.stage}：${e.title}`];
    case 'slotUnlocked':
      return ['項圈多了一個墜飾欄位！'];
    case 'recipeDiscovered':
      return [`新食譜：${RECIPES.find((r) => r.id === e.recipeId)?.name ?? e.recipeId}`];
    default:
      return [];
  }
}

interface Toast { id: number; text: string }

let nextId = 0;

/** 消化獎勵類事件並以提示條顯示 2.5 秒；其餘事件留在佇列給其他畫面。 */
export function RewardToast() {
  const queue = eventQueue.value;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const mine = queue.filter(isToastable);
    if (mine.length === 0) return;
    eventQueue.value = queue.filter((e) => !isToastable(e));
    const fresh: Toast[] = [];
    for (const e of mine) for (const text of textsOf(e)) fresh.push({ id: nextId++, text });
    if (fresh.length === 0) return;
    setToasts((prev) => [...prev, ...fresh]);
    for (const t of fresh) {
      timers.current.push(setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, SHOW_MS));
    }
  }, [queue]);

  useEffect(() => () => {
    for (const t of timers.current) clearTimeout(t);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div class="reward-toast" role="status">
      {toasts.map((t) => <p key={t.id} class="reward-toast-item">{t.text}</p>)}
    </div>
  );
}
