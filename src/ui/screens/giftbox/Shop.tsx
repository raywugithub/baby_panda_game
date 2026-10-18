import { useState } from 'preact/hooks';
import type { Rarity } from '../../../core/state';
import type { ItemDef } from '../../../content/types';
import { giftPool } from '../../../core/catalog';
import { buy, isOnePerPlayer, priceOf } from '../../../core/shop';
import { game, commit } from '../../store';

const SECTIONS: { rarity: Rarity; title: string }[] = [
  { rarity: 'common', title: '普通' },
  { rarity: 'shiny', title: '閃亮' },
  { rarity: 'rainbow', title: '彩虹' },
];

function ownedLabel(item: ItemDef, count: number): string | null {
  if (count <= 0) return null;
  // 穿戴與牆地類只能擁有一件，已有即顯示「已有」；其餘（家具、食材）顯示持有數量。
  return isOnePerPlayer(item.category) ? '已有' : `×${count}`;
}

/** 棉花糖小舖：禮盒物品池中的物品，以棉花糖購買；沒有限時與輪替。 */
export function Shop() {
  const s = game.value;
  const [message, setMessage] = useState('');

  function onBuy(item: ItemDef) {
    const out = buy(game.value, item.id);
    if (!out) {
      setMessage('棉花糖不夠，或已經有了');
      return;
    }
    commit(out);
    setMessage('');
  }

  return (
    <div class="giftbox-shop">
      <p class="giftbox-shop-header">🍡 棉花糖 {s.marshmallow}</p>
      {message && (
        <p class="giftbox-shop-message" role="status">
          {message}
        </p>
      )}
      {SECTIONS.map((sec) => (
        <section key={sec.rarity} class="giftbox-shop-section">
          <h2 class="giftbox-shop-title">{sec.title}</h2>
          <ul class="giftbox-shop-list">
            {giftPool(sec.rarity).map((item) => {
              const owned = ownedLabel(item, s.inventory[item.id] ?? 0);
              return (
                <li key={item.id}>
                  <button type="button" class="giftbox-shop-item" onClick={() => onBuy(item)}>
                    <span class="giftbox-shop-name">{item.name}</span>
                    {owned && <span class="giftbox-shop-owned">{owned}</span>}
                    <span class="giftbox-shop-price">{`${priceOf(sec.rarity)} 🍡`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
