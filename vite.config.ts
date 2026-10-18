import { execSync } from 'node:child_process';
import { configDefaults, defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { PWA_OPTIONS } from './src/platform/pwa-config.js';

function gitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'dev';
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  base: './',
  plugins: [preact(), VitePWA(PWA_OPTIONS)],
  define: { __APP_VERSION__: JSON.stringify(gitHash()) },
  // e2e/ 由 Playwright 執行（npm run test:e2e），不交給 Vitest。
  test: { environment: 'jsdom', setupFiles: ['src/test-setup.ts'], exclude: [...configDefaults.exclude, 'e2e/**'] },
});
