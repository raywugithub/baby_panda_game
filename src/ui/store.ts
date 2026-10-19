import { signal } from '@preact/signals';
import { createInitialState, GameState } from '../core/state';
import { GameEvent, Outcome } from '../core/events';
import { splitArchive } from '../core/save';
import { applyElapsed, offlineMs, welcomeBack } from '../core/time';
import { runDaily } from '../core/daily';
import {
  loadGame,
  saveGame,
  setStateSource,
  setReadOnly,
  installFlushListeners,
  archiveItems,
} from '../platform/storage';
import { closeOverlay, overlay } from './nav';
import { checkMilestones } from '../core/milestones';
import { commemorate } from './photo/commemorate';

export const game = signal<GameState>(createInitialState(0, 0)); // 啟動前的占位，boot 會覆蓋
export const eventQueue = signal<GameEvent[]>([]);
export const readOnly = signal(false);
export const justOpenedAfterMs = signal<number | null>(null);
export const restored = signal(false);

const clearBeat = (s: GameState): GameState => ({ ...s, pendingBeat: null });
let beatAck: (s: GameState) => GameState = clearBeat;

/** 關閉劇情時的處理；計畫 B 以 ackBeat 取代，會排入下一個到期劇情。 */
export function registerBeatAck(fn: (s: GameState) => GameState): void {
  beatAck = fn;
}

function isOutcome(x: Outcome | GameState): x is Outcome {
  return 'events' in x && 'state' in x;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSave(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!readOnly.value) saveGame(game.value);
  }, 1000);
}

export function commit(x: Outcome | GameState): void {
  const outcome: Outcome = isOutcome(x) ? x : { state: x, events: [] };
  const milestones = checkMilestones(outcome.state);
  const events = [...outcome.events, ...milestones.events];
  if (events.length > 0) eventQueue.value = [...eventQueue.value, ...events];
  const { state, archived } = splitArchive(milestones.state);
  game.value = state;
  // 升階照在 game.value 更新後才拍，讓照片裡的熊貓是新階段（失敗不影響升階）。
  for (const e of events) {
    if (e.type === 'stageUp') void commemorate(e.stage);
  }
  if (archived.diary.length > 0 || archived.letters.length > 0) void archiveItems(archived);
  scheduleSave();
}

export function consumeEvents(): GameEvent[] {
  const events = eventQueue.value;
  eventQueue.value = [];
  return events;
}

/** 關閉對話的唯一路徑：先套用劇情確認，再關閉覆蓋層（契約 10.8）。 */
export function dismissOverlay(): void {
  const o = overlay.value;
  if (o?.kind === 'dialogue' && game.value.pendingBeat === o.scriptId) {
    commit(beatAck(game.value));
  }
  closeOverlay();
}

export async function boot(t: number): Promise<{ welcome: boolean }> {
  setStateSource(() => game.value);
  installFlushListeners();
  const loaded = await loadGame(t);
  readOnly.value = loaded.readOnly;
  restored.value = loaded.restored;
  setReadOnly(loaded.readOnly);
  justOpenedAfterMs.value = offlineMs(loaded.state, t);
  let s = loaded.state;
  const w = welcomeBack(s, t); // 必須在 applyElapsed 之前（需要舊的 lastSeenAt）
  if (w) {
    s = w.state;
    eventQueue.value = [...eventQueue.value, ...w.events];
  }
  s = applyElapsed(s, t);
  s = runDaily(s, t);
  game.value = s;
  scheduleSave();
  return { welcome: w !== null };
}
