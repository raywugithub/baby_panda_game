import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}/`, trace: 'on-first-retry' },
  projects: [
    // 手機：iPhone 13 視窗（390×844）；Chromium 與 WebKit 各跑一次。
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    // 電腦：1280×800。
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-webkit', use: { browserName: 'webkit', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
