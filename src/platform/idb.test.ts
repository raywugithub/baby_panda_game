import { describe, it, expect, vi } from 'vitest';
import { idbGet, idbPut, idbDelete, idbKeys } from './idb';

describe('idb', () => {
  it('可以寫、讀、列出、刪除', async () => {
    await idbPut('backups', 1, { a: 1 });
    await idbPut('backups', 2, { a: 2 });
    expect(await idbGet('backups', 1)).toEqual({ a: 1 });
    expect((await idbKeys('backups')).sort()).toEqual([1, 2]);
    await idbDelete('backups', 1);
    expect(await idbGet('backups', 1)).toBeUndefined();
  });
  it('三個儲存區都存在', async () => {
    await idbPut('archive', 'diary:2026-10-18', { x: 1 });
    await idbPut('photos', 'p1', { x: 2 });
    expect(await idbGet('archive', 'diary:2026-10-18')).toEqual({ x: 1 });
    expect(await idbGet('photos', 'p1')).toEqual({ x: 2 });
  });
});

describe('idb 開啟失敗', () => {
  it('暫時性開啟失敗不會被永久快取', async () => {
    vi.resetModules();
    const real = indexedDB.open.bind(indexedDB);
    let calls = 0;
    vi.spyOn(indexedDB, 'open').mockImplementation((...a: Parameters<typeof real>) => {
      calls++;
      if (calls === 1) {
        const req = { error: new Error('lost') } as unknown as IDBOpenDBRequest;
        setTimeout(() => (req as unknown as { onerror: () => void }).onerror?.(), 0);
        return req;
      }
      return real(...a);
    });
    const m = await import('./idb');
    await expect(m.idbPut('backups', 9, 'x')).rejects.toBeDefined();
    await m.idbPut('backups', 9, 'x');
    expect(await m.idbGet('backups', 9)).toBe('x');
    vi.restoreAllMocks();
  });
});
