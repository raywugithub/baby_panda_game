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
