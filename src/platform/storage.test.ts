import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialState } from '../core/state';
import { migrations } from '../core/save';
import { idbKeys, idbDelete, idbGet } from './idb';
import {
  loadGame,
  saveGame,
  maybeBackup,
  flushOnHide,
  setStateSource,
  installFlushListeners,
  saveFailed,
  setReadOnly,
  settleBackups,
} from './storage';

// 此執行環境的 localStorage 全域物件是殘缺的（Node 25 的 webstorage 沒有 setItem 等方法，
// 且讀取時會印出警告），因此一律換成記憶體版 Storage，讓測試不依賴執行環境。
{
  const data = new Map<string, string>();
  const shim = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => { data.set(k, String(v)); },
    removeItem: (k: string) => { data.delete(k); },
    clear: () => { data.clear(); },
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true, writable: true });
}

const MIN = 60_000;
const s = createInitialState(11, 0);

beforeEach(async () => {
  await settleBackups();
  localStorage.clear();
  for (const k of await idbKeys('backups')) await idbDelete('backups', k);
  saveFailed.value = false;
  setReadOnly(false);
});

describe('saveGame / loadGame', () => {
  it('寫入後讀回相同狀態', async () => {
    saveGame(s);
    const out = await loadGame(0);
    expect(out.restored).toBe(false);
    expect(out.readOnly).toBe(false);
    expect(out.state).toEqual(s);
  });
  it('主存檔損壞時保留原文到 corrupt 鍵，並從最新備份還原', async () => {
    saveGame(s);
    await maybeBackup(s, 0);
    localStorage.setItem('panda.save', 'garbage');
    const out = await loadGame(5 * MIN);
    expect(out.restored).toBe(true);
    expect(out.state).toEqual(s);
    expect(localStorage.getItem('panda.save.corrupt')).toBe('garbage');
  });
  it('存檔版本較新時唯讀，仍顯示內容', async () => {
    localStorage.setItem('panda.save', JSON.stringify({ ...s, schemaVersion: 99 }));
    const out = await loadGame(0);
    expect(out.readOnly).toBe(true);
    expect(out.state.seed).toBe(11);
  });
  it('唯讀時 saveGame 不寫入', async () => {
    localStorage.setItem('panda.save', JSON.stringify({ ...s, schemaVersion: 99 }));
    await loadGame(0);
    localStorage.setItem('panda.save', 'unchanged');
    saveGame(s);
    expect(localStorage.getItem('panda.save')).toBe('unchanged');
  });
  it('舊版存檔遷移前先備份原文，再保存遷移後的狀態（C23）', async () => {
    const old = JSON.stringify({ ...s, schemaVersion: 0 });
    localStorage.setItem('panda.save', old);
    migrations[0] = (o: any) => ({ ...o, schemaVersion: 1 });
    try {
      const out = await loadGame(7 * MIN);
      expect(out.restored).toBe(false);
      expect(out.state.schemaVersion).toBe(1);
      expect(await idbGet('backups', 7 * MIN)).toBe(old);
      expect(JSON.parse(localStorage.getItem('panda.save')!).schemaVersion).toBe(1);
    } finally {
      delete migrations[0];
    }
  });
  it('localStorage 寫入失敗時不拋錯，並標記 saveFailed', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveGame(s)).not.toThrow();
    expect(saveFailed.value).toBe(true);
    vi.restoreAllMocks();
  });
});

describe('maybeBackup（規格 8.3）', () => {
  it('距上一份超過 10 分鐘才新增，只保留最新 3 份', async () => {
    for (const t of [0, 5 * MIN, 10 * MIN, 20 * MIN, 30 * MIN, 40 * MIN]) await maybeBackup(s, t);
    expect((await idbKeys('backups')).map(Number).sort((a, b) => a - b)).toEqual([20 * MIN, 30 * MIN, 40 * MIN]);
  });
  it('force 會無視間隔', async () => {
    await maybeBackup(s, 0);
    await maybeBackup(s, 1 * MIN, true);
    expect((await idbKeys('backups')).length).toBe(2);
  });
});

describe('flush（規格 8.3 寫入時機）', () => {
  it('visibilitychange 變為 hidden 時立即寫入', () => {
    setStateSource(() => s);
    installFlushListeners();
    localStorage.clear();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(JSON.parse(localStorage.getItem('panda.save')!).seed).toBe(11);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });
  it('flushOnHide 直接寫入目前狀態', () => {
    setStateSource(() => s);
    localStorage.clear();
    flushOnHide();
    expect(localStorage.getItem('panda.save')).not.toBeNull();
  });
});
