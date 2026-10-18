import { describe, it, expect } from 'vitest';
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
