// e2e/collection.spec.ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test.describe(`collection at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    // iPhone 專案的 1280×800 是橫向，App 會顯示「把手機轉直」，只在電腦專案驗證。
    test.skip(({ isMobile }) => isMobile && viewport.width > viewport.height, '橫向手機不進遊戲');

    test('free gift box reveals an item and the 物品圖鑑 tab opens', async ({ page }) => {
      await seedSave(page, {});                                   // onboardingDone: true by default (contract §10.17)
      await page.goto('/');
      await page.getByTestId('tab-giftbox').click();
      await page.getByTestId('giftbox-open').click();
      await expect(page.getByText(/新收藏！|已經有了！/)).toBeVisible({ timeout: 4000 });
      await page.getByRole('button', { name: '好耶', exact: true }).click();
      await page.getByTestId('tab-album').click();
      await page.getByRole('button', { name: '物品圖鑑', exact: true }).click();
    });

    test('a placed furniture item survives a reload', async ({ page }) => {
      await seedSave(page, { inventory: { 'furn-plant-pot': 1 } }); // seeds only when no panda.save exists yet (Self-Review 16)
      await page.goto('/');
      await page.getByTestId('tab-closet').click();
      await page.getByRole('button', { name: '布置', exact: true }).click();
      await page.getByRole('button', { name: '擺放', exact: true }).click();
      await page.getByTestId('tray-furn-plant-pot').click();
      await expect(page.getByTestId('placed-furn-plant-pot#1')).toBeVisible();
      await page.reload();
      await page.getByTestId('tab-closet').click();
      await page.getByRole('button', { name: '布置', exact: true }).click();
      await expect(page.getByTestId('placed-furn-plant-pot#1')).toBeVisible();
    });
  });
}
