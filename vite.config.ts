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

// Node 22.4+ 才有 --no-experimental-webstorage；Node 20（CI）傳入會讓 worker 啟動失敗，所以要看版本。
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const hasWebstorageFlag = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 4);

export default defineConfig({
  base: './',
  plugins: [preact(), VitePWA(PWA_OPTIONS)],
  define: { __APP_VERSION__: JSON.stringify(gitHash()) },
  // e2e/ 由 Playwright 執行（npm run test:e2e），不交給 Vitest。
  test: { ...(hasWebstorageFlag ? { execArgv: ['--no-experimental-webstorage'] } : {}), environment: 'jsdom', setupFiles: ['src/test-setup.ts'], exclude: [...configDefaults.exclude, 'e2e/**'] },
});
