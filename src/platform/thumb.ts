export const THUMB_SIDE = 240;

/** 把照片縮成小縮圖（長邊 240px）；環境不支援或解碼失敗時回傳 undefined。 */
export async function makeThumb(blob: Blob): Promise<Blob | undefined> {
  // 沒有 createImageBitmap 的環境（舊瀏覽器、測試）不產生縮圖，也不等待解碼。
  if (typeof createImageBitmap !== 'function') return undefined;
  let url: string | undefined;
  try {
    const img = new Image();
    url = URL.createObjectURL(blob);
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode failed'));
      setTimeout(() => reject(new Error('decode timeout')), 8000);
    });
    img.src = url;
    await loaded;
    const f = THUMB_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1);
    const w = Math.max(1, Math.round(img.naturalWidth * Math.min(1, f)));
    const h = Math.max(1, Math.round(img.naturalHeight * Math.min(1, f)));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, w, h);
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    canvas.width = 0; // 盡快釋放畫布記憶體（iOS）
    return out ?? undefined;
  } catch {
    return undefined;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}
