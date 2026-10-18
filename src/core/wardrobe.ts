import type { GameState, OutfitSlot, Outfit } from './state';
import { getItem } from './catalog';
import { pendantSlots } from './growth';

const owned = (s: GameState, id: string): boolean => (s.inventory[id] ?? 0) > 0;

/** 穿上或脫下衣物；null 清空該欄位。 */
export function equip(s: GameState, slot: OutfitSlot, itemId: string | null): GameState {
  if (itemId === null) {
    const outfit: Outfit = { ...s.equipped.outfit };
    delete outfit[slot];
    return { ...s, equipped: { ...s.equipped, outfit } };
  }
  if (!owned(s, itemId)) return s;
  const item = getItem(itemId);
  if (item.category !== 'outfit' || item.slot !== slot) return s;
  return { ...s, equipped: { ...s.equipped, outfit: { ...s.equipped.outfit, [slot]: itemId } } };
}

/** 設定裝備中的墜飾；須為已擁有的墜飾、不可重複，且不超過墜飾格數。 */
export function setPendants(s: GameState, ids: string[]): GameState {
  if (ids.length > pendantSlots(s.chainLinks)) return s;
  if (new Set(ids).size !== ids.length) return s;
  for (const id of ids) {
    if (!owned(s, id)) return s;
    if (getItem(id).category !== 'pendant') return s;
  }
  return { ...s, equipped: { ...s.equipped, pendants: [...ids] } };
}

/** 把目前穿戴存到第 i 組預設。 */
export function savePreset(s: GameState, i: 0 | 1 | 2): GameState {
  const presets = [...s.presets] as GameState['presets'];
  presets[i] = { outfit: { ...s.equipped.outfit }, pendants: [...s.equipped.pendants] };
  return { ...s, presets };
}

/** 套用第 i 組預設；已不擁有的衣物／墜飾會被略過，墜飾數不超過格數。 */
export function loadPreset(s: GameState, i: 0 | 1 | 2): GameState {
  const preset = s.presets[i];
  const outfit: Outfit = {};
  for (const slot of Object.keys(preset.outfit) as OutfitSlot[]) {
    const id = preset.outfit[slot];
    if (id && owned(s, id)) outfit[slot] = id;
  }
  const cap = pendantSlots(s.chainLinks);
  const pendants = preset.pendants.filter((id) => owned(s, id)).slice(0, cap);
  return { ...s, equipped: { outfit, pendants } };
}
