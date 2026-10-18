import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInitialState } from '../core/state';
import * as storage from '../platform/storage';
import { game, commit, eventQueue, consumeEvents, readOnly, registerBeatAck, dismissOverlay } from './store';
import { openOverlay, overlay } from './nav';

beforeEach(() => { vi.useFakeTimers(); readOnly.value = false; eventQueue.value = []; });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('commit', () => {
  it('更新 signal，並在 1 秒後寫入一次（去抖動）', () => {
    const spy = vi.spyOn(storage, 'saveGame').mockImplementation(() => {});
    const s = createInitialState(1, 0);
    commit(s); commit({ ...s, starSand: 5 });
    vi.advanceTimersByTime(999);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(game.value.starSand).toBe(5);
  });
  it('唯讀模式不寫入', () => {
    const spy = vi.spyOn(storage, 'saveGame').mockImplementation(() => {});
    readOnly.value = true;
    commit(createInitialState(1, 0));
    vi.advanceTimersByTime(2000);
    expect(spy).not.toHaveBeenCalled();
  });
  it('Outcome 的事件進入 eventQueue，consumeEvents 取出並清空', () => {
    const s = createInitialState(1, 0);
    commit({ state: s, events: [{ type: 'markUp', mark: 1 }] });
    expect(consumeEvents()).toEqual([{ type: 'markUp', mark: 1 }]);
    expect(eventQueue.value).toEqual([]);
  });
});

describe('dismissOverlay', () => {
  // 未註冊時必須先測（模組內的 ack 函式會保留到註冊為止）。
  it('未註冊 ack 時，關閉對話後 pendingBeat 為 null', () => {
    vi.spyOn(storage, 'saveGame').mockImplementation(() => {});
    commit({ ...createInitialState(1, 0), pendingBeat: 'ch1' });
    openOverlay({ kind: 'dialogue', scriptId: 'ch1' });
    dismissOverlay();
    expect(game.value.pendingBeat).toBeNull();
    expect(overlay.value).toBeNull();
  });
  it('已註冊 ack 時，關閉對話後 pendingBeat 換成下一段', () => {
    vi.spyOn(storage, 'saveGame').mockImplementation(() => {});
    registerBeatAck((s) => ({ ...s, pendingBeat: 'ch2' }));
    commit({ ...createInitialState(1, 0), pendingBeat: 'ch1' });
    openOverlay({ kind: 'dialogue', scriptId: 'ch1' });
    dismissOverlay();
    expect(game.value.pendingBeat).toBe('ch2');
    expect(overlay.value).toBeNull();
  });
});
