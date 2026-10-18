import { describe, it, expect, vi } from 'vitest';
import { pendantModifiers, pendantSoundIds, ingredientDropChance } from './pendants';
import { createInitialState } from './state';
import { PENDANT_TONES, playPendantSounds } from '../platform/pendantSound';
import { PENDANT_ITEMS } from '../content/items/pendants';

const wear = (ids: string[]) => {
  const s = createInitialState(1, 0);
  return { ...s, equipped: { outfit: {}, pendants: ids } };
};

describe('pendant modifiers', () => {
  it('bamboo starter gives +20% bamboo star sand', () => {
    expect(pendantModifiers(wear(['pendant-bamboo'])).starSandPct.bamboo).toBe(20);
  });
  it('bamboo and snowflake stack independently', () => {
    const m = pendantModifiers(wear(['pendant-bamboo', 'pendant-snowflake']));
    expect(m.starSandPct).toEqual({ bamboo: 20, snow: 20 });
  });
  it('shell and cloud add extra treasure terrains', () => {
    expect(pendantModifiers(wear(['pendant-shell', 'pendant-cloud'])).extraTreasure.sort()).toEqual(['beach', 'cloud']);
  });
  it('moon bell enables diary dream; heart adds affinity 1', () => {
    const m = pendantModifiers(wear(['pendant-moon-bell', 'pendant-heart']));
    expect(m.diaryDream).toBe(true);
    expect(m.affinityBonus).toBe(1);
  });
  it('mushroom +30 ingredient chance; star +20 minigame star sand', () => {
    const m = pendantModifiers(wear(['pendant-mushroom', 'pendant-star']));
    expect(m.ingredientChancePct).toBe(30);
    expect(m.minigameStarSandPct).toBe(20);
  });
  it('8 distinct sound tones, one per pendant sound id', () => {
    // C1: the bamboo starter pendant's tone is 'bell-soft' (not 'chime-bamboo').
    const sounds = [...PENDANT_ITEMS.map((p) => p.sound), 'bell-soft'];
    expect(new Set(sounds).size).toBe(8);
    expect(Object.keys(PENDANT_TONES)).toHaveLength(8);
    for (const snd of sounds) expect(PENDANT_TONES[snd!].length).toBeGreaterThanOrEqual(2);
  });
  it('moon bell alone sets diaryDream; without it diaryDream is false', () => {
    expect(pendantModifiers(wear(['pendant-moon-bell'])).diaryDream).toBe(true);
    expect(pendantModifiers(wear(['pendant-bamboo'])).diaryDream).toBe(false);
  });
  it('mushroom gives 60% ingredient drop (base 30 + 30 points); no mushroom gives 30%', () => {
    expect(ingredientDropChance(pendantModifiers(wear(['pendant-mushroom'])))).toBe(60);
    expect(ingredientDropChance(pendantModifiers(wear([])))).toBe(30);
  });
  it('one sound per equipped pendant, in equipped order', () => {
    expect(pendantSoundIds(['pendant-bamboo', 'pendant-moon-bell'])).toEqual(['bell-soft', 'chime-moon']);
  });
  it('collar tones play one per pendant, the i-th at i × gap', () => {
    vi.useFakeTimers();
    const play = vi.fn();
    playPendantSounds(['bell-soft', 'chime-moon'], 350, play);
    expect(play.mock.calls).toEqual([['bell-soft']]);
    vi.advanceTimersByTime(349);
    expect(play).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(play.mock.calls).toEqual([['bell-soft'], ['chime-moon']]);
    vi.useRealTimers();
  });
});
