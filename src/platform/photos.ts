import { idbDelete, idbGet, idbKeys, idbPut } from './idb';
import { canSavePhoto } from '../core/album';
import { makeThumb } from './thumb';

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
  /** 小縮圖（相簿格子用）；舊紀錄沒有，列出時補上。 */
  thumbBytes?: ArrayBuffer;
  thumbType?: string;
}

/** 相簿格子用：只帶縮圖，不帶完整圖片。 */
export interface PhotoCard {
  id: string;
  createdAt: number;
  kind: PhotoRecord['kind'];
  title: string;
  thumb?: Blob;
  /** 傳說卡的內文（沒有圖片）。 */
  text?: string;
}

/** 舊版格式（直接存 Blob）；讀取時原樣回傳。 */
interface LegacyPhoto extends Omit<PhotoRecord, 'blob'> {
  blob: Blob;
}

export type SaveResult = 'ok' | 'full' | 'unavailable';

function bufferOf(b: Blob): Promise<ArrayBuffer> {
  if (typeof b.arrayBuffer === 'function') return b.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(b);
  });
}

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
    const bytes = await bufferOf(rec.blob);
    const stored = toStored(rec, bytes);
    const thumb = await makeThumb(rec.blob);
    if (thumb) {
      stored.thumbBytes = await bufferOf(thumb);
      stored.thumbType = thumb.type;
    }
    await idbPut('photos', rec.id, stored);
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

/**
 * 列出相簿卡片（最新在前）。逐張讀取，只保留小縮圖，避免同時載入上百張大圖；
 * 舊紀錄沒有縮圖時現場產生並寫回，之後就不用再解碼大圖。
 */
export async function listPhotoCards(): Promise<PhotoCard[]> {
  try {
    const keys = await idbKeys('photos');
    const cards: PhotoCard[] = [];
    for (const k of keys) {
      let raw: StoredPhoto | LegacyPhoto | undefined;
      try {
        raw = await idbGet<StoredPhoto | LegacyPhoto>('photos', k);
      } catch {
        continue; // 單張讀不到不影響其他照片
      }
      if (!raw) continue;
      const text = (raw as { text?: string }).text;
      const meta = { id: raw.id, createdAt: raw.createdAt, kind: raw.kind, title: raw.title, ...(text !== undefined ? { text } : {}) };
      let thumb: Blob | undefined;
      try {
        if ('bytes' in raw && raw.thumbBytes) {
          thumb = new Blob([raw.thumbBytes], { type: raw.thumbType });
        } else if ('bytes' in raw || ('blob' in raw && raw.blob)) {
          const full = fromStored(raw).blob;
          thumb = await makeThumb(full);
          if (thumb) {
            const stored: StoredPhoto = 'bytes' in raw ? { ...raw } : toStored({ id: raw.id, createdAt: raw.createdAt, kind: raw.kind, title: raw.title, blob: full }, await bufferOf(full));
            stored.thumbBytes = await bufferOf(thumb);
            stored.thumbType = thumb.type;
            try {
              await idbPut('photos', raw.id, stored);
            } catch {
              // 寫回失敗不影響顯示
            }
          }
        }
      } catch {
        thumb = undefined; // 縮圖失敗仍列出卡片
      }
      cards.push({ ...meta, thumb });
    }
    return cards.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** 取得單張完整照片（點開大圖時才讀）。 */
export async function getPhotoBlob(id: string): Promise<Blob | undefined> {
  try {
    const raw = await idbGet<StoredPhoto | LegacyPhoto>('photos', id);
    return raw ? fromStored(raw).blob : undefined;
  } catch {
    return undefined;
  }
}
