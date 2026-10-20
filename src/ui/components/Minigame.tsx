import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { GAME_SECONDS, MINIGAMES, remainingMs, scoreFromHits, type MinigameKind } from '../../core/minigames';
import { mulberry32 } from '../../core/rng';
import { now, randomSeed } from '../../platform/clock';
import { burst, type ParticleKind } from '../../platform/particles';
import { FallingStar, SteppingStone, Bubble, HopperPanda, BUBBLE_TINTS, type BubbleTint } from '../../art/minigames';

export interface MinigameProps {
  kind: MinigameKind;
  /** 完成（時間到）給 0～1 的分數；跳過或中途離開給 null。只會呼叫一次。 */
  onFinish: (score01: number | null) => void;
}

interface Target {
  id: number;
  /** 位置以遊戲區的百分比表示（0～100）。 */
  x: number;
  y: number;
  /** 每毫秒的位移（百分比）；石頭為 0。 */
  vy: number;
  /** 被接到或配成對時的時間，之後短暫播放動畫再移除。 */
  poppedAt: number | null;
  /** 點錯石頭時的搖晃時間。 */
  wobbleAt: number | null;
  /** 跳石頭：跳過河的順序（0, 1, 2…）。 */
  order: number;
  /** 泡泡：顏色與配對編號（同一對的兩顆編號相同）。 */
  color: BubbleTint | null;
  pair: number | null;
}

interface KindConfig {
  goal: string;
  countLabel: string;
  unit: string;
  particle: ParticleKind;
  spawnMs: number;
  maxLive: number;
  vy: number;
  spawnY: number;
}

const CONFIG: Record<MinigameKind, KindConfig> = {
  stars: {
    goal: '夜空的星星正在墜落，點住它們！每接到一顆就加分。',
    countLabel: '接到',
    unit: '顆',
    particle: 'stars',
    spawnMs: 2400,
    maxLive: 3,
    vy: 0.012,
    spawnY: -4,
  },
  hop: {
    goal: '照著亮亮的石頭一塊一塊跳過河。點錯的石頭會搖一搖，再點一次就好。',
    countLabel: '跳了',
    unit: '次',
    particle: 'water',
    spawnMs: 0,
    maxLive: 3,
    vy: 0,
    spawnY: 0,
  },
  bubble: {
    goal: '先點一顆泡泡，再點一顆同顏色的，就能戳破一對！',
    countLabel: '配對',
    unit: '對',
    particle: 'bubbles',
    spawnMs: 3200,
    maxLive: 4,
    vy: -0.009,
    spawnY: 102,
  },
};

const BUBBLE_TINT_NAMES = Object.keys(BUBBLE_TINTS) as BubbleTint[];
/** 手指點擊的判定半徑（px）：比畫面上的圖案大一些，小手指也點得到。 */
const HIT_RADIUS_PX = 32;
const POP_MS = 260;
const WOBBLE_MS = 380;
const HOP_LIVE = 3;
const HOP_ROW_GAP = 17;
const HOP_BOTTOM_Y = 76;
const HOP_ROWS = 5;
const START_HOPPER = { x: 50, y: 92 };

/** 依表現給 1～3 顆星（結果卡用）。 */
function starsFor(score01: number): number {
  if (score01 >= 1) return 3;
  if (score01 >= 0.6) return 2;
  return score01 > 0 ? 1 : 0;
}

/** 跳石頭：第 order 塊石頭的位置（左右交錯，往上排）。 */
function hopPosition(order: number, rand: () => number): { x: number; y: number } {
  const side = order % 2 === 0 ? 28 : 70;
  return {
    x: side + (rand() - 0.5) * 14,
    y: HOP_BOTTOM_Y - HOP_ROW_GAP * (order % HOP_ROWS),
  };
}

/**
 * 30 秒小遊戲：接星星、跳石頭過河、泡泡配對。
 * 只有點到目標才算數：接到星星、跳到正確的下一塊石頭、配成一對同色泡泡。空白處的點擊不計分。
 * 時間到自動結算，跳過或切到其他 App 則不給獎勵。
 */
