import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

function gitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'dev';
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  base: './',
  plugins: [preact()],
  define: { __APP_VERSION__: JSON.stringify(gitHash()) },
  test: { environment: 'jsdom', setupFiles: ['src/test-setup.ts'] },
});
