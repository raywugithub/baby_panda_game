import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
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
  test: { environment: 'jsdom', setupFiles: ['src/test-setup.ts'] },
});
