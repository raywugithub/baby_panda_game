// 粒子特效：同時存在上限 60，Canvas DPR 上限 2，尊重 prefers-reduced-motion。
export type ParticleKind = 'hearts' | 'bubbles' | 'stars' | 'water';

export const PARTICLE_CAP = 60;

const COLORS: Record<ParticleKind, string> = {
  hearts: '#ff7aa2',
  bubbles: '#bfe6ff',
  stars: '#ffd86b',
  water: '#6fc3ff',
};

const LIFE_FRAMES = 60;

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

const live: Particle[] = [];
let rafId = 0;

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getCanvasCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.getElementById('fx') as HTMLCanvasElement | null;
  return canvas ? canvas.getContext('2d') : null;
}

function devicePixelCap(): number {
  return Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
}

/** 依 CSS 尺寸與 DPR（上限 2）設定 backing store；尺寸沒變時不重設（重設會清空畫布）。 */
export function sizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = devicePixelCap();
  const bw = Math.round(canvas.clientWidth * dpr);
  const bh = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
}

/** 視窗縮放或轉向時呼叫：立即同步畫布尺寸（沒有 #fx 時不做事）。 */
export function fitParticleCanvas(): void {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('fx') as HTMLCanvasElement | null;
  if (canvas) sizeCanvas(canvas);
}

function step(g: CanvasRenderingContext2D): void {
  const canvas = g.canvas;
  const dpr = devicePixelCap();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  sizeCanvas(canvas);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  for (let i = live.length - 1; i >= 0; i--) {
    const p = live[i];
    p.age++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    if (p.age >= LIFE_FRAMES) {
      live.splice(i, 1);
      continue;
    }
    g.globalAlpha = 1 - p.age / LIFE_FRAMES;
    g.fillStyle = COLORS[p.kind];
    g.beginPath();
    g.arc(p.x, p.y, 4, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  rafId = live.length > 0 ? requestAnimationFrame(() => step(g)) : 0;
}

export function burst(kind: ParticleKind, x: number, y: number, count = 12): void {
  if (reducedMotion()) return;
  const n = Math.max(0, Math.min(Math.floor(count), PARTICLE_CAP - live.length));
  const batch: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / Math.max(n, 1);
    const speed = 1 + (i % 3);
    batch.push({ kind, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, age: 0 });
  }
  live.push(...batch);
  if (batch.length === 0) return;

  const g = getCanvasCtx();
  if (g) {
    if (rafId === 0) rafId = requestAnimationFrame(() => step(g));
  } else {
    // 沒有 Canvas 時仍計數，壽命後移除
    setTimeout(() => {
      for (const p of batch) {
        const idx = live.indexOf(p);
        if (idx >= 0) live.splice(idx, 1);
      }
    }, LIFE_FRAMES * 16);
  }
}

export function particleCount(): number {
  return live.length;
}

export function resetParticles(): void {
  live.length = 0;
  rafId = 0;
}
