import type { JSX } from 'preact';

// 約定：L = 熊貓自己的左側（畫面右側）；R = 熊貓自己的右側（畫面左側）。
// 旋轉中心（pivot）皆使用 viewBox 座標，部件嵌套時仍對齊同一座標系。
// 頭的旋轉中心放在下巴／脖子處，讓嬰兒大頭縮放時下巴與項圈位置不動。
export const PIVOTS = {
  body: [100, 200],
  head: [100, 134],
  armL: [126, 142],
  armR: [74, 142],
  legL: [116, 206],
  legR: [84, 206],
  tail: [150, 200],
} as const;

/** 頭部橢圓（頭部座標系）：約佔全身高的一半，為 chibi 比例。 */
export const HEAD = { cx: 100, cy: 84, rx: 54, ry: 52 } as const;

const EAR_X = { L: 140, R: 60 } as const;
const EAR_Y = 48;
const LEG_X = { L: 120, R: 80 } as const;
const ARM_X = { L: 128, R: 72 } as const;
const EYE_X = { L: 120, R: 80 } as const;
const EYE_Y = 92;
const CHEEK_X = { L: 134, R: 66 } as const;

type Side = 'L' | 'R';
interface Movable { transform: string }

/** 毛邊輪廓：沿橢圓等分點以小圓弧相連，形成蓬鬆的毛絨外緣。 */
function scallopPath(cx: number, cy: number, rx: number, ry: number, n: number, r: number): string {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i <= n; i++) {
    const [x, y] = pts[i % n];
    d += ` A ${r} ${r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d} Z`;
}

const HEAD_D = scallopPath(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 36, 6);

/** 身體的米灰軀幹與淺色肚皮（不含部件群組，由 Panda 包住）。 */
export function BodyShape(): JSX.Element {
  return (
    <>
      <ellipse cx={100} cy={165} rx={48} ry={50} fill="var(--fur)" />
      <ellipse cx={100} cy={172} rx={26} ry={28} fill="var(--paper)" opacity={0.85} />
    </>
  );
}

/** 黑色肩帶：從左肩經背部到右肩，與黑色手臂相連；位於項圈下方。 */
export function Strap(): JSX.Element {
  return (
    <g data-part="strap" fill="none" stroke="var(--ink)" stroke-width={14} stroke-linecap="round">
      <path d="M 56 150 Q 100 118 144 150" />
    </g>
  );
}

export function Tail({ transform }: Movable): JSX.Element {
  return (
    <g data-part="tail" transform={transform}>
      <circle cx={144} cy={196} r={9} fill="var(--fur)" />
    </g>
  );
}

export function Leg({ side, transform }: Movable & { side: Side }): JSX.Element {
  return (
    <g data-part={`leg${side}`} transform={transform}>
      <ellipse cx={LEG_X[side]} cy={214} rx={15} ry={20} fill="var(--ink)" />
    </g>
  );
}

export function Arm({ side, transform }: Movable & { side: Side }): JSX.Element {
  return (
    <g data-part={`arm${side}`} transform={transform}>
      <ellipse cx={ARM_X[side]} cy={170} rx={12} ry={28} fill="var(--ink)" />
    </g>
  );
}

/** 圓耳朵（必須是 circle：嬰兒害羞時的粉紅耳朵樣式以 `circle` 選取）。 */
export function Ear({ side }: { side: Side }): JSX.Element {
  return (
    <g data-part={`ear${side}`}>
      <circle cx={EAR_X[side]} cy={EAR_Y} r={13} fill="var(--ink)" />
    </g>
  );
}

/** 米灰毛絨圓臉（頭的形狀，不含耳朵與五官）。 */
export function HeadShape(): JSX.Element {
  return <path d={HEAD_D} fill="var(--fur)" stroke="var(--fur-shade)" stroke-width={1} stroke-linejoin="round" />;
}

/** 較淺的吻部：鼻子與嘴巴都落在它上面。 */
export function Muzzle(): JSX.Element {
  return <ellipse cx={100} cy={118} rx={24} ry={15} fill="var(--paper)" stroke="var(--fur-shade)" stroke-width={1} />;
}

// 黑色淚滴眼圈：尖端朝上、圓底朝下；由 Eye 依左右旋轉，使尖端朝內上、圓底朝外下（溫和下垂）。
const EYE_PATCH = 'M -4 -12 Q 0 -17 4 -12 C 9 -6 12 -1 12 4 A 12 12 0 0 1 -12 4 C -12 -1 -9 -6 -4 -12 Z';

const STAR = '0,-7 1.7,-2.3 6.7,-2.2 2.7,0.9 4.1,5.7 0,2.6 -4.1,5.7 -2.7,0.9 -6.7,-2.2 -1.7,-2.3';

