import { describe, it, expect, vi, beforeEach } from 'vitest';
import { burst, particleCount, resetParticles, PARTICLE_CAP } from './particles';

describe('particles', () => {
  beforeEach(() => resetParticles());

  it('同時存在的粒子不超過 60', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    burst('hearts', 10, 10, 100);
    expect(particleCount()).toBe(PARTICLE_CAP);
    expect(PARTICLE_CAP).toBe(60);
    vi.unstubAllGlobals();
  });
  it('減少動態時不產生粒子', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    burst('stars', 0, 0, 10);
    expect(particleCount()).toBe(0);
    vi.unstubAllGlobals();
  });
});
