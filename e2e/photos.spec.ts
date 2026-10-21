// e2e/photos.spec.ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

// 拍照存進 IndexedDB 後，重新整理仍能在 相簿 → 回憶照片 看到（不覆寫 IndexedDB，確保真的走 iOS 同款儲存路徑）。
test('a photo taken in 拍照 is still in 回憶照片 after reload', async ({ page }) => {
  await seedSave(page);
  await page.goto('/');
  await page.getByTestId('photo-open').click();
  await page.getByRole('button', { name: '拍照', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已存進相簿', { timeout: 15000 });
  await page.reload();
  await page.getByTestId('tab-album').click();
  await page.getByRole('button', { name: '回憶照片', exact: true }).click();
  await expect(page.getByTestId('photo-thumb')).toHaveCount(1, { timeout: 5000 });
});

// 照片是以獨立 SVG 圖片繪成的，頁面的 CSS 變數讀不到會變黑。這裡讀回真的存檔，檢查熊貓毛色出現。
test('the saved photo has real panda colours (not a black silhouette)', async ({ page }, testInfo) => {
  await seedSave(page);
  await page.goto('/');
  await page.getByTestId('photo-open').click();
  await page.getByRole('button', { name: '拍照', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已存進相簿', { timeout: 15000 });
  const result = await page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open('panda-db');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const rec: { bytes: ArrayBuffer; type: string } = await new Promise((res, rej) => {
      const store = db.transaction('photos').objectStore('photos');
      const k = store.getAllKeys();
      k.onsuccess = () => {
        const g = store.get(k.result[0]);
        g.onsuccess = () => res(g.result);
        g.onerror = () => rej(g.error);
      };
    });
    const img = new Image();
    const url = URL.createObjectURL(new Blob([rec.bytes], { type: rec.type }));
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('decode')); img.src = url; });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let fur = 0, dark = 0, total = 0;
    for (let i = 0; i < d.length; i += 4 * 7) {
      total++;
      const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
      if (Math.abs(r - 0xe9) < 12 && Math.abs(g - 0xdf) < 12 && Math.abs(b - 0xcf) < 12) fur++;
      if (r < 40 && g < 40 && b < 40) dark++;
    }
    return { fur: fur / total, dark: dark / total, png: c.toDataURL('image/png'), w: c.width, h: c.height };
  });
  const fs = await import('node:fs');
  const dir = '.superpowers/sdd/final/scratch/shots';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/photo-real-${testInfo.project.name}.png`, Buffer.from(result.png.split(',')[1], 'base64'));
  expect(result.fur).toBeGreaterThan(0.02);
  expect(result.dark).toBeLessThan(0.5);
});
