import type { ItemCategory } from '../../content/types';
import { ITEMS } from '../../content/items';
import { FRIEND_ITEMS } from '../../content/items/friends';
import { ITEM_ART } from '../../art/items';
import { game } from '../store';

const FRIEND_IDS = new Set(FRIEND_ITEMS.map(i => i.id));

// 分組順序：家具、衣服、墜飾；家具中朋友專屬家具排在最後。
const GROUPS: { label: string; category: ItemCategory }[] = [
  { label: '家具', category: 'furniture' },
  { label: '衣服', category: 'outfit' },
  { label: '墜飾', category: 'pendant' },
];

function groupItems(category: ItemCategory) {
  const items = ITEMS.filter(i => i.category === category);
  return [...items.filter(i => !FRIEND_IDS.has(i.id)), ...items.filter(i => FRIEND_IDS.has(i.id))];
}

export function ItemsTab() {
  const inventory = game.value.inventory;
  return (
    <div class="album-items">
      {GROUPS.map(g => (
        <section key={g.category} class="album-group">
          <h3 class="album-group-title">{g.label}</h3>
          <div class="album-grid">
            {groupItems(g.category).map(item => {
              const owned = (inventory[item.id] ?? 0) > 0;
              const Art = ITEM_ART[item.id];
              if (owned) {
                return (
                  <div key={item.id} class="album-cell" data-testid={`inventory-${item.id}`}>
                    <div class="album-art">{Art ? <Art size={56} /> : null}</div>
                    <span class="album-name">{item.name}</span>
                  </div>
                );
              }
              return (
                <div key={item.id} class="album-cell album-cell-locked">
                  <div class="album-art album-silhouette">{Art ? <Art size={56} /> : null}</div>
                  <span class="album-hint">{item.hint}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
