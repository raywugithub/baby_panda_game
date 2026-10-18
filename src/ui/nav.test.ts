import { describe, it, expect } from 'vitest';
import { tab, overlay, goTab, openOverlay, closeOverlay } from './nav';

describe('nav', () => {
  it('切換分頁與覆蓋層', () => {
    goTab('map');
    expect(tab.value).toBe('map');
    openOverlay({ kind: 'settings' });
    expect(overlay.value).toEqual({ kind: 'settings' });
    closeOverlay();
    expect(overlay.value).toBeNull();
  });
});
