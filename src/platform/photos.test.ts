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
  it('stores the image as bytes (not a Blob) and reads back an identical Blob', async () => {
    const data = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
    const id = 'bytes-1';
    expect(await savePhoto({ id, createdAt: 5000, kind: 'photo', title: 't', blob: new Blob([data], { type: 'image/png' }) })).toBe('ok');
    const raw = await idb.idbGet<Record<string, unknown>>('photos', id);
    // fake-indexeddb 的 structured clone 會產生另一個 realm 的 ArrayBuffer，instanceof 會失準，改用 toString 標籤判斷。
    expect(Object.prototype.toString.call(raw!.bytes)).toBe('[object ArrayBuffer]');
    expect((raw!.bytes as ArrayBuffer).byteLength).toBe(data.byteLength);
    expect(raw).not.toHaveProperty('blob');
    expect(raw!.type).toBe('image/png');
    const back = (await listPhotos()).find((p) => p.id === id)!;
    expect(back.blob).toBeInstanceOf(Blob);
    expect(back.blob.size).toBe(data.byteLength);
    expect(back.blob.type).toBe('image/png');
    expect(new Uint8Array(await back.blob.arrayBuffer())).toEqual(data);
    expect(back.kind).toBe('photo');
    expect(back.title).toBe('t');
    expect(back.createdAt).toBe(5000);
  });
  it('still reads an old-format record that holds a Blob', async () => {
    const blob = new Blob(['old'], { type: 'image/png' });
    await idb.idbPut('photos', 'old-1', { id: 'old-1', createdAt: 9000, kind: 'commemorative', title: 'old', blob });
    const back = (await listPhotos()).find((p) => p.id === 'old-1')!;
    // jsdom 的 Blob 經 structured clone 後不保留內容，所以只驗證 blob 欄位被原樣回傳。
    expect(back).toHaveProperty('blob');
    expect(back.kind).toBe('commemorative');
    await deletePhoto('old-1');
  });
});
