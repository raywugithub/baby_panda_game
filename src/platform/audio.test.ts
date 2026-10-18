import { describe, it, expect, vi } from 'vitest';
import { sfx, unlockAudio, setSoundEnabled } from './audio';

const created: FakeAudioContext[] = [];

class FakeAudioContext {
  currentTime = 0;
  state = 'suspended';
  destination = {};
  createOscillator = vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  }));
  resume = vi.fn(() => Promise.resolve());
  constructor() {
    created.push(this);
  }
}

describe('audio', () => {
  it('沒有 AudioContext 時 sfx 與 unlock 靜默不拋錯', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => { unlockAudio(); sfx('pop'); sfx('tada'); }).not.toThrow();
    vi.unstubAllGlobals();
  });
  it('解鎖且音效開啟時 sfx 建立振盪器節點', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    unlockAudio();
    setSoundEnabled(true);
    const ctx = created.at(-1)!;
    ctx.createOscillator.mockClear();
    sfx('pop');
    expect(ctx.createOscillator).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it('關閉音效時 sfx 不建立任何節點', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    unlockAudio();
    const ctx = created.at(-1)!;
    ctx.createOscillator.mockClear();
    setSoundEnabled(false);
    sfx('tada');
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    setSoundEnabled(true);
    vi.unstubAllGlobals();
  });
  it('之後被系統暫停時，下一次點擊會再次恢復', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    unlockAudio();
    const ctx = created.at(-1)!;
    ctx.state = 'suspended';
    ctx.resume.mockClear();
    window.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    ctx.state = 'suspended';
    window.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
