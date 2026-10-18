import type { Page } from '@playwright/test';
import { createInitialState, type GameState } from '../src/core/state';

// 在頁面載入前寫入存檔；只在 localStorage 還沒有 panda.save 時寫入，重新整理不會覆蓋進度（契約 10.17）。
// lastSeenAt 設在未來 60 秒（C17）：離線時間差為負，視為 0，指標不會因測試執行時間而衰減。
export async function seedSave(page: Page, patch: Partial<GameState> = {}): Promise<void> {
  const base = createInitialState(4242, Date.now());
  const state: GameState = { ...base, onboardingDone: true, lastSeenAt: Date.now() + 60_000, ...patch };
  const json = JSON.stringify(state);
  await page.addInitScript((payload: string) => {
    try {
      if (localStorage.getItem('panda.save') === null) localStorage.setItem('panda.save', payload);
    } catch { /* 私密視窗或被封鎖時略過 */ }
  }, json);
}
