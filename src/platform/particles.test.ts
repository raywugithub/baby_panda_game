import { describe, it, expect, vi, beforeEach } from 'vitest';
import { burst, particleCount, resetParticles, PARTICLE_CAP, sizeCanvas, fitParticleCanvas } from './particles';

describe('particles', () => {
  beforeEach(() => resetParticles());

  it('同時存在的粒子不超過 60', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    burst('hearts', 10, 10, 100);
    expect(particleCount()).toBe(PARTICLE_CAP);
    expect(PARTICLE_CAP).toBe(60);
    vi.unstubAllGlobals();
  });
  it('小數 count 向下取整，仍不超過上限', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    burst('bubbles', 0, 0, 60.5);
    expect(particleCount()).toBe(60);
    vi.unstubAllGlobals();
  });
  it('減少動態時不產生粒子', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    burst('stars', 0, 0, 10);
    expect(particleCount()).toBe(0);
    vi.unstubAllGlobals();
  });
  it('畫布 backing store = CSS 尺寸 × min(DPR, 2)', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    const c = document.createElement('canvas');
    Object.defineProperty(c, 'clientWidth', { value: 390, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 844, configurable: true });
    sizeCanvas(c);
    expect(c.width).toBe(780);
    expect(c.height).toBe(1688);
    vi.unstubAllGlobals();
  });
  it('視窗縮放後 fitParticleCanvas 同步 #fx 的尺寸', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    const c = document.createElement('canvas');
    c.id = 'fx';
    document.body.appendChild(c);
    Object.defineProperty(c, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 300, configurable: true });
    fitParticleCanvas();
    expect([c.width, c.height]).toEqual([400, 300]);
    c.remove();
    vi.unstubAllGlobals();
  });
});
