import { describe, it, expect } from 'vitest';
import { APP_VERSION } from './version';

describe('APP_VERSION', () => {
  it('為 7 位 hex 短 hash 或 dev', () => {
    expect(APP_VERSION).toMatch(/^([0-9a-f]{7,12}|dev)$/);
  });
});
