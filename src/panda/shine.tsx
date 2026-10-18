import type { JSX } from 'preact';

const STAR_R_OUT = 6;
const STAR_R_IN = 2.6;

/** 五角星路徑（以原點為中心）。 */
const STAR_D = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? STAR_R_OUT : STAR_R_IN;
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  return `${i === 0 ? 'M' : 'L'} ${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
}).join(' ') + ' Z';

const HALO_CX = 100;
const HALO_CY = 120;
const HALO_R = 100;

/** 光環：半透明圓與 4 + 2 × tier 個星點，角度均分於光環上。 */
export function Halo({ tier }: { tier: number }): JSX.Element {
  const n = 4 + 2 * tier;
  return (
    <g data-part="halo" pointer-events="none">
      <circle
        cx={HALO_CX}
        cy={HALO_CY}
        r={HALO_R}
        fill="var(--chain-light)"
        fill-opacity={0.18}
        stroke="var(--chain-light)"
        stroke-opacity={0.6}
        stroke-width={2}
      />
      {Array.from({ length: n }, (_, i) => {
        const a = (i * 2 * Math.PI) / n;
        const x = HALO_CX + (HALO_R - 8) * Math.cos(a);
        const y = HALO_CY + (HALO_R - 8) * Math.sin(a);
        const s = i % 2 === 0 ? 1 : 0.7;
        return (
          <path
            key={i}
            data-star
            d={STAR_D}
            transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s})`}
            fill="var(--chain-light)"
          />
        );
      })}
    </g>
  );
}

/** 毛色漸層（只定義一次，由 Panda 放在 defs 中）。 */
export function ShineDefs(): JSX.Element {
  return (
    <defs>
      <linearGradient id="fur-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--chain-light)', stopOpacity: 1 }} />
        <stop offset="1" style={{ stopColor: 'var(--chain-light)', stopOpacity: 0 }} />
      </linearGradient>
    </defs>
  );
}

/** 毛色光澤覆蓋層；透明度 = min(tier, 3) × 0.15。 */
export function FurShine({ tier, cx, cy, rx, ry }: {
  tier: number; cx: number; cy: number; rx: number; ry: number;
}): JSX.Element {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="url(#fur-shine)"
      opacity={Math.min(tier, 3) * 0.15}
      pointer-events="none"
    />
  );
}
