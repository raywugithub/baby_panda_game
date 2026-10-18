import type { GameState, Terrain } from './state';
import { getItem } from './catalog';

export interface Modifiers {
  starSandPct: Partial<Record<Terrain, number>>;
  extraTreasure: Terrain[];
  minigameStarSandPct: number;
  diaryDream: boolean;
  ingredientChancePct: number;
  affinityBonus: number;
}

/** 依裝備中的墜飾疊加效果（規格 7.2）；墜飾只有加成。 */
export function pendantModifiers(s: GameState): Modifiers {
  const m: Modifiers = {
    starSandPct: {},
    extraTreasure: [],
    minigameStarSandPct: 0,
    diaryDream: false,
    ingredientChancePct: 0,
    affinityBonus: 0,
  };
  for (const id of s.equipped.pendants) {
    const eff = getItem(id).pendant;
    if (!eff) continue;
    switch (eff.kind) {
      case 'terrainStarSand':
        m.starSandPct[eff.terrain] = (m.starSandPct[eff.terrain] ?? 0) + eff.pct;
        break;
      case 'terrainExtraTreasure':
        m.extraTreasure.push(eff.terrain);
        break;
      case 'minigameStarSand':
        m.minigameStarSandPct += eff.pct;
        break;
      case 'diaryDream':
        m.diaryDream = true;
        break;
      case 'ingredientChance':
        m.ingredientChancePct += eff.pct;
        break;
      case 'affinityBonus':
        m.affinityBonus += eff.amount;
        break;
    }
  }
  return m;
}

/** 裝備中墜飾的叮噹音色 id，依裝備順序；沒有音色的略過。 */
export function pendantSoundIds(ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const snd = getItem(id).sound;
    if (snd !== undefined) out.push(snd);
  }
  return out;
}

/** 食材掉落機率（契約 §10.12）：基礎 30%，蘑菇墜飾加 30 個百分點。 */
export function ingredientDropChance(m: Modifiers): number {
  return 30 + m.ingredientChancePct;
}
