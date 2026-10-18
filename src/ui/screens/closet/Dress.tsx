import { useEffect, useState } from 'preact/hooks';
import type { PandaPose } from '../../../panda/Panda';
import { Panda } from '../../../panda/Panda';
import { idlePoseFor } from '../../../core/mood';
import { currentStage, pendantSlots } from '../../../core/growth';
import { equip, setPendants, savePreset, loadPreset } from '../../../core/wardrobe';
import { getItem } from '../../../core/catalog';
import { ITEMS } from '../../../content/items';
import { ITEM_ART } from '../../../art/items';
import type { OutfitSlot } from '../../../core/state';
import { game, commit } from '../../store';

const SPIN_MS = 1200; // 換裝後熊貓轉一圈的時間

type SlotKey = OutfitSlot | 'pendant';
const SLOT_TILES: { key: SlotKey; label: string }[] = [
  { key: 'head', label: '頭飾' },
  { key: 'face', label: '臉' },
  { key: 'body', label: '衣服' },
  { key: 'hand', label: '手持物' },
  { key: 'tail', label: '尾巴配件' },
  { key: 'pendant', label: '項圈墜飾' },
];
const PRESET_INDEXES = [0, 1, 2] as const;

/** 物品插圖；沒有登記插圖的 id 不渲染。 */
function ItemArt({ id, size }: { id: string | undefined; size: number }) {
  const Art = id ? ITEM_ART[id] : undefined;
  return Art ? <Art size={size} /> : null;
}

export function Dress() {
  const s = game.value;
  const stage = currentStage(s);
  const { outfit, pendants } = s.equipped;
  const cap = pendantSlots(s.chainLinks);
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [spin, setSpin] = useState<{ n: number } | null>(null);

  useEffect(() => {
    if (!spin) return;
    const t = setTimeout(() => setSpin(null), SPIN_MS);
    return () => clearTimeout(t);
  }, [spin]);

  function changed(next: typeof s) {
    commit(next);
    setSpin({ n: (spin?.n ?? 0) + 1 });
  }

  function ownedOf(key: SlotKey): string[] {
    return ITEMS
      .filter(i => (s.inventory[i.id] ?? 0) > 0)
      .filter(i => key === 'pendant' ? i.category === 'pendant' : i.category === 'outfit' && i.slot === key)
      .map(i => i.id);
  }

  function pickOutfit(slot: OutfitSlot, id: string | null) {
    changed(equip(game.value, slot, id));
    setOpenSlot(null);
  }

  function togglePendant(id: string) {
    const cur = game.value.equipped.pendants;
    const ids = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    changed(setPendants(game.value, ids));
  }

  function clearPendants() {
    changed(setPendants(game.value, []));
  }

  const idle = idlePoseFor('normal') as PandaPose;

  return (
    <div class="closet-dress">
      <div class="closet-preview">
        <Panda
          pose={spin ? 'spin' : idle}
          stage={stage}
          outfit={outfit}
          pendants={pendants}
          chainLinks={s.chainLinks}
          size={220}
        />
      </div>
      <div class="closet-tiles">
        {SLOT_TILES.map(t => {
          const wornId = t.key === 'pendant' ? pendants[0] : outfit[t.key];
          return (
            <button
              type="button"
              key={t.key}
              class="closet-tile"
              aria-pressed={openSlot === t.key}
              onClick={() => setOpenSlot(openSlot === t.key ? null : t.key)}
            >
              <span class="closet-tile-icon" aria-hidden="true"><ItemArt id={wornId} size={52} /></span>
              <span class="closet-tile-label">{t.label}</span>
              <span class="closet-tile-status">
                {t.key === 'pendant' ? `已用 ${pendants.length} / 總數 ${cap}` : wornId ? '已穿戴' : '未穿'}
              </span>
            </button>
          );
        })}
      </div>
      {openSlot !== null ? (
        <div class="closet-list" role="group" aria-label="可選的物品">
          {openSlot === 'pendant' ? (
            <>
              <button type="button" onClick={clearPendants}>不穿</button>
              {ownedOf('pendant').map(id => {
                const on = pendants.includes(id);
                const full = !on && pendants.length >= cap;
                return (
                  <button type="button" key={id} aria-pressed={on} disabled={full} onClick={() => togglePendant(id)}>
                    <ItemArt id={id} size={28} />
                    <span>{getItem(id).name}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <button type="button" onClick={() => pickOutfit(openSlot, null)}>不穿</button>
              {ownedOf(openSlot).map(id => (
                <button type="button" key={id} onClick={() => pickOutfit(openSlot, id)}>
                  <ItemArt id={id} size={28} />
                  <span>{getItem(id).name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
      <div class="closet-presets">
        {PRESET_INDEXES.map(i => (
          <button type="button" key={`load-${i}`} onClick={() => changed(loadPreset(game.value, i))}>
            {`搭配 ${i + 1}`}
          </button>
        ))}
      </div>
      <div class="closet-presets">
        {PRESET_INDEXES.map(i => (
          <button type="button" key={`save-${i}`} onClick={() => commit(savePreset(game.value, i))}>
            {`存到搭配 ${i + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}
