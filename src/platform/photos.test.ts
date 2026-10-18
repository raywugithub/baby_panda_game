import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { savePhoto, listPhotos, deletePhoto } from './photos';
import * as idb from './idb';

const rec = (i: number) => ({ id: `p${i}`, createdAt: i, kind: 'photo' as const, title: '', blob: new Blob(['x']) });

describe('photo storage', () => {
  it('saves, lists newest first, deletes', async () => {
    expect(await savePhoto(rec(1))).toBe('ok');
    expect(await savePhoto(rec(2))).toBe('ok');
    expect((await listPhotos()).map((p) => p.id)).toEqual(['p2', 'p1']);
    await deletePhoto('p1');
    expect((await listPhotos()).map((p) => p.id)).toEqual(['p2']);
  });
  it('returns full at the 200 cap', async () => {
    vi.spyOn(idb, 'idbKeys').mockResolvedValueOnce(new Array(200).fill('k'));
    expect(await savePhoto(rec(999))).toBe('full');
  });
  it('returns unavailable when IndexedDB throws', async () => {
    vi.spyOn(idb, 'idbKeys').mockRejectedValueOnce(new Error('no idb'));
    expect(await savePhoto(rec(998))).toBe('unavailable');
  });
  it('legend records do not count toward the 200 cap (199 photos + 50 legend keys still saves)', async () => {
    vi.spyOn(idb, 'idbKeys').mockResolvedValueOnce([...new Array(199).fill('photo-x'), ...new Array(50).fill('legend-x')]);
    expect(await savePhoto(rec(997))).toBe('ok');
  });
});
