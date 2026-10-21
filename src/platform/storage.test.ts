import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialState } from '../core/state';
import { migrations, serialize } from '../core/save';
import { idbKeys, idbDelete, idbGet } from './idb';

// 可切換的 idbPut 失敗開關，用來模擬 IndexedDB 寫入失敗（預設直通真實實作）。
const idbFault = vi.hoisted(() => ({ failPut: false }));
vi.mock('./idb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./idb')>();
  return {
    ...actual,
    idbPut: (...args: Parameters<typeof actual.idbPut>) =>
      idbFault.failPut ? Promise.reject(new Error('idb down')) : actual.idbPut(...args),
  };
});

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
    // saveGame 會排入真實時鐘的備份；先等它完成並清空，讓下一行 maybeBackup(s, 0) 是唯一的備份。
    saveGame(s);
    await settleBackups();
    for (const k of await idbKeys('backups')) await idbDelete('backups', k);
    await maybeBackup(s, 0);
    expect((await idbKeys('backups')).map(Number)).toEqual([0]);
    localStorage.setItem('panda.save', 'garbage');
    const out = await loadGame(5 * MIN);
    expect(out.restored).toBe(true);
    expect(out.state).toEqual(s);
    expect(localStorage.getItem('panda.save.corrupt')).toBe('garbage');
  });
  it('損壞原文無法保留時不覆寫主存檔，保留成功後才寫入（標記 saveFailed）', async () => {
    localStorage.setItem('panda.save', 'garbage');
    const orig = localStorage.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k: string, v: string) => {
      if (k === 'panda.save.corrupt') throw new Error('quota');
      orig.call(localStorage, k, v);
    });
    try {
      const out = await loadGame(0);
      expect(out.restored).toBe(false);
      expect(saveFailed.value).toBe(true);
      saveGame(s);
      expect(localStorage.getItem('panda.save')).toBe('garbage');
    } finally {
      spy.mockRestore();
    }
    saveGame(s);
    await settleBackups();
    expect(localStorage.getItem('panda.save.corrupt')).toBe('garbage');
    expect(localStorage.getItem('panda.save')).toBe(serialize(s));
    expect(saveFailed.value).toBe(false);
  });
  it('遷移前備份失敗時不覆寫舊存檔，備份成功後才保存遷移結果（C23）', async () => {
    const old = JSON.stringify({ ...s, schemaVersion: 0 });
    localStorage.setItem('panda.save', old);
    migrations[0] = (o: any) => ({ ...o, schemaVersion: 1 });
    idbFault.failPut = true;
    try {
      const out = await loadGame(7 * MIN);
      expect(out.state.schemaVersion).toBe(1);
      expect(saveFailed.value).toBe(true);
      saveGame(out.state);
      await settleBackups();
      expect(localStorage.getItem('panda.save')).toBe(old);
      idbFault.failPut = false;
      saveGame(out.state);
      await settleBackups();
      expect(await idbGet('backups', 7 * MIN)).toBe(old);
      expect(JSON.parse(localStorage.getItem('panda.save')!).schemaVersion).toBe(1);
    } finally {
      idbFault.failPut = false;
      delete migrations[0];
    }
  });
  it('備份失敗期間多次 saveGame，恢復後只寫入最新狀態', async () => {
    const old = JSON.stringify({ ...s, schemaVersion: 0 });
    localStorage.setItem('panda.save', old);
    migrations[0] = (o: any) => ({ ...o, schemaVersion: 1 });
    idbFault.failPut = true;
    try {
      const out = await loadGame(7 * MIN);
      const s1 = { ...out.state, gold: 1 };
      const s2 = { ...out.state, gold: 2 };
      const s3 = { ...out.state, gold: 3 };
      saveGame(s1);
      saveGame(s2);
      saveGame(s3);
      // 備份在下一輪佇列才執行；此時立即恢復，讓第一個排隊的重試成功。
      idbFault.failPut = false;
      await settleBackups();
      expect(JSON.parse(localStorage.getItem('panda.save')!).gold).toBe(3);
      expect(saveFailed.value).toBe(false);
    } finally {
      idbFault.failPut = false;
      delete migrations[0];
    }
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
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
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
