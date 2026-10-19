import type { GameState } from './state';
import type { Outcome } from './events';

const CHAPTERS: { id: string; threshold: number }[] = [
  { id: 'ch1', threshold: 3 },
  { id: 'ch2', threshold: 6 },
  { id: 'ch3', threshold: 9 },
  { id: 'ch4', threshold: 12 },
  { id: 'ch5', threshold: 15 },
];

/** 回傳目前到期且尚未觸發的劇情 id；沒有則回傳 null（不含 prologue）。 */
export function dueBeat(completedCount: number, storyBeats: string[]): string | null {
  for (const c of CHAPTERS) {
    if (completedCount >= c.threshold && !storyBeats.includes(c.id)) return c.id;
  }
  if (completedCount >= 20) {
    const legend = `legend-${Math.floor(completedCount / 5) * 5}`;
    if (!storyBeats.includes(legend)) return legend;
  }
  return null;
}

/** 若沒有待播放的劇情且有到期劇情，設定 pendingBeat 並記錄到 storyBeats。 */
export function checkStory(s: GameState): Outcome {
  if (s.pendingBeat !== null) return { state: s, events: [] };
  const id = dueBeat(s.completedCount, s.storyBeats);
  if (id === null) return { state: s, events: [] };
  return {
    state: { ...s, pendingBeat: id, storyBeats: [...s.storyBeats, id] },
    events: [{ type: 'storyBeat', beatId: id }],
  };
}

/** 關閉劇情時呼叫：清除 pendingBeat，再排入下一個到期劇情。 */
export function ackBeat(s: GameState): GameState {
  return checkStory({ ...s, pendingBeat: null }).state;
}

/** 把朋友故事線等 id 記入 storyBeats；已存在則原樣回傳。 */
export function markBeatSeen(s: GameState, beatId: string): GameState {
  if (s.storyBeats.includes(beatId)) return s;
  return { ...s, storyBeats: [...s.storyBeats, beatId] };
}

/** 已觸發的小傳說（legend-N），依 N 升冪。 */
export function legendCards(s: GameState): { beatId: string; n: number }[] {
  return s.storyBeats
    .filter((id) => id.startsWith('legend-'))
    .map((beatId) => ({ beatId, n: Number(beatId.slice('legend-'.length)) }))
    .sort((a, b) => a.n - b.n);
}
