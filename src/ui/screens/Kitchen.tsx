import { useState } from 'preact/hooks';
import { game, commit } from '../store';
import { cook } from '../../core/care';
import { now } from '../../platform/clock';
import { INGREDIENTS } from '../../content/ingredients';
import { RecipeResult } from '../components/RecipeResult';

/** 兩格都選且數量足夠；兩格同種食材時需要至少 2 份。 */
export function canCook(inv: Record<string, number>, a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return (inv[a] ?? 0) >= 2;
  return (inv[a] ?? 0) >= 1 && (inv[b] ?? 0) >= 1;
}

type Slots = [string | null, string | null];
interface Result { id: string; discovered: boolean }

const NAME_OF: Record<string, string> = Object.fromEntries(INGREDIENTS.map(i => [i.id, i.name]));

export function Kitchen() {
  const inv = game.value.inventory;
  const [slots, setSlots] = useState<Slots>([null, null]);
  const [result, setResult] = useState<Result | null>(null);

  function pick(id: string) {
    setResult(null);
    setSlots(cur => (cur[0] === null ? [id, cur[1]] : [cur[0], id]));
  }

  function clear(i: 0 | 1) {
    setResult(null);
    setSlots(cur => (i === 0 ? [null, cur[1]] : [cur[0], null]));
  }

  function onCook() {
    const [a, b] = slots;
    if (!canCook(game.value.inventory, a, b)) return;
    const before = game.value;
    const out = cook(before, a as string, b as string, now());
    const discovered = out.result !== 'mystery' && !before.recipes.includes(out.result);
    commit(out);
    setResult({ id: out.result, discovered });
    setSlots([null, null]);
  }

  const selectedCount = (id: string) => slots.filter(s => s === id).length;

  return (
    <div class="kitchen">
      <div class="kitchen-slots">
        {slots.map((id, i) => (
          <button
            type="button"
            key={i}
            aria-label={`清空第${i + 1}格`}
            onClick={() => clear(i as 0 | 1)}
            disabled={id === null}
          >
            {id ? NAME_OF[id] : '空'}
          </button>
        ))}
      </div>
      <div class="kitchen-ingredients">
        {INGREDIENTS.map(ing => {
          const count = inv[ing.id] ?? 0;
          const disabled = count - selectedCount(ing.id) < 1;
          return (
            <div key={ing.id} class="kitchen-ing">
              <button type="button" disabled={disabled} onClick={() => pick(ing.id)}>{ing.name}</button>
              <span>×{count}</span>
            </div>
          );
        })}
      </div>
      <button type="button" disabled={!canCook(inv, slots[0], slots[1])} onClick={onCook}>煮一煮</button>
      {result ? <RecipeResult result={result.id} discovered={result.discovered} /> : null}
    </div>
  );
}
