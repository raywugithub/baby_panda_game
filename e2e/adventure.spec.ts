import { test, expect, type Page } from '@playwright/test';
import { seedSave } from './fixtures';
import { CHAPTER_SCRIPTS } from '../src/content/story/chapters';

// 在 iPhone（非獨立 App）上，有進度的存檔會先跳「把熊貓搬到主畫面」；標記為已關閉，讓測試停在遊戲畫面。
async function start(page: Page, patch: Parameters<typeof seedSave>[1] = {}): Promise<void> {
  await seedSave(page, patch);
  await page.addInitScript(() => {
    try { localStorage.setItem('panda.moveOutDismissed', '1'); } catch { /* 私密視窗略過 */ }
  });
  await page.goto('./');
}

// 在窗外地圖完成竹林小徑（手工地點，節點 id 1）：說話 → 找到寶物 → 完成。
async function completeBambooPath(page: Page): Promise<void> {
  await page.getByTestId('tab-map').click();
  await page.getByTestId('map-node-1').click();
  await page.getByTestId('talk-button').click();
  await page.getByTestId('hotspot-treasure').click();
  await page.getByTestId('complete-button').click();
}

// 目前衣櫃布置畫面中所有已擺放家具的 testid。
async function placedIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid^="placed-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!));
}

test('new game → hug → feed → complete 竹林小徑 → open gift box → place furniture → reload keeps progress', async ({ page }) => {
  // 衣櫃「擺放」清單只列出尚未擺進房間的家具，所以多給一個 furn-nest。
  await start(page, {
    inventory: {
      'food-bamboo-cake': 3,
      'food-strawberry-mochi': 2,
      'wall-default': 1,
      'floor-default': 1,
      'furn-nest': 2,
      'furn-low-table': 1,
      'furn-cushion': 1,
      'pendant-bamboo': 1,
    },
  });
  await page.getByTestId('care-hug').click();
  await page.getByTestId('care-feed').click();
  await page.getByTestId('tray-food-bamboo-cake').dragTo(page.getByTestId('panda-mouth'));

  await completeBambooPath(page);

  await page.getByTestId('tab-giftbox').click();
  await page.getByTestId('giftbox-open').click();
  await page.getByRole('button', { name: '好耶' }).click();

  // 衣櫃的布置分段 → 擺放 → 點選清單中的家具（tray-<itemId>），會放進第一個空格。
  await page.getByTestId('tab-closet').click();
  await page.getByRole('button', { name: '布置', exact: true }).click();
  await page.getByRole('button', { name: '擺放', exact: true }).click();
  const before = await placedIds(page);
  await page.getByTestId('tray-furn-nest').click();
  const added = (await placedIds(page)).filter((id) => !before.includes(id));
  expect(added).toHaveLength(1);
  await expect(page.getByTestId(added[0])).toBeVisible();

  await page.reload();
  await page.getByTestId('tab-map').click();
  await expect(page.getByTestId('stamp-1')).toBeVisible();
  await page.getByTestId('tab-closet').click();
  await page.getByRole('button', { name: '布置', exact: true }).click();
  await expect(page.getByTestId(added[0])).toBeVisible();
});

test('切到背景會立即寫入：完成地點後 visibilitychange hidden，重新載入後蓋章與元氣仍在', async ({ page }) => {
  await start(page, {});
  await completeBambooPath(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('panda.save')!));
  expect(saved.completedCount).toBe(1);
  expect(saved.energy).toBe(75); // 完成地點扣 25 元氣
  await page.reload();
  await page.getByTestId('tab-map').click();
  await expect(page.getByTestId('stamp-1')).toBeVisible();
});

test('completing the third location opens chapter 1 automatically', async ({ page }) => {
  await start(page, { completedCount: 2, energy: 100 }); // 第 3 個完成地點觸發 ch1（契約 §10.8）
  await completeBambooPath(page);
  await expect(page.getByText(CHAPTER_SCRIPTS.ch1.lines[0].text)).toBeVisible();
});

test('map scroll container stays touch-action pan-y and page has no horizontal scroll', async ({ page }) => {
  await start(page, {});
  await page.getByTestId('tab-map').click();
  const scroller = page.getByTestId('map-scroll');
  await expect(scroller).toHaveCSS('touch-action', 'pan-y');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
