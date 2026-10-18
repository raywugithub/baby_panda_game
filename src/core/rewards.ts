import type { GameState } from './state';
import type { GameEvent, Outcome, Reward } from './events';
import { marksForXp, stageForMarks, stageTitle, pendantSlots } from './growth';

export function applyReward(s: GameState, r: Reward): Outcome {
  const events: GameEvent[] = [];
  const next: GameState = { ...s, inventory: { ...s.inventory } };

  const oldMarks = marksForXp(s.growthXp);
  next.growthXp = s.growthXp + (r.xp ?? 0);
  const newMarks = marksForXp(next.growthXp);
  if (newMarks > oldMarks) events.push({ type: 'markUp', mark: newMarks });

  const oldStage = stageForMarks(oldMarks);
  const newStage = stageForMarks(newMarks);
  if (newStage > oldStage) {
    next.freeBoxes = s.freeBoxes + (newStage - oldStage);
    events.push({ type: 'stageUp', stage: newStage, title: stageTitle(s.seed, newStage) });
  }

  next.starSand = s.starSand + (r.starSand ?? 0);
  next.energy = Math.min(100, Math.max(0, s.energy + (r.energy ?? 0)));
  next.marshmallow = s.marshmallow + (r.marshmallow ?? 0);
  for (const [id, n] of Object.entries(r.items ?? {})) {
    next.inventory[id] = (next.inventory[id] ?? 0) + n;
  }

  const oldSlots = pendantSlots(s.chainLinks);
  next.chainLinks = s.chainLinks + (r.chain ?? 0);
  const newSlots = pendantSlots(next.chainLinks);
  if (newSlots > oldSlots) events.push({ type: 'slotUnlocked', slots: newSlots });

  events.push({
    type: 'reward',
    xp: r.xp ?? 0,
    starSand: r.starSand ?? 0,
    energy: r.energy ?? 0,
    chain: r.chain ?? 0,
    items: r.items ?? {},
  });
  return { state: next, events };
}
