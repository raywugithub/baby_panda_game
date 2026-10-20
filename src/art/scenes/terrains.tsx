import type { ComponentType, JSX } from 'preact';
import { PAL } from '../items/primitives';
import type { Terrain } from '../../core/state';

// 地形場景：360×480 座標系，天空在上、地面在下，前景裝飾有深淺層次。
// 版型 1 以左右鏡像為主，並加上獨有的元素（溪流、帆船），讓兩版看起來像不同的地方。

const MIRROR = 'translate(360 0) scale(-1 1)';

/** 天空漸層：整面畫到底（避免地面層之間露出空白），漸層只在 0..h 之間變化。 */
function Sky({ id, top, bottom, h = 300 }: { id: string; top: string; bottom: string; h?: number }): JSX.Element {
  return (
    <>
      <defs>
        <linearGradient id={`sky-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
          <stop offset="0" stop-color={top} />
          <stop offset="1" stop-color={bottom} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={360} height={480} fill={`url(#sky-${id})`} />
    </>
  );
}

/** 有描邊的圓形組合（雲、灌木、樹冠）：先畫外框圓，再畫填色圓，外框只露在外側。 */
function Blob({ parts, fill, line = PAL.brown }: { parts: [number, number, number][]; fill: string; line?: string }): JSX.Element {
  return (
    <g>
      {parts.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r + 2.2} fill={line} />)}
      {parts.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill={fill} />)}
    </g>
  );
}

function Cloud({ x, y, s = 1, fill = PAL.white, line = '#B9D6EE' }: { x: number; y: number; s?: number; fill?: string; line?: string }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Blob parts={[[0, 0, 16], [18, -8, 20], [40, 2, 15], [-18, 4, 12]]} fill={fill} line={line} />
    </g>
  );
}

function Tree({ x, y, s = 1, canopy = '#8FC27A', trunk = '#B88A62' }: { x: number; y: number; s?: number; canopy?: string; trunk?: string }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-7 0 Q-5 -30 -6 -50 L6 -50 Q5 -30 7 0Z" fill={trunk} stroke={PAL.brown} stroke-width={2} />
      <Blob parts={[[0, -70, 26], [-18, -54, 16], [18, -56, 17]]} fill={canopy} />
    </g>
  );
}

function Pine({ x, y, s = 1, c = '#7FB27A' }: { x: number; y: number; s?: number; c?: string }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={-10} width={6} height={12} fill="#A8745A" />
      <path d="M0 -70 L-22 -34 L22 -34Z M0 -54 L-27 -14 L27 -14Z" fill={c} stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
    </g>
  );
}

function Leaf({ x, y, rot = 0, len = 26, c = '#7FB27A' }: { x: number; y: number; rot?: number; len?: number; c?: string }): JSX.Element {
  return (
    <path d={`M0 0 Q${len / 2} -9 ${len} 0 Q${len / 2} 9 0 0Z`} fill={c} stroke={PAL.bambooDark} stroke-width={1.2}
      transform={`translate(${x} ${y}) rotate(${rot})`} />
  );
}

function Bamboo({ x, base, h, w = 12, c = PAL.bamboo, leaves = true }: { x: number; base: number; h: number; w?: number; c?: string; leaves?: boolean }): JSX.Element {
  const top = base - h;
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2} fill={c} stroke={PAL.bambooDark} stroke-width={2} />
      {[1, 2, 3, 4, 5].map(i => <rect key={i} x={x - w / 2 - 1} y={top + (i * h) / 6 - 1.5} width={w + 2} height={3} rx={1.5} fill={PAL.bambooDark} />)}
      {leaves && (
        <>
          <Leaf x={x} y={top + 6} rot={-160} len={30} />
          <Leaf x={x} y={top + 12} rot={-20} len={34} />
          <Leaf x={x} y={top + 22} rot={200} len={26} />
        </>
      )}
    </g>
  );
}

function Flower({ x, y, s = 1, c = PAL.pink }: { x: number; y: number; s?: number; c?: string }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V14" stroke="#6E9E58" stroke-width={2} />
      {[0, 72, 144, 216, 288].map(a => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 5} cy={Math.sin((a * Math.PI) / 180) * 5} r={4} fill={c} stroke={PAL.brown} stroke-width={1} />
      ))}
      <circle r={2.6} fill={PAL.gold} />
    </g>
  );
}

function Mush({ x, base, s = 1, cap = PAL.strawberry, spot = PAL.white }: { x: number; base: number; s?: number; cap?: string; spot?: string }): JSX.Element {
  const r = 14 * s;
  const cy = base - 14 * s;
  return (
    <g>
      <rect x={x - 4 * s} y={cy} width={8 * s} height={14 * s} rx={3 * s} fill={PAL.creamLight} stroke={PAL.brown} stroke-width={1.8} />
      <path d={`M${x - r} ${cy + 2} Q${x - r} ${cy - r} ${x} ${cy - r} Q${x + r} ${cy - r} ${x + r} ${cy + 2} Q${x} ${cy - 4} ${x - r} ${cy + 2}Z`}
        fill={cap} stroke={PAL.brown} stroke-width={1.8} stroke-linejoin="round" />
      <circle cx={x - r * 0.45} cy={cy - r * 0.45} r={2.4 * s} fill={spot} />
      <circle cx={x + r * 0.2} cy={cy - r * 0.6} r={1.8 * s} fill={spot} />
      <circle cx={x + r * 0.6} cy={cy - r * 0.1} r={1.6 * s} fill={spot} />
    </g>
  );
}

