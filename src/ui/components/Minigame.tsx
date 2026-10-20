import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { GAME_SECONDS, MINIGAMES, remainingMs, scoreFromHits, type MinigameKind } from '../../core/minigames';
import { mulberry32 } from '../../core/rng';
import { now, randomSeed } from '../../platform/clock';
import { burst, type ParticleKind } from '../../platform/particles';
import { FallingStar, SteppingStone, Bubble, HopperPanda } from '../../art/minigames';

export interface MinigameProps {
  kind: MinigameKind;
  /** 完成（時間到）給 0～1 的分數；跳過或中途離開給 null。只會呼叫一次。 */
  onFinish: (score01: number | null) => void;
}

interface Target {
  id: number;
  /** 位置以play area 的百分比表示（0～100）。 */
  x: number;
  y: number;
  /** 每毫秒的位移（百分比）；石頭為 0。 */
  vy: number;
  /** 石頭等有壽命的目標：過期時間（now 毫秒）。 */
  expiresAt: number | null;
  /** 被戳破時的時間，之後短暫播放破裂動畫再移除。 */
  poppedAt: number | null;
}

interface KindConfig {
  goal: string;
  countLabel: string;
  particle: ParticleKind;
  spawnMs: number;
  maxLive: number;
  vy: number;
  lifeMs: number | null;
  spawnY: number;
}

const CONFIG: Record<MinigameKind, KindConfig> = {
  stars: {
    goal: '夜空的星星正在墜落，點住它們！戳越多，分數越高。',
    countLabel: '接到',
    particle: 'stars',
    spawnMs: 900,
    maxLive: 6,
    vy: 0.012,
    lifeMs: null,
    spawnY: -8,
  },
  hop: {
    goal: '踩著石頭過河！點一下你想跳去的石頭。',
    countLabel: '跳了',
    particle: 'water',
    spawnMs: 1100,
    maxLive: 4,
    vy: 0,
    lifeMs: 2400,
    spawnY: 0,
  },
  bubble: {
    goal: '泡泡飄上來了，快把它們戳破！戳越多，分數越高。',
    countLabel: '戳破',
    particle: 'bubbles',
    spawnMs: 800,
    maxLive: 6,
    vy: -0.01,
    lifeMs: null,
    spawnY: 108,
  },
};

const HIT_RADIUS = 14;
const POP_MS = 260;
const TAP_UNIT = '次';

/** 依表現給 1～3 顆星（結果卡用）。 */
function starsFor(score01: number): number {
  if (score01 >= 1) return 3;
  if (score01 >= 0.6) return 2;
  return score01 > 0 ? 1 : 0;
}

function spawnTarget(kind: MinigameKind, rand: () => number, id: number, t: number): Target {
  const cfg = CONFIG[kind];
  const x = 8 + rand() * 84;
  const y = kind === 'hop' ? 18 + rand() * 66 : cfg.spawnY;
  return {
    id,
    x,
    y,
    vy: cfg.vy,
    expiresAt: cfg.lifeMs === null ? null : t + cfg.lifeMs,
    poppedAt: null,
  };
}

/**
 * 30 秒小遊戲：接星星、跳石頭過河、泡泡配對。
 * 每次點擊都算一次成果（目標只是畫面上的引導）；時間到自動結算，跳過或切到其他 App 則不給獎勵。
 */
export function Minigame({ kind, onFinish }: MinigameProps): JSX.Element {
  const cfg = CONFIG[kind];
  const game = MINIGAMES.find((g) => g.kind === kind)!;
  const [hits, setHits] = useState(0);
  const [secsLeft, setSecsLeft] = useState(GAME_SECONDS);
  const [, setFrame] = useState(0);
  const [ended, setEnded] = useState<'done' | 'aborted' | null>(null);
  const [score, setScore] = useState(0);
  const [hopper, setHopper] = useState<{ x: number; y: number }>({ x: 50, y: 84 });

  const doneRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const hitsRef = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const world = useRef<{ targets: Target[]; nextId: number; nextSpawn: number }>({ targets: [], nextId: 1, nextSpawn: 0 });
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

    const update = (t: number): void => {
      const dt = Math.min(64, Math.max(0, t - last));
      last = t;
      if (document.hidden) pausedMs += dt;

      const secs = Math.ceil(remainingMs(startedAt, t, pausedMs) / 1000);
      if (secs !== lastSecs) {
        lastSecs = secs;
        setSecsLeft(secs);
      }

      w.targets = w.targets.filter((tg) => {
        if (tg.poppedAt !== null) return t - tg.poppedAt < POP_MS;
        if (tg.expiresAt !== null && t >= tg.expiresAt) return false;
        return tg.y > -12 && tg.y < 112;
      });
      for (const tg of w.targets) if (tg.poppedAt === null) tg.y += tg.vy * dt;

      const live = w.targets.filter((tg) => tg.poppedAt === null).length;
      if (t >= w.nextSpawn && live < cfg.maxLive) {
        w.targets.push(spawnTarget(kind, rand, w.nextId++, t));
        w.nextSpawn = t + cfg.spawnMs * (0.75 + rand() * 0.5);
      }
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

  function handleTap(e: PointerEvent): void {
    if (doneRef.current) return;
    const area = areaRef.current;
    if (!area) return;
    const r = area.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;

    hitsRef.current += 1;
    setHits(hitsRef.current);
    burst(cfg.particle, e.clientX, e.clientY, 10);

    const t = now();
    const targets = world.current.targets;
    let best: Target | null = null;
    let bestD = Infinity;
    for (const tg of targets) {
      if (tg.poppedAt !== null) continue;
      const d = Math.hypot(tg.x - px, tg.y - py);
      if (d < bestD) {
        bestD = d;
        best = tg;
      }
    }
    if (kind === 'hop') {
      if (Number.isFinite(px) && Number.isFinite(py)) setHopper({ x: Math.min(92, Math.max(8, px)), y: Math.min(90, Math.max(10, py)) });
    } else if (best && bestD <= HIT_RADIUS) {
      best.poppedAt = t;
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
            {cfg.countLabel} <strong>{hits}</strong> {TAP_UNIT}
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
          world.current.targets.map((tg) => {
            const cls = tg.poppedAt !== null ? 'minigame-target is-popped' : 'minigame-target';
            const style = { left: `${tg.x}%`, top: `${tg.y}%` };
            if (kind === 'stars') return <div key={tg.id} class={cls} style={style}><FallingStar size={56} /></div>;
            if (kind === 'hop') return <div key={tg.id} class={cls} style={style}><SteppingStone size={62} /></div>;
            return <div key={tg.id} class={cls} style={style}><Bubble size={58} /></div>;
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
              {game.name}：{cfg.countLabel} {hits} {TAP_UNIT}
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
