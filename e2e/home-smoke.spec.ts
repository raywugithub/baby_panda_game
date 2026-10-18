import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

test('家的照顧循環：抱抱、餵食、切到窗外分頁', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.getByTestId('care-feed').click();
  await page.getByTestId('tray-food-bamboo-cake').dragTo(page.getByTestId('panda-mouth'));
  await expect(page.getByRole('meter', { name: '肚子' })).toHaveAttribute('aria-valuenow', '95');
  await page.getByTestId('tab-map').click();
  await expect(page.getByTestId('tab-map')).toHaveAttribute('aria-current', 'page');
});

test('新遊戲引導：iPhone 先點「先在這裡玩」，再開箱、看序章、抱抱與餵食後落在窗外分頁', async ({ page }) => {
  await page.goto('./'); // 沒有存檔 → 引導
  const playHere = page.getByRole('button', { name: '先在這裡玩' });
  if (await playHere.count()) await playHere.click();
  await page.getByTestId('box-peek').click();
  for (let i = 0; i < 12 && (await page.getByTestId('dialogue-box').count()); i++) {
    await page.getByTestId('dialogue-next').click();
  }
  await page.getByTestId('care-hug').click();
  await page.getByTestId('care-feed').click();
  await page.getByTestId('tray-food-bamboo-cake').dragTo(page.getByTestId('panda-mouth'));
  await expect(page.getByTestId('tab-map')).toHaveAttribute('aria-current', 'page');
});

test('版面沒有水平捲動', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