function Rock({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return <ellipse cx={x} cy={y} rx={12 * s} ry={7 * s} fill="#CFC6B6" stroke={PAL.brown} stroke-width={1.8} />;
}

function Tuft({ x, y, c = '#6E9E58' }: { x: number; y: number; c?: string }): JSX.Element {
  return <path d={`M${x} ${y} q-3 -8 -7 -10 M${x} ${y} q0 -10 0 -14 M${x} ${y} q3 -8 7 -10`} fill="none" stroke={c} stroke-width={2} stroke-linecap="round" />;
}

function Road({ d, w = 26 }: { d: string; w?: number }): JSX.Element {
  return (
    <g>
      <path d={d} fill="none" stroke={PAL.brown} stroke-opacity={0.35} stroke-width={w + 6} stroke-linecap="round" stroke-linejoin="round" />
      <path d={d} fill="none" stroke="#EAD9B3" stroke-width={w} stroke-linecap="round" stroke-linejoin="round" />
    </g>
  );
}

function Star({ x, y, r, fill = PAL.white }: { x: number; y: number; r: number; fill?: string }): JSX.Element {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return <path d={`M${pts.join(' L')}Z`} fill={fill} stroke={PAL.gold} stroke-width={0.8} />;
}

function Sparkle({ x, y, r = 4, c = PAL.white }: { x: number; y: number; r?: number; c?: string }): JSX.Element {
  return <path d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`} fill={c} />;
}

function Waves({ y, x0 = 0, x1 = 360, step = 46, c = PAL.white, op = 0.8 }: { y: number; x0?: number; x1?: number; step?: number; c?: string; op?: number }): JSX.Element {
  const items: number[] = [];
  for (let x = x0; x < x1; x += step) items.push(x);
  return (
    <g opacity={op}>
      {items.map((x, i) => (
        <path key={i} d={`M${x} ${y + (i % 2) * 8} q 8 -6 16 0 t 16 0`} fill="none" stroke={c} stroke-width={2} stroke-linecap="round" />
      ))}
    </g>
  );
}

function Sail({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -50 L0 -4 L-26 -4Z" fill={PAL.creamLight} stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
      <path d="M4 -40 L4 -4 L24 -4Z" fill={PAL.pink} stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
      <path d="M-30 -2 H28 L20 10 H-22Z" fill={PAL.terracotta} stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
    </g>
  );
}

function Gull({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return <path d={`M${x} ${y} q${6 * s} -${6 * s} ${12 * s} 0 q${6 * s} -${6 * s} ${12 * s} 0`} fill="none" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />;
}

function Snowman({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Blob parts={[[0, -8, 16], [0, -36, 12], [0, -58, 9]]} fill={PAL.white} line="#9DBBD6" />
      <circle cx={-3} cy={-60} r={1.4} fill={PAL.brown} />
      <circle cx={3} cy={-60} r={1.4} fill={PAL.brown} />
      <path d="M-6 -48 L6 -48 L6 -44 L-6 -44Z" fill={PAL.strawberry} />
      <path d="M0 -58 L9 -56 L0 -54Z" fill={PAL.terracotta} stroke={PAL.brown} stroke-width={1} />
    </g>
  );
}

function Shell({ x, y, s = 1, c = '#F6B3A8' }: { x: number; y: number; s?: number; c?: string }): JSX.Element {
  const ribs = [-30, -15, 0, 15, 30];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 L-22 -14 Q-16 -24 0 -22 Q16 -24 22 -14Z" fill={c} stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
      {ribs.map(a => <path key={a} d={`M0 0 L${Math.sin((a * Math.PI) / 180) * 16} ${-Math.cos((a * Math.PI) / 180) * 18}`} stroke={PAL.brown} stroke-width={1} opacity={0.5} />)}
    </g>
  );
}

function Starfish({ x, y, s = 1, c = '#F2A36B' }: { x: number; y: number; s?: number; c?: string }): JSX.Element {
  return <g transform={`translate(${x} ${y}) rotate(-12)`}><Star x={0} y={0} r={12 * s} fill={c} /></g>;
}

function Lantern({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-5} y={-22} width={10} height={20} fill="#CFC6B6" stroke={PAL.brown} stroke-width={1.8} />
      <path d="M-14 -22 L0 -32 L14 -22Z" fill="#B9B0A3" stroke={PAL.brown} stroke-width={1.8} stroke-linejoin="round" />
      <rect x={-8} y={-16} width={16} height={8} rx={2} fill="#FFE9A0" />
      <rect x={-3} y={-2} width={6} height={4} fill="#CFC6B6" stroke={PAL.brown} stroke-width={1.2} />
    </g>
  );
}

function Sign({ x, y, text }: { x: number; y: number; text?: string }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-2.5} y={0} width={5} height={44} fill="#A8745A" stroke={PAL.brown} stroke-width={1.5} />
      <rect x={-34} y={-6} width={68} height={20} rx={4} fill="#E9C48E" stroke={PAL.brown} stroke-width={2} />
      {text ? <text x={0} y={9} text-anchor="middle" font-size={12} fill={PAL.brown}>{text}</text> : <path d="M-18 4 H18" stroke={PAL.brown} stroke-width={1.5} stroke-linecap="round" />}
    </g>
  );
}

// ---------------- 竹林 ----------------
function BambooScene({ layout }: { layout: 0 | 1 }): JSX.Element {
  const m = layout === 1 ? MIRROR : undefined;
  return (
    <>
      <Sky id={`bamboo-${layout}`} top="#E2F4D4" bottom="#B9E0B0" />
      <circle cx={layout ? 84 : 290} cy={64} r={56} fill="#FFF8D6" opacity={0.7} />
      <circle cx={layout ? 84 : 290} cy={64} r={24} fill="#FFE98F" stroke={PAL.gold} stroke-width={2} />
      {[26, 58, 302, 336].map(x => <rect key={x} x={x - 4} y={112} width={8} height={176} fill="#A6CF99" />)}
      <path d="M0 262 Q70 226 140 252 T280 246 T360 258 V480 H0Z" fill="#A1CB8B" />
      <path d="M0 300 Q90 280 180 300 T360 296 V480 H0Z" fill="#94C27C" />
      <g transform={m}>
        <Road d="M140 480 Q186 440 184 400 Q182 360 150 336 Q122 314 158 286 Q184 264 166 244" />
        <Bamboo x={24} base={340} h={330} />
        <Bamboo x={46} base={340} h={300} w={10} />
        <Bamboo x={330} base={340} h={340} />
        <Bamboo x={312} base={340} h={280} w={10} />
        <Lantern x={268} y={346} s={1.1} />
        <Flower x={96} y={390} c={PAL.pink} />
        <Flower x={112} y={404} c="#FFF2B5" s={0.9} />
        <Flower x={286} y={420} c={PAL.pink} />
        <Mush x={60} base={446} s={0.9} cap="#E8879A" />
        <Mush x={302} base={392} s={0.7} cap="#F6D27A" spot={PAL.white} />
        <Rock x={230} y={438} s={1.1} />
        <Rock x={76} y={466} s={0.8} />
        <Tuft x={210} y={414} />
        <Tuft x={60} y={372} />
        <Tuft x={250} y={470} />
        <Sparkle x={178} y={320} r={3} c="#FFF6C9" />
        <Sparkle x={120} y={300} r={2.5} c="#FFF6C9" />
      </g>
      {layout === 1 && (
        <g>
          <path d="M0 418 Q56 402 84 436 Q104 468 60 480 H0Z" fill="#9FD3E6" stroke={PAL.brown} stroke-opacity={0.35} stroke-width={2} />
          <ellipse cx={30} cy={444} rx={9} ry={4} fill="#7FB27A" stroke={PAL.brown} stroke-width={1} />
          <ellipse cx={58} cy={458} rx={8} ry={3.5} fill="#7FB27A" stroke={PAL.brown} stroke-width={1} />
          <Waves y={432} x0={0} x1={80} step={30} c={PAL.white} op={0.9} />
        </g>
      )}
    </>
  );
}

// ---------------- 海邊 ----------------
function BeachScene({ layout }: { layout: 0 | 1 }): JSX.Element {
  const m = layout === 1 ? MIRROR : undefined;
  return (
    <>
      <Sky id={`beach-${layout}`} top="#B9E5F7" bottom="#EAF8FC" h={260} />
      <circle cx={layout ? 300 : 66} cy={62} r={30} fill="#FFF0A8" />
      <circle cx={layout ? 300 : 66} cy={62} r={44} fill="#FFF0A8" opacity={0.35} />
      <Gull x={150} y={70} s={1.1} />
      <Gull x={206} y={48} s={0.8} />
      <Gull x={262} y={92} s={0.9} />
      <rect x={0} y={190} width={360} height={110} fill="#6EC0E3" />
      <rect x={0} y={190} width={360} height={10} fill="#8FD2EC" />
      <Waves y={214} c="#BDE8F7" op={0.9} />
      <Waves y={244} c="#BDE8F7" op={0.9} />
      <Waves y={274} c="#BDE8F7" op={0.7} />
      <path d="M0 292 Q180 270 360 292 V480 H0Z" fill="#F6E3B4" />
      <path d="M0 300 Q180 282 360 300" fill="none" stroke="#FFFFFF" stroke-width={4} stroke-linecap="round" opacity={0.85} />
      <path d="M0 306 Q180 290 360 306" fill="none" stroke="#E9CF97" stroke-width={5} opacity={0.8} />
      <g transform={m}>
        <Sail x={250} y={216} s={0.7} />
        <Shell x={112} y={436} s={0.9} />
        <Shell x={250} y={448} s={1} c="#FFE6B3" />
        <Starfish x={220} y={356} s={1} />
        <Starfish x={300} y={460} s={0.8} c="#E8879A" />
        <Rock x={56} y={470} s={1.2} />
      </g>
      <g transform={m}>
        <g>
          <path d="M34 396 V300" stroke="#B88A62" stroke-width={7} stroke-linecap="round" />
          <path d="M34 300 Q16 290 2 304 M34 300 Q50 288 66 302 M34 300 Q24 282 22 268 M34 300 Q44 282 52 270" fill="none" stroke="#5E8C52" stroke-width={8} stroke-linecap="round" />
          <path d="M34 300 Q16 290 2 304 M34 300 Q50 288 66 302" fill="none" stroke="#7FB27A" stroke-width={3} stroke-linecap="round" />
        </g>
        <path d="M76 424 V336" stroke={PAL.brown} stroke-width={3} />
        <path d="M46 344 Q76 310 110 344 Q94 336 76 336 Q58 336 46 344Z" fill={PAL.pinkDeep} stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
        <path d="M58 340 Q76 318 94 340" fill="none" stroke={PAL.white} stroke-width={5} opacity={0.6} />
        <path d="M46 344 Q76 320 110 344" fill="none" stroke={PAL.brown} stroke-width={2} />
        <rect x={100} y={446} width={34} height={12} rx={4} fill="#E9CF97" stroke={PAL.brown} stroke-width={1.5} />
        <Shell x={200} y={470} s={0.6} c="#FFE6B3" />
      </g>
    </>
  );
}

// ---------------- 雲上 ----------------
function CloudScene({ layout }: { layout: 0 | 1 }): JSX.Element {
  const m = layout === 1 ? MIRROR : undefined;
  return (
    <>
      <Sky id={`cloud-${layout}`} top="#BFE3FA" bottom="#FDF0F7" h={340} />
      <circle cx={layout ? 84 : 292} cy={72} r={62} fill="#FFF6C9" opacity={0.35} />
      <circle cx={layout ? 84 : 292} cy={72} r={32} fill="#FFF6C9" stroke={PAL.gold} stroke-width={2} />
      <path d="M40 330 Q180 30 330 330" fill="none" stroke="#F4B6C2" stroke-width={5} opacity={0.5} />
      <path d="M52 330 Q180 50 318 330" fill="none" stroke="#F6DA8A" stroke-width={5} opacity={0.5} />
      <path d="M64 330 Q180 70 306 330" fill="none" stroke="#A8D48C" stroke-width={5} opacity={0.5} />
      <path d="M76 330 Q180 90 294 330" fill="none" stroke="#8FC4E8" stroke-width={5} opacity={0.5} />
      <Cloud x={62} y={176} s={0.7} />
      <Cloud x={300} y={206} s={0.6} />
      <Cloud x={176} y={300} s={0.4} />
      <Gull x={206} y={120} s={0.9} />
      <Gull x={226} y={138} s={0.7} />
      <path d="M0 336 Q34 300 84 316 Q132 292 182 314 Q232 290 282 314 Q328 298 360 318 V480 H0Z" fill="#F1F8FD" />
      <g transform={m}>
        {/* 雲朵台階：從近處一路往上爬到小島 */}
        <Cloud x={46} y={392} s={0.6} />
        <Cloud x={86} y={362} s={0.55} />
        <Cloud x={120} y={330} s={0.5} />
        <Cloud x={148} y={300} s={0.46} />
        {/* 漂浮的小島：草地、樹與花 */}
        <g transform="translate(262 286)">
          <path d="M-44 0 Q-44 -12 -20 -12 H24 Q44 -12 44 0 Q36 26 0 30 Q-36 26 -44 0Z" fill="#C98A63" stroke={PAL.brown} stroke-width={2.2} stroke-linejoin="round" />
          <path d="M-44 0 Q-44 -12 -20 -12 H24 Q44 -12 44 0 Q20 -4 0 -4 Q-20 -4 -44 0Z" fill="#9BCB7B" stroke={PAL.brown} stroke-width={2.2} stroke-linejoin="round" />
          <Tree x={-6} y={-8} s={0.42} canopy="#8FC27A" trunk="#B88A62" />
          <Flower x={22} y={-6} s={0.7} c="#F4B6C2" />
          <Flower x={30} y={-2} s={0.6} c="#FFF2B5" />
          <path d="M-30 14 Q-34 26 -26 34 M26 14 Q24 26 34 32" fill="none" stroke="#9BCB7B" stroke-width={2} stroke-linecap="round" />
        </g>
        {/* 遠處的小島 */}
        <g transform="translate(64 232)" opacity={0.7}>
          <path d="M-18 0 Q-18 -5 -8 -5 H8 Q18 -5 18 0 Q12 10 0 12 Q-12 10 -18 0Z" fill="#E8C7A6" stroke={PAL.brown} stroke-width={1.4} />
          <Blob parts={[[0, -12, 8]]} fill="#A8D48C" />
        </g>
        <Sparkle x={300} y={250} r={5} c={PAL.gold} />
        <Sparkle x={28} y={250} r={3.5} c={PAL.white} />
      </g>
      {/* 近處的雲海 */}
      <Cloud x={24} y={424} s={1.25} />
      <Cloud x={132} y={440} s={1.35} />
      <Cloud x={244} y={426} s={1.3} />
      <Cloud x={340} y={448} s={1.1} />
      <Sparkle x={210} y={400} r={4} c={PAL.white} />
    </>
  );
}

// ---------------- 雪山 ----------------
function SnowScene({ layout }: { layout: 0 | 1 }): JSX.Element {
  const m = layout === 1 ? MIRROR : undefined;
  return (
    <>
      <Sky id={`snow-${layout}`} top="#CFE7F6" bottom="#F5FBFE" h={300} />
      <path d="M-10 250 L60 130 L120 210 L168 146 L240 250Z" fill="#BCD6EA" />
      <path d="M50 150 L60 130 L74 150 L66 146 L60 152 L54 146Z" fill={PAL.white} />
      <path d="M160 170 L230 80 L300 170 L270 200 L230 178 L200 206 Z" fill="#AAC9E2" />
      <path d="M212 120 L230 80 L252 118 L240 110 L230 122 L220 110Z" fill={PAL.white} stroke="#AAC9E2" stroke-width={1} />
      <path d="M244 160 L318 96 L374 170 L340 176 L322 160 L300 178Z" fill="#BCD6EA" />
      <path d="M0 292 Q90 268 180 288 T360 284 V480 H0Z" fill="#E4F0FA" />
      <g transform={m}>
        <path d="M90 220 L14 380 L170 380Z" fill="#E4F0FA" stroke="#9DBBD6" stroke-width={2} stroke-linejoin="round" />
        <path d="M90 220 L60 286 L76 280 L90 300 L104 280 L122 286Z" fill={PAL.white} />
        <path d="M90 220 L14 380 L40 380 L92 300Z" fill="#CDE2F2" opacity={0.6} />
        <path d="M0 326 Q90 300 180 320 T360 316 V480 H0Z" fill="#FFFFFF" />
        <path d="M0 340 Q120 320 240 340 T360 336" fill="none" stroke="#C4DCEE" stroke-width={3} stroke-linecap="round" />
        {/* 山腳的松林（前後兩排） */}
        <Pine x={150} y={330} s={0.5} c="#9CC5B2" />
        <Pine x={172} y={332} s={0.56} c="#9CC5B2" />
        <Pine x={20} y={352} s={0.9} c="#6D9E88" />
        <Pine x={54} y={362} s={1.1} c="#7FB27A" />
        <Pine x={100} y={372} s={0.8} c="#6D9E88" />
        <Pine x={306} y={350} s={1} c="#6D9E88" />
        <Pine x={334} y={364} s={0.8} c="#7FB27A" />
        {/* 雪人與雪橇 */}
        <Snowman x={246} y={444} s={0.9} />
        <Snowman x={286} y={396} s={0.55} />
        <g transform="translate(150 430)">
          <path d="M-22 6 Q-24 -2 -14 -2 H20 Q26 -2 24 6" fill="none" stroke={PAL.brown} stroke-width={3} stroke-linecap="round" />
          <path d="M-18 8 L-22 16 M18 8 L22 16" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />
          <rect x={-14} y={-10} width={28} height={8} rx={3} fill={PAL.terracotta} stroke={PAL.brown} stroke-width={1.8} />
        </g>
        <path d="M120 470 Q150 430 176 420 Q196 412 210 396" fill="none" stroke="#B8D6EC" stroke-width={10} stroke-linecap="round" opacity={0.7} />
        <path d="M120 470 Q150 430 176 420 Q196 412 210 396" fill="none" stroke="#FFFFFF" stroke-width={5} stroke-linecap="round" />
        <Blob parts={[[64, 462, 10], [80, 452, 9], [52, 446, 7]]} fill={PAL.white} line="#9DBBD6" />
        <Tuft x={170} y={462} c="#A8C9DE" />
        <Sparkle x={150} y={300} r={4} c={PAL.white} />
        <Sparkle x={300} y={250} r={3} c={PAL.white} />
      </g>
      {layout === 0 ? (
        <g>
          <path d="M22 440 L84 420" stroke="#9DBBD6" stroke-width={2} stroke-linecap="round" />
          <path d="M22 448 L84 428" stroke="#9DBBD6" stroke-width={2} stroke-linecap="round" />
        </g>
      ) : (
        <g>
          <path d="M270 446 L332 424" stroke="#9DBBD6" stroke-width={2} stroke-linecap="round" />
          <path d="M270 454 L332 432" stroke="#9DBBD6" stroke-width={2} stroke-linecap="round" />
        </g>
      )}
    </>
  );
}

// ---------------- 蘑菇森林 ----------------
function MushroomScene({ layout }: { layout: 0 | 1 }): JSX.Element {
  const m = layout === 1 ? MIRROR : undefined;
  return (
    <>
      <Sky id={`mushroom-${layout}`} top="#EBDDF7" bottom="#FCE4EE" h={300} />
      {/* 遠景的大蘑菇剪影 */}
      <g opacity={0.45}>
        <Mush x={44} base={300} s={3.2} cap="#D7C3EA" spot="#F4F0FF" />
        <Mush x={318} base={290} s={2.8} cap="#F3C1D6" spot="#FFF6FA" />
      </g>
      <path d="M0 270 Q90 240 180 262 T360 258 V480 H0Z" fill="#CDE6BE" />
      <path d="M0 316 Q120 292 240 310 T360 306 V480 H0Z" fill="#B7DA9D" />
      <g transform={m}>
        <Mush x={96} base={284} s={1.6} cap="#B7AEE6" spot="#F4F0FF" />
        <Mush x={268} base={274} s={1.2} cap="#F6B3A8" />
        <Road d="M186 480 Q200 440 176 404 Q156 376 194 340 Q212 322 214 316" w={22} />
        <Mush x={60} base={380} s={1} cap="#F6B3A8" />
        <Mush x={312} base={378} s={1.2} cap="#F6D27A" spot={PAL.white} />
        <Mush x={250} base={444} s={1.6} cap="#E8879A" />
        <Mush x={118} base={456} s={1.1} cap="#8FC4E8" spot={PAL.white} />
        <Mush x={28} base={440} s={0.8} cap="#F6D27A" spot={PAL.white} />
        {/* 蕨葉 */}
        <path d="M40 430 Q28 400 44 378 M36 430 Q52 410 60 396" fill="none" stroke="#6E9E58" stroke-width={3} stroke-linecap="round" />
        <path d="M280 410 Q262 386 280 362" fill="none" stroke="#6E9E58" stroke-width={3} stroke-linecap="round" />
        <Leaf x={320} y={446} rot={-160} len={34} c="#9BCB7B" />
        <Leaf x={320} y={446} rot={-70} len={28} c="#9BCB7B" />
        <Leaf x={160} y={472} rot={-120} len={30} c="#9BCB7B" />
        <Tuft x={210} y={464} />
        <Tuft x={24} y={470} />
        <Flower x={146} y={402} c="#F4B6C2" s={0.7} />
        <Flower x={300} y={300} c="#FFF2B5" s={0.6} />
        {/* 夜光小點（螢火） */}
        {[[160, 430], [184, 442], [200, 414], [226, 388], [150, 404]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={7} fill="#FFF6C9" opacity={0.35} />
            <circle cx={x} cy={y} r={2.2} fill="#FFF6C9" />
          </g>
        ))}
      </g>
      {layout === 1 && (
        <g>
          <ellipse cx={92} cy={448} rx={38} ry={10} fill="#9FD3E6" stroke={PAL.brown} stroke-opacity={0.3} stroke-width={2} />
          <path d="M60 446 H130" stroke="#B88A62" stroke-width={5} stroke-linecap="round" />
          <Flower x={144} y={452} c="#F4B6C2" s={0.8} />
        </g>
      )}
    </>
  );
}

// ---------------- 星空湖 ----------------
const STARS: [number, number, number][] = [[24, 26, 2], [70, 14, 1.6], [120, 40, 2.2], [160, 18, 1.4], [200, 52, 2], [244, 22, 1.6], [330, 30, 2.4], [40, 96, 1.6],
  [96, 118, 2], [138, 92, 1.4], [186, 124, 2.2], [234, 100, 1.5], [312, 122, 2], [346, 166, 1.4], [18, 170, 2.2], [262, 176, 1.6], [150, 150, 1.8]];

function Reeds({ x, y, s = 1 }: { x: number; y: number; s?: number }): JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q-2 -22 -6 -38 M6 0 Q6 -20 10 -34 M-10 0 Q-12 -14 -16 -26" fill="none" stroke="#5E8C52" stroke-width={2.4} stroke-linecap="round" />
      <path d="M-6 -38 Q-6 -46 -6 -48 M10 -34 Q10 -42 10 -44" fill="none" stroke="#8B5E3C" stroke-width={4} stroke-linecap="round" />
    </g>
  );
}

function StarlakeScene({ layout }: { layout: 0 | 1 }): JSX.Element {
  const m = layout === 1 ? MIRROR : undefined;
  return (
    <>
      <Sky id={`starlake-${layout}`} top="#26305A" bottom="#7C6FB5" h={300} />
      {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? PAL.white : PAL.goldLight} />)}
      <ellipse cx={180} cy={120} rx={220} ry={34} fill="#FFFFFF" opacity={0.05} transform="rotate(-18 180 120)" />
      <circle cx={layout ? 62 : 296} cy={64} r={24} fill="#FFF6C9" />
      <circle cx={layout ? 72 : 286} cy={56} r={22} fill="#34406E" />
      <defs>
        <linearGradient id={`lake-grad-${layout}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5A74C0" />
          <stop offset="1" stop-color="#3B55A0" />
        </linearGradient>
      </defs>
      <path d="M-10 270 Q60 230 120 254 T250 240 T370 262 V300 H-10Z" fill="#2B3A5C" />
      <path d="M-10 290 Q80 268 170 282 T370 280 V300 H-10Z" fill="#33446E" />
      <rect x={0} y={280} width={360} height={200} fill={`url(#lake-grad-${layout})`} />
      {/* 湖面上的星影與月影 */}
      <ellipse cx={layout ? 96 : 264} cy={330} rx={18} ry={3} fill={PAL.goldLight} opacity={0.7} />
      <ellipse cx={layout ? 96 : 264} cy={356} rx={28} ry={3} fill={PAL.goldLight} opacity={0.5} />
      <ellipse cx={layout ? 96 : 264} cy={386} rx={36} ry={3} fill={PAL.goldLight} opacity={0.35} />
      <g transform={m}>
        {/* 湖畔的樹影與蘆葦 */}
        <path d="M-6 300 Q8 262 22 300 M16 300 Q32 258 44 300" fill="#2B3A5C" />
        <path d="M-6 332 Q4 290 12 332 M16 340 Q22 306 28 340" fill="none" stroke="#2B3A5C" stroke-width={4} stroke-linecap="round" />
        <Reeds x={20} y={352} s={1.2} />
        <Reeds x={38} y={360} s={0.9} />
        <path d="M0 446 Q60 436 90 470 Q100 480 30 480 H0Z" fill="#2E4478" />
        <Reeds x={14} y={470} s={1.1} />
        {/* 荷葉 */}
        <ellipse cx={200} cy={420} rx={14} ry={5} fill="#6EA58A" stroke={PAL.brown} stroke-width={1.4} />
        <ellipse cx={230} cy={446} rx={11} ry={4} fill="#6EA58A" stroke={PAL.brown} stroke-width={1.4} />
        <circle cx={204} cy={420} r={2.5} fill="#F4B6C2" />
        <Star x={70} y={330} r={6} fill="#FFF6C9" />
        <Star x={130} y={390} r={4} fill="#FFF6C9" />
        <Star x={300} y={430} r={5} fill="#FFF6C9" />
        <Star x={210} y={310} r={4} fill="#FFF6C9" />
        <Sparkle x={320} y={210} r={5} c="#FFF6C9" />
        <path d="M240 472 Q262 430 280 472" fill="#2B3A5C" opacity={0.5} />
      </g>
      {layout === 0 ? (
        <g>
          <path d="M140 430 L186 430 L178 442 H146Z" fill="#B88A62" stroke={PAL.brown} stroke-width={2} stroke-linejoin="round" />
          <path d="M160 430 V402" stroke={PAL.brown} stroke-width={2} />
          <path d="M160 404 L170 428 H160Z" fill={PAL.creamLight} stroke={PAL.brown} stroke-width={1.5} />
        </g>
      ) : (
        <g>
          <ellipse cx={244} cy={426} rx={22} ry={6} fill="#B88A62" stroke={PAL.brown} stroke-width={2} />
          <path d="M240 418 L240 396" stroke={PAL.brown} stroke-width={2} />
          <circle cx={240} cy={394} r={5} fill={PAL.goldLight} stroke={PAL.brown} stroke-width={1.5} />
        </g>
      )}
    </>
  );
}

