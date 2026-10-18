import { idbDelete, idbGet, idbKeys, idbPut } from './idb';
import { canSavePhoto } from '../core/album';

export interface PhotoRecord {
  id: string;
  createdAt: number;
  kind: 'photo' | 'commemorative' | 'legend';
  title: string;
  blob: Blob;
}

export type SaveResult = 'ok' | 'full' | 'unavailable';

/** 存入一張照片；傳說卡（id 以 `legend-` 開頭）不計入 200 張上限。 */
export async function savePhoto(rec: PhotoRecord): Promise<SaveResult> {
  try {
    const keys = await idbKeys('photos');
    const counted = keys.filter(k => !String(k).startsWith('legend-')).length;
    if (!canSavePhoto(counted)) return 'full';
    await idbPut('photos', rec.id, rec);
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

/** 列出所有照片，最新的在前。讀取失敗時回傳空陣列。 */
export async function listPhotos(): Promise<PhotoRecord[]> {
  try {
    const keys = await idbKeys('photos');
    const recs = await Promise.all(keys.map(k => idbGet<PhotoRecord>('photos', k)));
    return recs
      .filter((r): r is PhotoRecord => r !== undefined)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** 刪除一張照片。 */
export function deletePhoto(id: string): Promise<void> {
  return idbDelete('photos', id);
}
