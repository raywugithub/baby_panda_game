import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

test('重新整理後進度仍在', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.waitForTimeout(1200); // 規格：狀態改變後 1 秒寫入
  const before = await page.evaluate(() => localStorage.getItem('panda.save'));
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('panda.save'))).toBe(before);
});

test('切到背景立即寫入（visibilitychange hidden），重新載入後心情保留', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('panda.save')!).needs.mood)).toBe(95);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('panda.save')!).needs.mood)).toBe(95);
});