// ---------------- 手工地點 ----------------

/** 竹林小徑：兩側竹林夾住一條石板路，路盡頭立著路標，慢慢（烏龜）在路上慢慢爬。 */
function BambooPathScene(): JSX.Element {
  return (
    <>
      <Sky id="bamboo-path" top="#D8EFCB" bottom="#A9D89A" h={300} />
      {[18, 340, 300, 60].map((x, i) => <rect key={i} x={x - 4} y={60} width={8} height={230} fill="#9CC98A" opacity={0.6} />)}
      <path d="M0 258 Q90 230 180 250 T360 252 V480 H0Z" fill="#9CC98A" />
      <path d="M0 330 Q90 306 180 326 T360 322 V480 H0Z" fill="#8DBE78" />
      <Road d="M180 480 Q168 430 186 390 Q206 350 180 316 Q162 296 180 272" w={44} />
      {[[168, 452], [196, 428], [172, 404], [192, 378], [176, 352], [186, 326], [178, 300]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={9} ry={5} fill="#D9CDB0" stroke={PAL.brown} stroke-width={1.2} />
      ))}
      <Bamboo x={20} base={372} h={360} />
      <Bamboo x={44} base={380} h={330} w={10} />
      <Bamboo x={336} base={372} h={360} />
      <Bamboo x={312} base={380} h={330} w={10} />
      <Bamboo x={84} base={330} h={230} w={8} c="#B5DA9F" />
      <Bamboo x={276} base={330} h={230} w={8} c="#B5DA9F" />
      <Lantern x={112} y={360} s={1.3} />
      <Lantern x={250} y={360} s={1.3} />
      <Sign x={180} y={228} text="小徑" />
      <Tuft x={124} y={448} />
      <Tuft x={246} y={440} />
      <Flower x={96} y={414} c="#FFF2B5" />
      <Flower x={262} y={420} c={PAL.pink} />
      <Mush x={230} base={470} s={0.8} cap="#F6B3A8" />
      {/* 慢慢（烏龜）在路上 */}
      <g transform="translate(180 448)">
        <ellipse cx={0} cy={6} rx={22} ry={5} fill={PAL.brown} opacity={0.15} />
        <ellipse cx={0} cy={-2} rx={16} ry={11} fill="#8FC27A" stroke={PAL.brown} stroke-width={2} />
        <path d="M-8 -6 L-4 -12 L4 -12 L8 -6 M-4 -2 L4 -2 M-8 -4 L-8 0 M8 -4 L8 0" fill="none" stroke={PAL.bambooDark} stroke-width={1.2} />
        <circle cx={17} cy={-6} r={6} fill="#B5DA9F" stroke={PAL.brown} stroke-width={1.8} />
        <circle cx={19} cy={-7} r={1.2} fill={PAL.brown} />
        <path d="M-14 8 l-3 4 M12 8 l3 4" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />
      </g>
      <Sparkle x={300} y={200} r={4} c={PAL.white} />
      <Sparkle x={70} y={250} r={3} c={PAL.white} />
    </>
  );
}

