import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { isIOS, isStandalone, applyUpdate, setUpdateHandler, updateAvailable } from './pwa';
import { PWA_OPTIONS } from './pwa-config';
import { createInitialState } from '../core/state';
import { flushOnHide, maybeBackup, setStateSource, settleBackups, LS_KEY } from './storage';
import { now } from './clock';

// 包住真實實作（不替換行為），只為了記錄呼叫順序。
vi.mock('./storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storage')>();
  return {
    ...actual,
    flushOnHide: vi.fn(actual.flushOnHide),
    maybeBackup: vi.fn(actual.maybeBackup),
  };
});

afterEach(() => { vi.unstubAllGlobals(); });

describe('PWA 設定', () => {
  it('manifest 使用相對路徑並為獨立模式', () => {
    const m = PWA_OPTIONS.manifest as any;
    expect(m.start_url).toBe('./');
    expect(m.scope).toBe('./');
    expect(m.display).toBe('standalone');
    expect(PWA_OPTIONS.registerType).toBe('prompt');
  });
});

describe('isIOS', () => {
  it('iPhone 上的 Chrome（CriOS）與 Safari 都判定為 iOS', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) CriOS/120.0 Mobile/15E148' });
    expect(isIOS()).toBe(true);
  });
  it('桌面 Mac 不是 iOS', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15' });
    expect(isIOS()).toBe(false);
  });
});

describe('isStandalone', () => {
  it('display-mode standalone 為真', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }));
    expect(isStandalone()).toBe(true);
  });
  it('iOS 舊式 navigator.standalone 也算', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('navigator', { standalone: true });
    expect(isStandalone()).toBe(true);
  });
  it('沒有 matchMedia 的環境不拋錯，回傳 false（C1）', () => {
    vi.stubGlobal('matchMedia', undefined);
    vi.stubGlobal('navigator', {});
    expect(isStandalone()).toBe(false);
  });
});

describe('applyUpdate', () => {
  beforeEach(async () => {
    await settleBackups();
    localStorage.clear();
    vi.mocked(flushOnHide).mockClear();
    vi.mocked(maybeBackup).mockClear();
  });

  it('先執行 handler（內含存檔與備份），再套用更新', async () => {
    const order: string[] = [];
    setUpdateHandler(async () => { order.push('backup'); order.push('activate'); });
    updateAvailable.value = true;
    await applyUpdate();
    expect(order).toEqual(['backup', 'activate']);
  });

  it('真實的存檔與備份都在 SW 更新套用之前執行（C22）', async () => {
    const state = createInitialState(7, 0);
    setStateSource(() => state);
    const activate = vi.fn(() => localStorage.getItem(LS_KEY));
    // 與 main.tsx（Task 19）相同的順序：存檔 → 備份 → 套用 SW 更新。
    setUpdateHandler(async () => {
      flushOnHide();
      await maybeBackup(state, now(), true);
      activate();
    });
    updateAvailable.value = true;
    await applyUpdate();
    await settleBackups();

    expect(flushOnHide).toHaveBeenCalledTimes(1);
    expect(maybeBackup).toHaveBeenCalledWith(state, expect.any(Number), true);
    const flushOrder = vi.mocked(flushOnHide).mock.invocationCallOrder[0];
    const backupOrder = vi.mocked(maybeBackup).mock.invocationCallOrder[0];
    const activateOrder = activate.mock.invocationCallOrder[0];
    expect(flushOrder).toBeLessThan(backupOrder);
    expect(backupOrder).toBeLessThan(activateOrder);
    // 套用更新當下，主存檔已寫入 localStorage。
    expect(activate.mock.results[0].value).not.toBeNull();
  });
});
