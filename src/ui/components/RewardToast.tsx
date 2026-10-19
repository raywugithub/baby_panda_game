import { useEffect, useState } from 'preact/hooks';
import { eventQueue } from '../store';
import type { GameEvent } from '../../core/events';
import { RECIPES } from '../../content/recipes';

const SHOW_MS = 2500;
const TOASTABLE = new Set<GameEvent['type']>(['reward', 'markUp', 'stageUp', 'slotUnlocked', 'recipeDiscovered', 'milestone']);
const CATEGORY_LABEL: Record<string, string> = { furniture: '家具', outfit: '衣服', pendant: '墜飾' };

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
      return [`成長刻度 +${e.mark}`];
    case 'stageUp':
      return [`升上階段 ${e.stage}：${e.title}`];
    case 'slotUnlocked':
      return ['項圈多了一個墜飾欄位！'];
    case 'recipeDiscovered':
      return [`新食譜：${RECIPES.find((r) => r.id === e.recipeId)?.name ?? e.recipeId}`];
    case 'milestone':
      return [`圖鑑里程碑：${CATEGORY_LABEL[e.category] ?? e.category} ×${e.count}，送你一個禮盒！`];
    default:
      return [];
  }
}

interface Toast { id: number; text: string }

let nextId = 0;

/**
 * 消化獎勵類事件並排隊顯示：同一時間只有一則，每則 2.5 秒後換下一則，
 * 因此提示不會互相疊住，也不會蓋到指標。其餘事件留在佇列給其他畫面。
 */
export function RewardToast() {
  const queue = eventQueue.value;
  const [pending, setPending] = useState<Toast[]>([]);

  useEffect(() => {
    // Read the live queue here, not the render-time snapshot, so events pushed
    // between render and this effect are not overwritten by the write-back.
    const current = eventQueue.value;
    const mine = current.filter(isToastable);
    if (mine.length === 0) return;
    eventQueue.value = current.filter((e) => !isToastable(e));
    const fresh: Toast[] = [];
    for (const e of mine) for (const text of textsOf(e)) fresh.push({ id: nextId++, text });
    if (fresh.length > 0) setPending((prev) => [...prev, ...fresh]);
  }, [queue]);

  const head = pending[0];
  const headId = head?.id;
  useEffect(() => {
    if (headId === undefined) return;
    const t = setTimeout(() => {
      setPending((prev) => prev.filter((x) => x.id !== headId));
    }, SHOW_MS);
    return () => clearTimeout(t);
  }, [headId]);

  if (!head) return null;
  return (
    <div class="reward-toast" role="status">
      <p key={head.id} class="reward-toast-item">{head.text}</p>
    </div>
  );
}