/** 黑色淚滴眼圈加上眼睛；狀態由姿勢決定。虹膜位於眼圈的內下側。 */
export function Eye({ side, state }: { side: Side; state: 'open' | 'closed' | 'stars' | 'stare' | 'squint' }): JSX.Element {
  const x = EYE_X[side];
  const inner = side === 'L' ? -3 : 3;
  const tilt = side === 'L' ? -30 : 30;
  let content: JSX.Element;
  switch (state) {
    case 'closed':
      content = <path d="M -6 1 Q 0 6 6 1" fill="none" stroke="var(--paper)" stroke-width={2.5} stroke-linecap="round" />;
      break;
    case 'squint':
      content = <path d="M -6 2 Q 0 -4 6 2" fill="none" stroke="var(--paper)" stroke-width={2.5} stroke-linecap="round" />;
      break;
    case 'stars':
      content = <polygon points={STAR} fill="var(--chain-light)" />;
      break;
    case 'stare':
      content = (
        <>
          <circle cx={inner} cy={3} r={6} fill="var(--amber)" />
          <circle cx={inner} cy={3} r={2.8} fill="var(--ink)" />
        </>
      );
      break;
    default:
      content = (
        <>
          <circle cx={inner} cy={3} r={5.5} fill="var(--amber)" />
          <circle cx={inner + 1.8} cy={1.2} r={1.8} fill="var(--paper)" />
        </>
      );
  }
  return (
    <g data-part={`eye${side}`} transform={`translate(${x} ${EYE_Y})`}>
      <path d={EYE_PATCH} fill="var(--ink)" transform={`rotate(${tilt})`} />
      {content}
    </g>
  );
}

/** 腮紅；不顯示時透明度為 0，但仍保留部件節點。 */
export function Cheek({ side, on }: { side: Side; on: boolean }): JSX.Element {
  return (
    <ellipse
      data-part={`cheek${side}`}
      cx={CHEEK_X[side]}
      cy={116}
      rx={7}
      ry={4.5}
      fill="var(--blush, #E9A896)"
      opacity={on ? 0.7 : 0}
    />
  );
}

/** 大而圓的黑鼻子，位於吻部上方。 */
export function Nose(): JSX.Element {
  return (
    <g>
      <ellipse cx={100} cy={108} rx={10.5} ry={7.5} fill="var(--ink)" />
      <ellipse cx={97} cy={105} rx={3} ry={1.8} fill="var(--paper)" opacity={0.6} />
    </g>
  );
}

/** 嘴部，位於頭部座標系內；data-testid 供測試與互動辨識。 */
export function Mouth({ kind }: { kind: 'smile' | 'open' | 'sour' | 'chew' | 'yawn' | 'flat' | 'pout' }): JSX.Element {
  let shape: JSX.Element;
  switch (kind) {
    case 'open':
      shape = <ellipse cx={0} cy={2} rx={6} ry={5} fill="var(--ink)" />;
      break;
    case 'sour':
      shape = <path d="M -7 0 L -3 3 L 0 0 L 3 3 L 7 0" fill="none" stroke="var(--ink)" stroke-width={2.5} stroke-linejoin="round" />;
      break;
    case 'chew':
      shape = <ellipse cx={0} cy={1} rx={5} ry={3.5} fill="var(--ink)" />;
      break;
    case 'yawn':
      shape = <ellipse cx={0} cy={3} rx={5} ry={7} fill="var(--ink)" />;
      break;
    case 'flat':
      shape = <path d="M -6 0 L 6 0" fill="none" stroke="var(--ink)" stroke-width={2.5} stroke-linecap="round" />;
      break;
    case 'pout':
      shape = <ellipse cx={0} cy={2} rx={3} ry={2.2} fill="var(--ink)" />;
      break;
    default:
      shape = <path d="M -8 0 Q 0 6 8 0" fill="none" stroke="var(--ink)" stroke-width={2.5} stroke-linecap="round" />;
  }
  return (
    <g data-part="mouth" data-testid="panda-mouth" transform="translate(100 126)">
      {/* 透明點擊區：細線嘴形的中心不在筆畫上，餵食拖曳的目標需要可被指到（觸控也較好按）。 */}
      <circle r={12} fill="transparent" />
      {shape}
    </g>
  );
}

/** 睡帽：只在睡覺姿勢顯示，畫在頭部最上層。 */
export function Nightcap(): JSX.Element {
  return (
    <g data-part="nightcap">
      <path d="M 48 72 Q 100 -6 152 72 Z" fill="var(--amber)" />
      <circle cx={150} cy={72} r={7} fill="var(--paper)" />
    </g>
  );
}
