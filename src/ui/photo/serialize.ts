const FONT_STACK = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
const EXTERNAL_PATTERNS = [
  /(href|src)\s*=\s*"(https?:|\/\/)/,
  /url\(\s*['"]?(https?:|\/\/)/,
  /@import|@font-face/,
];

export function serializeForPhoto(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('font-family', FONT_STACK);
  return resolveCssVars(new XMLSerializer().serializeToString(clone), svg);
}

/**
 * 序列化後的 SVG 以獨立圖片載入，讀不到頁面的 CSS 變數（var(--fur) 會變黑色）。
 * 這裡把 var(--x) 換成頁面上實際算出的顏色（含 svg 自己的覆寫），沒有值時用備用值。
 */
export function resolveCssVars(text: string, scope: Element): string {
  if (!text.includes('var(')) return text;
  const cs = getComputedStyle(scope);
  return text.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*?))?\s*\)/g, (m, name: string, fallback?: string) => {
    const v = cs.getPropertyValue(name).trim();
    return v || (fallback ? fallback.trim() : m);
  });
}

export function assertInlineOnly(text: string): void {
  if (EXTERNAL_PATTERNS.some((re) => re.test(text))) {
    throw new Error('external resource');
  }
}

export function photoSize(viewBox: { w: number; h: number }, longSide: number): { w: number; h: number } {
  const f = longSide / Math.max(viewBox.w, viewBox.h);
  return { w: Math.round(viewBox.w * f), h: Math.round(viewBox.h * f) };
}

function draw(text: string, size: { w: number; h: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size.w;
      canvas.height = size.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, size.w, size.h);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob returned null'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
  });
}

export async function photoToBlob(svg: SVGSVGElement): Promise<Blob> {
  const text = serializeForPhoto(svg);
  assertInlineOnly(text);
  const vb = svg.viewBox.baseVal;
  const viewBox = { w: vb.width, h: vb.height };
  try {
    return await draw(text, photoSize(viewBox, 1600));
  } catch {
    try {
      return await draw(text, photoSize(viewBox, 1080));
    } catch {
      throw new Error('這次拍不成功，再試一次');
    }
  }
}