export function Minigame({ kind, onFinish }: MinigameProps): JSX.Element {
  const cfg = CONFIG[kind];
  const game = MINIGAMES.find((g) => g.kind === kind)!;
  const [hits, setHits] = useState(0);
  const [secsLeft, setSecsLeft] = useState(GAME_SECONDS);
  const [, setFrame] = useState(0);
  const [ended, setEnded] = useState<'done' | 'aborted' | null>(null);
  const [score, setScore] = useState(0);
  const [hopper, setHopper] = useState<{ x: number; y: number }>(START_HOPPER);

  const doneRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const hitsRef = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const world = useRef<{
    targets: Target[];
    nextId: number;
    nextSpawn: number;
    nextOrder: number;
    crossed: number;
    pairSeq: number;
    selected: number | null;
  }>({ targets: [], nextId: 1, nextSpawn: 0, nextOrder: 0, crossed: 0, pairSeq: 1, selected: null });
  const timers = useRef<{ raf: number; deadline: number }>({ raf: 0, deadline: 0 });

  useEffect(() => {
    const rand = mulberry32(randomSeed());
    const startedAt = now();
    let last = startedAt;
    let pausedMs = 0;
    let lastSecs = GAME_SECONDS;
    let finished = false;
    const w = world.current;

    const stopLoop = (): void => {
      if (timers.current.raf) cancelAnimationFrame(timers.current.raf);
      if (timers.current.deadline) clearTimeout(timers.current.deadline);
      timers.current.raf = 0;
      timers.current.deadline = 0;
    };

    const finish = (value: number | null): void => {
      if (doneRef.current) return;
      doneRef.current = true;
      finished = true;
      stopLoop();
      if (value === null) {
        setEnded('aborted');
      } else {
        setSecsLeft(0);
        setScore(value);
        setEnded('done');
      }
      onFinishRef.current(value);
    };

    const onHide = (): void => {
      if (!document.hidden) return;
      finish(null);
    };
    const onPageHide = (): void => finish(null);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);

    const liveCount = (): number => w.targets.filter((tg) => tg.poppedAt === null).length;

    const spawn = (t: number): void => {
      if (kind === 'stars') {
        if (t < w.nextSpawn || liveCount() >= cfg.maxLive) return;
        w.targets.push({ id: w.nextId++, x: 8 + rand() * 84, y: cfg.spawnY, vy: cfg.vy, poppedAt: null, wobbleAt: null, order: 0, color: null, pair: null });
        w.nextSpawn = t + cfg.spawnMs * (0.75 + rand() * 0.5);
      } else if (kind === 'hop') {
        while (w.targets.filter((tg) => tg.poppedAt === null).length < HOP_LIVE) {
          const pos = hopPosition(w.nextOrder, rand);
          w.targets.push({ id: w.nextId++, x: pos.x, y: pos.y, vy: 0, poppedAt: null, wobbleAt: null, order: w.nextOrder, color: null, pair: null });
          w.nextOrder++;
        }
      } else {
        if (t < w.nextSpawn || liveCount() >= cfg.maxLive) return;
        const color = BUBBLE_TINT_NAMES[Math.floor(rand() * BUBBLE_TINT_NAMES.length)];
        const pair = w.pairSeq++;
        const x1 = 12 + rand() * 30;
        const x2 = 58 + rand() * 30;
        w.targets.push({ id: w.nextId++, x: x1, y: cfg.spawnY, vy: cfg.vy, poppedAt: null, wobbleAt: null, order: 0, color, pair });
        w.targets.push({ id: w.nextId++, x: x2, y: cfg.spawnY + rand() * 4, vy: cfg.vy, poppedAt: null, wobbleAt: null, order: 0, color, pair });
        w.nextSpawn = t + cfg.spawnMs * (0.8 + rand() * 0.4);
      }
    };

    const update = (t: number): void => {
      const dt = Math.min(64, Math.max(0, t - last));
      last = t;
      if (document.hidden) pausedMs += dt;

      const secs = Math.ceil(remainingMs(startedAt, t, pausedMs) / 1000);
      if (secs !== lastSecs) {
        lastSecs = secs;
        setSecsLeft(secs);
      }

      for (const tg of w.targets) if (tg.poppedAt === null) tg.y += tg.vy * dt;
      w.targets = w.targets.filter((tg) => {
        if (tg.poppedAt !== null) return t - tg.poppedAt < POP_MS;
        if (kind === 'hop') return true;
        return tg.y > -12 && tg.y < 112;
      });
      if (w.selected !== null && !w.targets.some((tg) => tg.id === w.selected)) w.selected = null;

      spawn(t);
      setFrame((n) => (n + 1) % 1_000_000);
    };

    const loop = (): void => {
      if (finished) return;
      update(now());
      timers.current.raf = requestAnimationFrame(loop);
    };

    const check = (): void => {
      if (finished) return;
      const t = now();
      const left = remainingMs(startedAt, t, pausedMs);
      if (left <= 0) {
        finish(scoreFromHits(kind, hitsRef.current));
      } else {
        timers.current.deadline = window.setTimeout(check, left);
      }
    };

    spawn(startedAt);
    timers.current.raf = requestAnimationFrame(loop);
    timers.current.deadline = window.setTimeout(check, GAME_SECONDS * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      stopLoop();
      if (!doneRef.current) {
        // 中途離開（換頁、卸載）：不給獎勵，但仍只結算一次。
        doneRef.current = true;
        onFinishRef.current(null);
      }
    };
    // 每次開始只跑一次；kind 變動由外層以 key 重新掛載。
  }, [kind]);

  function countHit(): void {
    hitsRef.current += 1;
    setHits(hitsRef.current);
  }

  /** 找出判定半徑內最近的未被接到的目標（px 座標）。 */
  function nearest(list: Target[], px: number, py: number, rect: DOMRect): Target | null {
    let best: Target | null = null;
    let bestD = HIT_RADIUS_PX;
    for (const tg of list) {
      if (tg.poppedAt !== null) continue;
      const d = Math.hypot((tg.x / 100) * rect.width - px, (tg.y / 100) * rect.height - py);
      if (d <= bestD) {
        bestD = d;
        best = tg;
      }
    }
    return best;
  }

  function handleTap(e: PointerEvent): void {
    if (doneRef.current) return;
    const area = areaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const t = now();
    const w = world.current;
    const hit = nearest(w.targets, px, py, rect);
    // 空白處的點擊不計分，也不做任何事。
    if (!hit) return;

    if (kind === 'stars') {
      hit.poppedAt = t;
      countHit();
      burst(cfg.particle, e.clientX, e.clientY, 14);
    } else if (kind === 'hop') {
      if (hit.order !== w.crossed) {
        hit.wobbleAt = t;
        setFrame((n) => (n + 1) % 1_000_000);
        return;
      }
      hit.poppedAt = t;
      w.crossed++;
      setHopper({ x: hit.x, y: hit.y });
      countHit();
      burst(cfg.particle, e.clientX, e.clientY, 12);
    } else {
      const selected = w.selected === null ? null : w.targets.find((tg) => tg.id === w.selected) ?? null;
      if (!selected) {
        w.selected = hit.id;
      } else if (selected.id === hit.id) {
        w.selected = null;
      } else if (selected.color === hit.color) {
        selected.poppedAt = t;
        hit.poppedAt = t;
        w.selected = null;
        countHit();
        burst(cfg.particle, e.clientX, e.clientY, 14);
      } else {
        // 顏色不同：不算分，改選這一顆。
        w.selected = hit.id;
      }
    }
    setFrame((n) => (n + 1) % 1_000_000);
  }

  function skip(): void {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timers.current.raf) cancelAnimationFrame(timers.current.raf);
    if (timers.current.deadline) clearTimeout(timers.current.deadline);
    timers.current = { raf: 0, deadline: 0 };
    setEnded('aborted');
    onFinishRef.current(null);
  }

  const running = ended === null;
  const stars = starsFor(score);
  const w = world.current;
  const nextOrder = w.crossed;
  const selectedId = w.selected;
  const tNow = now();

  return (
    <section class={`minigame minigame--${kind}`} data-kind={kind} aria-label={game.name}>
      <header class="minigame-head">
        <h2 class="minigame-title">{game.name}</h2>
        <p class="minigame-goal">{cfg.goal}</p>
        <div class="minigame-status">
          <span class="minigame-timer" data-testid="minigame-timer" role="timer" aria-live="off">
            剩下 <strong>{secsLeft}</strong> 秒
          </span>
          <span class="minigame-count" data-testid="minigame-count">
            {cfg.countLabel} <strong>{hits}</strong> {cfg.unit}
            <span class="minigame-target-hint">（目標 {game.target}）</span>
          </span>
        </div>
      </header>

      <div
        ref={areaRef}
        class="minigame-area"
        data-testid="minigame-area"
        style={{ touchAction: 'none' }}
        onPointerDown={handleTap}
      >
        {running &&
          w.targets.map((tg) => {
            const classes = ['minigame-target'];
            if (tg.poppedAt !== null) classes.push('is-popped');
            if (tg.wobbleAt !== null && tNow - tg.wobbleAt < WOBBLE_MS) classes.push('is-wobble');
            const isNext = kind === 'hop' && tg.order === nextOrder && tg.poppedAt === null;
            if (isNext) classes.push('is-next');
            if (kind === 'bubble' && tg.id === selectedId) classes.push('is-selected');
            const attrs = {
              'data-target-id': tg.id,
              'data-x': tg.x,
              'data-y': tg.y,
              'data-popped': tg.poppedAt !== null ? 'true' : 'false',
              'data-next': isNext ? 'true' : undefined,
              'data-color': tg.color ?? undefined,
              'data-pair': tg.pair ?? undefined,
            };
            const style = { left: `${tg.x}%`, top: `${tg.y}%` };
            const art =
              kind === 'stars' ? <FallingStar size={56} /> :
              kind === 'hop' ? <SteppingStone size={62} /> :
              <Bubble size={58} tint={tg.color ?? 'blue'} />;
            return (
              <div key={tg.id} class={classes.join(' ')} style={style} {...attrs}>
                {art}
              </div>
            );
          })}
        {kind === 'hop' && running && (
          <div class="minigame-hopper" style={{ left: `${hopper.x}%`, top: `${hopper.y}%` }} aria-hidden="true">
            <HopperPanda size={52} />
          </div>
        )}

        {ended === 'done' && (
          <div class="minigame-result" role="status" data-testid="minigame-result">
            <h3>時間到！</h3>
            <p class="minigame-stars" aria-label={`${stars} 顆星`}>
              {[0, 1, 2].map((i) => (
                <span key={i} class={i < stars ? 'on' : ''}>★</span>
              ))}
            </p>
            <p>
              {game.name}：{cfg.countLabel} {hits} {cfg.unit}
            </p>
            <p class="minigame-result-cheer">{stars >= 3 ? '太厲害了，寶貝！' : stars === 2 ? '表現很棒！' : '下次再挑戰看看吧'}</p>
          </div>
        )}
      </div>

      <button type="button" class="minigame-skip" onClick={skip} disabled={!running}>
        跳過
      </button>
    </section>
  );
}
