import { idbDelete, idbGet, idbKeys, idbPut } from './idb';
import { canSavePhoto } from '../core/album';

export interface PhotoRecord {
  id: string;
  createdAt: number;
  kind: 'photo' | 'commemorative' | 'legend';
  title: string;
  blob: Blob;
}

/** 寫入 IndexedDB 的格式：圖片以 ArrayBuffer 存放（iOS WebKit 對 Blob 的持久化較不可靠）。 */
interface StoredPhoto {
  id: string;
  createdAt: number;
  kind: PhotoRecord['kind'];
  title: string;
  bytes: ArrayBuffer;
  type: string;
}

/** 舊版格式（直接存 Blob）；讀取時原樣回傳。 */
interface LegacyPhoto extends Omit<PhotoRecord, 'blob'> {
  blob: Blob;
}

export type SaveResult = 'ok' | 'full' | 'unavailable';

function toStored(rec: PhotoRecord, bytes: ArrayBuffer): StoredPhoto {
  return {
    id: rec.id,
    createdAt: rec.createdAt,
    kind: rec.kind,
    title: rec.title,
    bytes,
    type: rec.blob.type,
  };
}

function fromStored(raw: StoredPhoto | LegacyPhoto): PhotoRecord {
  if ('bytes' in raw) {
    return {
      id: raw.id,
      createdAt: raw.createdAt,
      kind: raw.kind,
      title: raw.title,
      blob: new Blob([raw.bytes], { type: raw.type }),
    };
  }
  return raw;
}

/** 存入一張照片；傳說卡（id 以 `legend-` 開頭）不計入 200 張上限。 */
export async function savePhoto(rec: PhotoRecord): Promise<SaveResult> {
  try {
    const keys = await idbKeys('photos');
    const counted = keys.filter(k => !String(k).startsWith('legend-')).length;
    if (!canSavePhoto(counted)) return 'full';
    const bytes = await rec.blob.arrayBuffer();
    await idbPut('photos', rec.id, toStored(rec, bytes));
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

/** 列出所有照片，最新的在前。讀取失敗時回傳空陣列。 */
export async function listPhotos(): Promise<PhotoRecord[]> {
  try {
    const keys = await idbKeys('photos');
    const raws = await Promise.all(keys.map(k => idbGet<StoredPhoto | LegacyPhoto>('photos', k)));
    return raws
      .filter((r): r is StoredPhoto | LegacyPhoto => r !== undefined)
      .map(fromStored)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** 刪除一張照片。 */
export function deletePhoto(id: string): Promise<void> {
  return idbDelete('photos', id);
}