/** 雲朵郵局：飄在雲上的白牆小郵局，紅屋頂、門口有紅色郵筒，空中飛著信封。 */
function CloudPostScene(): JSX.Element {
  return (
    <>
      <Sky id="cloud-post" top="#BFE2FA" bottom="#FCEFF6" h={330} />
      <circle cx={318} cy={60} r={26} fill="#FFF6C9" />
      <Cloud x={60} y={100} s={0.8} />
      <Cloud x={300} y={190} s={0.6} />
      <Cloud x={24} y={230} s={0.5} />
      {/* 飛來飛去的信封 */}
      {[[40, 170, -14], [288, 262, 12], [196, 130, -6]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <rect x={-14} y={-9} width={28} height={18} rx={2} fill={PAL.white} stroke={PAL.brown} stroke-width={1.6} />
          <path d="M-14 -9 L0 3 L14 -9" fill="none" stroke={PAL.strawberry} stroke-width={1.8} stroke-linejoin="round" />
        </g>
      ))}
      <path d="M0 330 Q40 300 90 320 Q140 298 190 318 Q240 294 290 316 Q330 302 360 322 V480 H0Z" fill="#EEF7FD" />
      <path d="M0 360 Q120 340 240 356 T360 352" fill="none" stroke="#C9E4F5" stroke-width={3} stroke-linecap="round" />
      {/* 郵局主體 */}
      <rect x={96} y={250} width={168} height={120} fill="#FFFDF6" stroke={PAL.brown} stroke-width={2.5} stroke-linejoin="round" />
      <path d="M84 254 L180 186 L276 254 Z" fill={PAL.strawberry} stroke={PAL.brown} stroke-width={2.5} stroke-linejoin="round" />
      <circle cx={180} cy={232} r={11} fill={PAL.gold} stroke={PAL.brown} stroke-width={2} />
      <path d="M174 232 L180 226 L186 232 L186 238 L174 238Z" fill={PAL.white} />
      <rect x={122} y={274} width={36} height={30} rx={3} fill="#BFE2FA" stroke={PAL.brown} stroke-width={2} />
      <path d="M140 274 V304 M122 289 H158" stroke={PAL.brown} stroke-width={1.5} />
      <rect x={202} y={274} width={36} height={30} rx={3} fill="#BFE2FA" stroke={PAL.brown} stroke-width={2} />
      <path d="M220 274 V304 M202 289 H238" stroke={PAL.brown} stroke-width={1.5} />
      <rect x={164} y={320} width={32} height={50} rx={16} fill="#8FC4E8" stroke={PAL.brown} stroke-width={2} />
      <rect x={114} y={312} width={18} height={14} fill="#FCE3B0" stroke={PAL.brown} stroke-width={1.4} />
      {/* 郵筒、旗子與花盆 */}
      <rect x={58} y={350} width={22} height={34} rx={6} fill={PAL.strawberry} stroke={PAL.brown} stroke-width={2} />
      <rect x={60} y={360} width={18} height={4} fill={PAL.brown} opacity={0.4} />
      <path d="M52 350 Q69 338 86 350" fill={PAL.strawberry} stroke={PAL.brown} stroke-width={2} />
      <path d="M276 260 V226" stroke={PAL.brown} stroke-width={2.5} />
      <path d="M276 226 L300 232 L276 240Z" fill={PAL.gold} stroke={PAL.brown} stroke-width={1.6} />
      <Blob parts={[[300, 392, 14], [316, 380, 12]]} fill="#A8D48C" />
      <Flower x={290} y={410} c={PAL.pink} />
      <Flower x={270} y={438} c="#FFF2B5" s={0.9} />
      {/* 雲朵鋪成的小路 */}
      <Blob parts={[[126, 420, 14], [154, 412, 12], [196, 430, 14]]} fill={PAL.white} line="#B9D6EE" />
      <Blob parts={[[62, 452, 10], [96, 466, 10]]} fill={PAL.white} line="#B9D6EE" />
      <Sparkle x={160} y={160} r={4} c={PAL.gold} />
      <Sparkle x={330} y={300} r={3} c={PAL.white} />
    </>
  );
}

