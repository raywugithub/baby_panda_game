import type { JSX } from 'preact';

// 約定：L = 熊貓自己的左側（畫面右側）；R = 熊貓自己的右側（畫面左側）。
// 旋轉中心（pivot）皆使用 viewBox 座標，部件嵌套時仍對齊同一座標系。
export const PIVOTS = {
  body: [100, 200],
  head: [100, 120],
  armL: [126, 142],
  armR: [74, 142],
  legL: [116, 206],
  legR: [84, 206],
  tail: [150, 200],
} as const;

const EAR_X = { L: 134, R: 66 } as const;
const LEG_X = { L: 120, R: 80 } as const;
const ARM_X = { L: 128, R: 72 } as const;
const EYE_X = { L: 118, R: 82 } as const;
const CHEEK_X = { L: 130, R: 70 } as const;

type Side = 'L' | 'R';
interface Movable { transform: string }

/** 身體的米灰軀幹與深色臀部（不含部件群組，由 Panda 包住）。 */
export function BodyShape(): JSX.Element {
  return (
    <>
      <ellipse cx={100} cy={165} rx={48} ry={50} fill="var(--fur)" />
      <ellipse cx={100} cy={196} rx={40} ry={20} fill="var(--fur-shade)" />
    </>
  );
}

/** 黑色肩帶：正面與背面兩段 path 連成一圈。 */
export function Strap(): JSX.Element {
  return (
    <g data-part="strap" fill="none" stroke="var(--ink)" stroke-width={5} stroke-linecap="round">
      <path d="M 62 120 Q 100 168 138 120" />
      <path d="M 62 120 Q 100 104 138 120" />
    </g>
  );
}

export function Tail({ transform }: Movable): JSX.Element {
  return (
    <g data-part="tail" transform={transform}>
      <circle cx={154} cy={198} r={10} fill="var(--fur)" />
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

export function Ear({ side }: { side: Side }): JSX.Element {
  return (
    <g data-part={`ear${side}`}>
      <circle cx={EAR_X[side]} cy={62} r={14} fill="var(--ink)" />
    </g>
  );
}

/** 米灰圓臉（頭的形狀，不含耳朵與五官）。 */
export function HeadShape(): JSX.Element {
  return <ellipse cx={100} cy={96} rx={46} ry={40} fill="var(--fur)" />;
}

// 黑色淚滴眼圈：尖端朝上、圓底朝下；由 Eye 依左右旋轉，使尖端朝臉的外側。
const EYE_PATCH = 'M 0 -15 C 6 -8 13 -2 13 4 A 13 13 0 0 1 -13 4 C -13 -2 -6 -8 0 -15 Z';

const STAR ='0,-7 1.7,-2.3 6.7,-2.2 2.7,0.9 4.1,5.7 0,2.6 -4.1,5.7 -2.7,0.9 -6.7,-2.2 -1.7,-2.3';

/** 黑色淚滴眼圈加上眼睛；狀態由姿勢決定。 */
export function Eye({ side, state }: { side: Side; state: 'open' | 'closed' | 'stars' | 'stare' | 'squint' }): JSX.Element {
  const x = EYE_X[side];
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
          <circle r={7} fill="var(--amber)" />
          <circle r={3.5} fill="var(--ink)" />
        </>
      );
      break;
    default:
      content = (
        <>
          <circle r={6} fill="var(--amber)" />
          <circle cx={2} cy={-2} r={2.2} fill="var(--paper)" />
        </>
      );
  }
  return (
    <g data-part={`eye${side}`} transform={`translate(${x} 92)`}>
      <path d={EYE_PATCH} fill="var(--ink)" transform={`rotate(${side === 'L' ? 30 : -30})`} />
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
      cy={108}
      rx={7}
      ry={5}
      fill="var(--blush, #E9A896)"
      opacity={on ? 0.7 : 0}
    />
  );
}

export function Nose(): JSX.Element {
  return <ellipse cx={100} cy={110} rx={7} ry={5} fill="var(--ink)" />;
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
      shape = <path d="M -5 0 Q 0 -3 5 0" fill="none" stroke="var(--ink)" stroke-width={2.5} stroke-linecap="round" />;
      break;
    default:
      shape = <path d="M -8 0 Q 0 6 8 0" fill="none" stroke="var(--ink)" stroke-width={2.5} stroke-linecap="round" />;
  }
  return (
    <g data-part="mouth" data-testid="panda-mouth" transform="translate(100 124)">
      {shape}
    </g>
  );
}

/** 睡帽：只在睡覺姿勢顯示，畫在頭部最上層。 */
export function Nightcap(): JSX.Element {
  return (
    <g data-part="nightcap">
      <path d="M 56 74 Q 100 -4 144 74 Z" fill="var(--amber)" />
      <circle cx={144} cy={74} r={7} fill="var(--paper)" />
    </g>
  );
}
