import { describe, it, expect } from 'vitest';
import { initialStep, nextStep, hasProgress } from './onboarding';
import { createInitialState } from '../core/state';

const ctx = (over = {}) => ({ isIOS: true, standalone: false, hasProgress: false, onboardingDone: false, moveOutDismissed: false, ...over });

describe('initialStep（規格 8.3、3.4）', () => {
  it('iPhone 瀏覽器分頁且沒有進度 → 把熊貓帶回家', () => {
    expect(initialStep(ctx())).toBe('install');
  });
  it('主畫面第一次開啟 → 搬家或新遊戲', () => {
    expect(initialStep(ctx({ standalone: true }))).toBe('moveIn');
  });
  it('桌機沒有進度 → 直接開箱', () => {
    expect(initialStep(ctx({ isIOS: false }))).toBe('boxPeek');
  });
  it('iOS 分頁已有進度 → 搬家流程（moveOut）；關閉後不再顯示', () => {
    expect(initialStep(ctx({ hasProgress: true }))).toBe('moveOut');
    expect(initialStep(ctx({ hasProgress: true, moveOutDismissed: true }))).toBeNull();
  });
  it('已完成引導或主畫面已有進度 → 不顯示', () => {
    expect(initialStep(ctx({ onboardingDone: true }))).toBeNull();
    expect(initialStep(ctx({ standalone: true, hasProgress: true }))).toBeNull();
  });
  it('hasProgress 依成長、完成地點、日記與項圈判定', () => {
    const base = createInitialState(1, 0);
    expect(hasProgress(base)).toBe(false);
    expect(hasProgress({ ...base, growthXp: 1 })).toBe(true);
    expect(hasProgress({ ...base, diary: [{ date: '2026-10-18', text: 't', sticker: null }] })).toBe(true);
  });
});

describe('nextStep', () => {
  it('依序走完引導', () => {
    let s: any = 'boxPeek';
    const seen: string[] = [];
    while (s !== 'done') { s = nextStep(s); seen.push(s); }
    expect(seen).toEqual(['prologue', 'tutorialHug', 'tutorialFeed', 'done']);
  });
  it('先在這裡玩 → 開箱', () => {
    expect(nextStep('install')).toBe('boxPeek');
    expect(nextStep('moveIn')).toBe('boxPeek');
  });
});