/** 貝殼灣：傍晚的海灣，沙灘上有糖果小攤（橘子的店）、大貝殼與一隻橫行的螃蟹。 */
function ShellBayScene(): JSX.Element {
  return (
    <>
      <Sky id="shell-bay" top="#FFD9B0" bottom="#FFF3DD" h={250} />
      <circle cx={180} cy={150} r={34} fill="#FFE3A3" opacity={0.9} />
      <rect x={0} y={206} width={360} height={60} fill="#7EC6E1" />
      <Waves y={222} c="#D4F0FA" op={0.9} />
      <Waves y={246} c="#D4F0FA" op={0.8} />
      <path d="M0 252 Q180 236 360 252 V480 H0Z" fill="#F7E0B0" />
      <path d="M0 260 Q180 244 360 260" fill="none" stroke="#FFFFFF" stroke-width={4} stroke-linecap="round" opacity={0.85} />
      {/* 糖果攤 */}
      <rect x={224} y={290} width={100} height={70} fill="#FFF7EC" stroke={PAL.brown} stroke-width={2.5} stroke-linejoin="round" />
      <path d="M212 296 L324 296 L334 280 L202 280Z" fill={PAL.terracotta} stroke={PAL.brown} stroke-width={2.5} stroke-linejoin="round" />
      {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${214 + i * 20} 282 L${222 + i * 20} 282 L${222 + i * 20} 296 L${214 + i * 20} 296Z`} fill={PAL.creamLight} />)}
      <rect x={236} y={318} width={22} height={30} rx={9} fill={PAL.goldLight} stroke={PAL.brown} stroke-width={2} />
      <rect x={270} y={318} width={22} height={30} rx={9} fill={PAL.pink} stroke={PAL.brown} stroke-width={2} />
      <rect x={300} y={322} width={14} height={14} rx={3} fill="#B7AEE6" stroke={PAL.brown} stroke-width={1.6} />
      <rect x={236} y={300} width={80} height={10} fill={PAL.strawberry} opacity={0.8} />
      <path d="M198 280 V248" stroke={PAL.brown} stroke-width={2.5} />
      <path d="M198 248 L218 254 L198 260Z" fill={PAL.strawberry} stroke={PAL.brown} stroke-width={1.6} />
      {/* 沙灘與貝殼 */}
      <Shell x={80} y={330} s={1.8} c="#F6B3A8" />
      <Shell x={58} y={424} s={1.4} c="#FFE6B3" />
      <Shell x={150} y={440} s={1.6} c="#F6B3A8" />
      <Shell x={260} y={456} s={1.2} c="#CFE7F5" />
      <Starfish x={130} y={364} s={1.1} />
      <Starfish x={330} y={404} s={0.9} c="#E8879A" />
      <Rock x={36} y={460} s={1.2} />
      {/* 螃蟹 */}
      <g transform="translate(104 404)">
        <ellipse cx={0} cy={0} rx={14} ry={9} fill="#E8879A" stroke={PAL.brown} stroke-width={2} />
        <path d="M-14 -2 L-24 -10 M-14 4 L-24 8 M14 -2 L24 -10 M14 4 L24 8" stroke={PAL.brown} stroke-width={2} stroke-linecap="round" />
        <circle cx={-5} cy={-8} r={2.4} fill={PAL.white} stroke={PAL.brown} stroke-width={1} />
        <circle cx={5} cy={-8} r={2.4} fill={PAL.white} stroke={PAL.brown} stroke-width={1} />
      </g>
      {/* 腳印 */}
      {[[196, 396], [212, 384], [228, 400], [244, 388]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={3} ry={2} fill="#D9B98C" />
      ))}
      <Sparkle x={300} y={200} r={4} c={PAL.white} />
      <Sparkle x={60} y={190} r={3} c={PAL.white} />
    </>
  );
}

// ---------------- 對外匯出 ----------------

export const HANDMADE_SCENES: Record<'bamboo-path' | 'cloud-post' | 'shell-bay', ComponentType> = {
  'bamboo-path': BambooPathScene,
  'cloud-post': CloudPostScene,
  'shell-bay': ShellBayScene,
};

export const TERRAIN_SCENES: Record<`${Terrain}-${0 | 1}`, ComponentType> = {
  'bamboo-0': () => <BambooScene layout={0} />,
  'bamboo-1': () => <BambooScene layout={1} />,
  'beach-0': () => <BeachScene layout={0} />,
  'beach-1': () => <BeachScene layout={1} />,
  'cloud-0': () => <CloudScene layout={0} />,
  'cloud-1': () => <CloudScene layout={1} />,
  'snow-0': () => <SnowScene layout={0} />,
  'snow-1': () => <SnowScene layout={1} />,
  'mushroom-0': () => <MushroomScene layout={0} />,
  'mushroom-1': () => <MushroomScene layout={1} />,
  'starlake-0': () => <StarlakeScene layout={0} />,
  'starlake-1': () => <StarlakeScene layout={1} />,
};

/** 天氣覆蓋層與地形場景一併匯出（測試與呼叫端都從這裡取得）。 */
export { WEATHER_OVERLAYS } from './weather';
