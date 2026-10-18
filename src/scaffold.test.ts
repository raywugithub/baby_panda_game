import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import config from '../vite.config';

describe('scaffold', () => {
  it('viewport meta 含 viewport-fit=cover', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
    expect(html).toContain('lang="zh-Hant-TW"');
  });
  it('vite base 為相對路徑', () => {
    expect(config.base).toBe('./');
  });
  it('global.css 有 dvh、觸控與橫放提示規則', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('100dvh');
    expect(css).toContain('-webkit-touch-callout: none');
    expect(css).toContain('(orientation: landscape) and (pointer: coarse)');
    expect(css).toContain('min-height: 44px');
  });
});
