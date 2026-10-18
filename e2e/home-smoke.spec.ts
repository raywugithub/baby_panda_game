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

test('家畫面：安裝提示展開或收起時，照顧按鈕都沒有被蓋住', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-webkit', '只在 iPhone WebKit 驗證版面遮擋');
  // growthXp 275 = 第 5 格 → 階段 2，料理台才會啟用（階段 1 時按鈕是 disabled，trial click 會等不到）。
  await seedSave(page, { growthXp: 275 });
  // 有進度的 iPhone 會先跳「把熊貓搬到主畫面」，先標記為已關閉，讓測試停在家畫面。
  await page.addInitScript(() => {
    try { localStorage.setItem('panda.moveOutDismissed', '1'); } catch { /* 私密視窗略過 */ }
  });
  await page.goto('./');
  const careButtons = ['care-hug', 'care-feed', 'care-bath', 'care-play'];
  const kitchen = page.getByRole('button', { name: '料理台' });
  await expect(page.getByRole('button', { name: '收起' })).toBeVisible();
  for (const id of careButtons) {
    await expect(page.getByTestId(id)).toBeVisible();
    await page.getByTestId(id).click({ trial: true });
  }
  await expect(kitchen).toBeVisible();
  await kitchen.click({ trial: true });
  await page.getByRole('button', { name: '收起' }).click();
  await expect(page.getByRole('button', { name: '安裝提示' })).toBeVisible();
  for (const id of careButtons) {
    await expect(page.getByTestId(id)).toBeVisible();
    await page.getByTestId(id).click({ trial: true });
  }
  await expect(kitchen).toBeVisible();
  await kitchen.click({ trial: true });
});

test('抱抱後粒子層 canvas#fx 在 500ms 內畫出像素', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-webkit', '只在 iPhone WebKit 驗證粒子渲染');
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  // 愛心粒子壽命約 60 幀；每次輪詢都讀取畫布上 alpha > 0 的像素數。
  await expect.poll(
    () => page.evaluate(() => {
      const c = document.getElementById('fx') as HTMLCanvasElement | null;
      if (!c || c.width === 0 || c.height === 0) return 0;
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
      return n;
    }),
    { timeout: 500, intervals: [50, 100, 100, 100, 100] },
  ).toBeGreaterThan(0);
});
