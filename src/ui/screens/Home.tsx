import { useEffect, useRef, useState } from 'preact/hooks';
import type { PandaPose } from '../../panda/Panda';
import { Panda } from '../../panda/Panda';
import { moodOf, idlePoseFor } from '../../core/mood';
import { currentStage } from '../../core/growth';
import { now } from '../../platform/clock';
import { burst } from '../../platform/particles';
import { game, commit, eventQueue, justOpenedAfterMs } from '../store';
import { TopBar } from '../components/TopBar';
import { Needs } from '../components/Needs';
import { RoomView } from '../components/RoomView';
import { DiaryPanel } from '../components/DiaryPanel';
import { Mailbox } from '../components/Mailbox';
import { InstallHint } from '../components/InstallHint';
import { UpdateBanner } from '../components/UpdateBanner';
import type { GameEvent } from '../../core/events';

export { idlePoseFor };

const AWAKE_MS = 30 * 60_000; // 契約 10.6：點醒睡覺中的熊貓後 30 分鐘內不睡
const CELEBRATE_MS = 2000; // C23：升階時慶祝姿勢約 2 秒
const KITCHEN_STAGE = 2;

type Panel = 'feed' | 'bath' | 'play' | 'kitchen';
const PANEL_LABEL: Record<Panel, string> = { feed: '餵食', bath: '洗澡', play: '玩耍', kitchen: '料理台' };

// 已處理過的升階事件；模組層級保存，避免重新掛載時重複慶祝。RewardToast 會另行消化佇列。
const seenStageUps = new WeakSet<GameEvent>();

export function Home() {
  const s = game.value;
  const stage = currentStage(s);
  const mood = moodOf(s, now(), justOpenedAfterMs.value);
  const [celebrating, setCelebrating] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const pandaBox = useRef<HTMLDivElement>(null);

  // C23：升階事件到達時熊貓慶祝並噴星星；只讀取佇列，不消化。
  const freshStageUps = eventQueue.value.filter(e => e.type === 'stageUp' && !seenStageUps.has(e));
  useEffect(() => {
    if (freshStageUps.length === 0) return;
    for (const e of freshStageUps) seenStageUps.add(e);
    setCelebrating(true);
    const r = pandaBox.current?.getBoundingClientRect();
    if (r) burst('stars', r.left + r.width / 2, r.top + r.height / 3);
  }, [freshStageUps.length]);

  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [celebrating]);

  function onPoke() {
    const cur = game.value;
    const t = now();
    if (moodOf(cur, t, justOpenedAfterMs.value) === 'sleeping') {
      commit({ ...cur, awakeUntil: t + AWAKE_MS });
    }
    justOpenedAfterMs.value = null;
  }

  const pose = (celebrating ? 'celebrate' : idlePoseFor(mood)) as PandaPose;
  const { outfit, pendants } = s.equipped;

  return (
    <div class="home">
      <UpdateBanner />
      <TopBar onMailbox={() => setMailboxOpen(o => !o)} />
      <Needs />

      <div class="home-panda" ref={pandaBox}>
        <Panda
          pose={pose}
          stage={stage}
          outfit={outfit}
          pendants={pendants}
          chainLinks={s.chainLinks}
          onPokeArea={onPoke}
        />
        {mood === 'sleepy' ? <p class="sleepy-hint" data-testid="sleepy-hint">抱抱我、餵我吃點東西</p> : null}
      </div>

      <RoomView />

      <div class="care-row">
        <button type="button" data-testid="care-feed" onClick={() => setPanel(p => (p === 'feed' ? null : 'feed'))}>🍙 餵食</button>
        <button type="button" data-testid="care-bath" onClick={() => setPanel(p => (p === 'bath' ? null : 'bath'))}>🫧 洗澡</button>
        <button type="button" data-testid="care-play" onClick={() => setPanel(p => (p === 'play' ? null : 'play'))}>🧸 玩耍</button>
        {/* 抱抱按鈕由 Task 23 的 HugButton 取代此佔位（C12）。 */}
        <button type="button" data-testid="care-hug" disabled>🤗 抱抱</button>
      </div>
      <div class="kitchen-row">
        <button
          type="button"
          aria-label="料理台"
          disabled={stage < KITCHEN_STAGE}
          onClick={() => setPanel(p => (p === 'kitchen' ? null : 'kitchen'))}
        >
          🍳 料理台
        </button>
        {stage < KITCHEN_STAGE ? <span class="hint">長大一點就能用</span> : null}
      </div>
      {panel ? (
        <section class="card care-panel" data-testid="care-panel">
          <h3>{PANEL_LABEL[panel]}</h3>
          <p>即將推出</p>
        </section>
      ) : null}

      <DiaryPanel />
      {mailboxOpen ? <Mailbox onClose={() => setMailboxOpen(false)} /> : null}
      <InstallHint />
    </div>
  );
}
