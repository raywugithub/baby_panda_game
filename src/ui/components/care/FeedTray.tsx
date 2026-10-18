import { useRef } from 'preact/hooks';
import { game, commit } from '../../store';
import { feed } from '../../../core/care';
import { now } from '../../../platform/clock';
import { FOODS } from '../../../content/foods';
import { RECIPES } from '../../../content/recipes';
import type { FoodDef } from '../../../content/types';
import { isNearMouth } from './careGeometry';

interface Props {
  mouth: { x: number; y: number };
  onFed?: (reaction: FoodDef['reaction']) => void;
}

interface FoodItem { id: string; name: string; reaction: FoodDef['reaction']; count: number }

function findFood(id: string): FoodDef | undefined {
  return FOODS.find(f => f.id === id) ?? RECIPES.find(r => r.id === id);
}

/** 背包中可餵的食物（食物與料理），依背包順序列出。 */
function trayItems(inventory: Record<string, number>): FoodItem[] {
  const items: FoodItem[] = [];
  for (const [id, count] of Object.entries(inventory)) {
    if (count < 1 || !(id.startsWith('food-') || id.startsWith('recipe-'))) continue;
    const def = findFood(id);
    if (def) items.push({ id, name: def.name, reaction: def.reaction, count });
  }
  return items;
}

export function FeedTray({ mouth, onFed }: Props) {
  const drag = useRef<{ id: string; pointerId: number } | null>(null);
  const items = trayItems(game.value.inventory);

  function onPointerDown(id: string) {
    return (e: PointerEvent) => {
      drag.current = { id, pointerId: e.pointerId };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };
  }

  function onPointerUp(e: PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!isNearMouth({ x: e.clientX, y: e.clientY }, mouth)) return;
    const before = game.value;
    const out = feed(before, d.id, now());
    if (out.state === before) return;
    commit(out);
    const def = findFood(d.id);
    if (def) onFed?.(def.reaction);
  }

  if (items.length === 0) return <p>背包裡沒有可以餵的食物</p>;

  return (
    <div class="feed-tray" style={{ touchAction: 'none' }}>
      <p>把食物拖到熊貓嘴邊</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            aria-label={`${item.name} ×${item.count}`}
            data-testid={`tray-${item.id}`}
            style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
            onPointerDown={onPointerDown(item.id)}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { drag.current = null; }}
          >
            {item.name} <span aria-hidden="true">×{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
