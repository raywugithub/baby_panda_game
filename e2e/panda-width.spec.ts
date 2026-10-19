// e2e/panda-width.spec.ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

// 階段 1–4 的成長經驗值（與 core/growth 的階段門檻一致）。
const XP_BY_STAGE = [0, 300, 900, 1600];

// 量測熊貓「實際可見」寬度：隱藏其他元素與背景後截圖（透明背景），用 canvas 讀取 alpha 範圍。
// 點擊區的 DOM 寬度包含 SVG 透明邊，不能直接當作可見寬度。
test.describe('熊貓可見寬度（像素量測）', () => {
  test.skip(({ isMobile }) => !isMobile, '只在手機尺寸量測');

  for (const [i, xp] of XP_BY_STAGE.entries()) {
    test(`階段 ${i + 1}：可見寬度約為房間寬度的 35–45%`, async ({ page }) => {
      // 醒著（不受夜間睡覺影響）且需求值拉高，情緒為「開心」，待機姿勢固定為 dance。
      await seedSave(page, { growthXp: xp, awakeUntil: Date.now() + 3_600_000, needs: { tummy: 90, clean: 90, mood: 90 } });
      await page.goto('/');
      // 手機瀏覽器可能先跳出「加到主畫面」提示，蓋住主畫面；先關掉。
      const later = page.getByRole('button', { name: '先不用' });
      if (await later.count()) await later.first().click();
      await page.waitForSelector('.home-panda svg');
      // 升階慶祝、偷吃被抓包等暫時姿勢會改變寬度，等待機姿勢出現再量測。
      const pose = page.locator('.home-panda [data-pose]');
      await expect(pose).toHaveAttribute('data-pose', 'dance', { timeout: 8000 });
      await page.waitForTimeout(300);
      const room = await page.locator('.room').boundingBox();
      expect(room).not.toBeNull();
      await page.addStyleTag({
        content:
          'body *{visibility:hidden !important} .home-panda, .home-panda *{visibility:visible !important} ' +
          'html,body{background:transparent !important} .home-panda .surprise-msg{display:none !important}',
      });
      await page.waitForTimeout(300);
      const png = await page.screenshot({ omitBackground: true });
      const box = await page.evaluate(async (b64: string) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
        let l = width, r = -1;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 8) {
              if (x < l) l = x;
              if (x > r) r = x;
            }
          }
        }
        return { left: l, right: r + 1, pxPerCss: width / window.innerWidth };
      }, png.toString('base64'));
      const visibleCss = (box.right - box.left) / box.pxPerCss;
      const pct = (100 * visibleCss) / room!.width;
      const tag = `stage ${i + 1} pose ${await pose.getAttribute('data-pose')} visible width %`;
      expect(pct, tag).toBeGreaterThanOrEqual(35);
      expect(pct, tag).toBeLessThanOrEqual(45);
    });
  }
});
