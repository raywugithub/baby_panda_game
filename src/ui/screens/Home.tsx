import { useEffect, useRef, useState } from 'preact/hooks';
import type { PandaPose } from '../../panda/Panda';
import { Panda } from '../../panda/Panda';
import { moodOf, idlePoseFor } from '../../core/mood';
import { currentStage } from '../../core/growth';
import { now, randomSeed } from '../../platform/clock';
import { burst } from '../../platform/particles';
import { game, commit, eventQueue, justOpenedAfterMs } from '../store';
import { openOverlay } from '../nav';
import { PandaTapZone } from '../components/Surprises';
import { TopBar } from '../components/TopBar';
import { Needs } from '../components/Needs';
import { RoomView } from '../components/RoomView';
import { DiaryPanel } from '../components/DiaryPanel';
import { Mailbox } from '../components/Mailbox';
import { InstallHint } from '../components/InstallHint';
import { UpdateBanner } from '../components/UpdateBanner';
import { FeedTray } from '../components/care/FeedTray';
import { BathArea } from '../components/care/BathArea';
import { PlayMenu } from '../components/care/PlayMenu';
import { HugButton } from '../components/care/HugButton';
import { Kitchen } from './Kitchen';
import { REACTION_POSE } from '../../panda/reactions';
import type { GameEvent } from '../../core/events';
import type { GameState } from '../../core/state';
import { playPendantSounds } from '../../platform/pendantSound';
import { mulberry32, hash, chance } from '../../core/rng';
import { localDate } from '../../core/time';
import { shouldHiccup } from '../../core/care';
import { diaryDreamOn } from '../../core/dream';
import { pickInteraction } from '../../core/room';
import { pendantSoundIds } from '../../core/pendants';
import { interactionPose } from '../room/interactions';
import { hideFoodOnOpen, shyAfterHug, hiccupDream, recordPoke } from '../../core/surprises';

export { idlePoseFor };

/** 熊貓腳底所在的地板列（房間底緣上方約 14%，約落在第 4 列）；第 5 列的家具畫在熊貓前面。 */
const PANDA_ROW = 4;

/**
 * 熊貓點擊區寬度（占房間寬度的百分比），依階段 1–4 反向調整：Panda 的 scale 為 0.80/0.90/1.00/1.05，
 * 可見熊貓寬約為點擊區的 0.79 倍再乘 scale，所以 63/56/50/48 得到約 40% 的可見寬度（35–45%）。
 */
const PANDA_TAP_WIDTH_PCT = [63, 56, 50, 48];

const AWAKE_MS = 30 * 60_000; // 契約 10.6：點醒睡覺中的熊貓後 30 分鐘內不睡
const CELEBRATE_MS = 2000; // C23：升階時慶祝姿勢約 2 秒
const REACTION_MS = 2000; // 餵食反應姿勢持續 2 秒
const KITCHEN_STAGE = 2;
const BUSY_MS = 2000; // 戳戳忙碌姿勢
const HIDE_FOOD_MS = 3000; // 偷吃被抓包姿勢
const SHY_MS = 2000; // 抱抱害羞姿勢
const SHAKE_MS = 1000; // 點項圈晃動姿勢
const SNEEZE_MS = 1500; // 打噴嚏姿勢
const SNEEZE_CHECK_MS = 120_000; // 打噴嚏檢查間隔：每 2 分鐘最多一次
const DREAM_MS = 4000; // 夢話泡泡
const YAWN_MS = 800; // 醒來時打哈欠
const INTERACTION_CHECK_MS = 15_000; // 待機時每 15 秒判定一次互動家具
const INTERACTION_MS = 3000; // 互動姿勢持續 3 秒
const COLLAR_NOTE_GAP_MS = 350; // 點項圈：各墜飾依序叮噹的間隔

/** 短暫覆蓋的姿勢（小驚喜）；優先序在慶祝與餵食反應之後、待機之前。 */
interface Transient { pose: PandaPose; ms: number }

type Panel = 'feed' | 'bath' | 'play' | 'kitchen';
const PANEL_LABEL: Record<Panel, string> = { feed: '餵食', bath: '洗澡', play: '玩耍', kitchen: '料理台' };

// 已處理過的升階事件；模組層級保存，避免重新掛載時重複慶祝。RewardToast 會另行消化佇列。
const seenStageUps = new WeakSet<GameEvent>();

export interface HomeProps {
  /** 教學步驟的提示泡泡（Task 28）；沒有值時不顯示。 */
  tutorialHint?: string;
  /** 讓 Home 仍可作為無屬性的 ComponentType 登記於 registry。 */
  [extra: string]: unknown;
}

export function Home({ tutorialHint }: HomeProps = {}) {
  const s = game.value;
  const stage = currentStage(s);
  const mood = moodOf(s, now(), justOpenedAfterMs.value);
  const [celebrating, setCelebrating] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [reaction, setReaction] = useState<{ pose: PandaPose } | null>(null);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const pandaBox = useRef<HTMLDivElement>(null);
  const [transient, setTransient] = useState<Transient | null>(null);
  const [dream, setDream] = useState<{ text: string } | null>(null);
  const [rand] = useState(() => mulberry32(randomSeed()));

  function flash(pose: PandaPose, ms: number) {
    setTransient({ pose, ms });
  }

  /** 睡覺中被叫醒（契約 10.6）：清除離線睡覺旗標、設定 awakeUntil、打哈欠；未睡著時原樣回傳。 */
  function wakeUp(cur: GameState, t: number): GameState {
    const sleeping = moodOf(cur, t, justOpenedAfterMs.value) === 'sleeping';
    justOpenedAfterMs.value = null;
    if (!sleeping) return cur;
    flash('yawn', YAWN_MS);
    return { ...cur, awakeUntil: t + AWAKE_MS };
  }

  // 開啟家畫面：有食物時可能偷吃被抓包（每次開啟只判定一次）。
  useEffect(() => {
    const cur = game.value;
    const t = now();
    const hasFood = Object.entries(cur.inventory)
      .some(([id, c]) => c > 0 && (id.startsWith('food-') || id.startsWith('recipe-')));
    if (hideFoodOnOpen(mulberry32(hash(cur.seed, t, 'hide')), hasFood)) flash('hideFood', HIDE_FOOD_MS);
  }, []);

  // 每 2 分鐘最多判定一次打噴嚏；睡著時不打擾。
  useEffect(() => {
    const id = setInterval(() => {
      const cur = game.value;
      const t = now();
      if (moodOf(cur, t, null) === 'sleeping') return;
      if (chance(mulberry32(hash(cur.seed, t, 'sneeze')), 0.5)) flash('sneeze', SNEEZE_MS);
    }, SNEEZE_CHECK_MS);
    return () => clearInterval(id);
  }, []);

  // 待機時偶爾讓熊貓使用房間裡的互動家具（小沙發、小床、鞦韆等）；只在 normal 心情觸發。
  useEffect(() => {
    const id = setInterval(() => {
      const cur = game.value;
      if (moodOf(cur, now(), null) !== 'normal') return;
      const pick = pickInteraction(cur.rooms.living, rand);
      if (pick) flash(interactionPose(pick.interaction), INTERACTION_MS);
    }, INTERACTION_CHECK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!transient) return;
    const t = setTimeout(() => setTransient(null), transient.ms);
    return () => clearTimeout(t);
  }, [transient]);

  useEffect(() => {
    if (!dream) return;
    const t = setTimeout(() => setDream(null), DREAM_MS);
    return () => clearTimeout(t);
  }, [dream]);

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

  useEffect(() => {
    if (!reaction) return;
    const t = setTimeout(() => setReaction(null), REACTION_MS);
    return () => clearTimeout(t);
  }, [reaction]);

  /** 放手時量測嘴巴的螢幕座標（C12）；沒有嘴巴元素時退回熊貓區塊中心。 */
  function measureMouth(): { x: number; y: number } | null {
    const mouthEl = pandaBox.current?.querySelector('[data-testid="panda-mouth"]');
    const r = (mouthEl ?? pandaBox.current)?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  }

  /** 照顧前先醒來。 */
  function togglePanel(p: Panel) {
    const woken = wakeUp(game.value, now());
    if (woken !== game.value) commit(woken);
    setPanel(cur => (cur === p ? null : p));
  }

  /**
   * 熊貓區唯一的 pointerdown（C15）：先醒來（契約 10.6），再計算戳戳；
   * 醒來與計數合併成一次 commit，避免後寫入覆蓋 awakeUntil。
   */
  function onPandaPointerDown() {
    const t = now();
    const next = wakeUp(game.value, t);
    const r = recordPoke(next.pokeLog, t);
    commit({ ...next, pokeLog: r.pokeLog });
    if (r.trigger) flash('busyBook', BUSY_MS);
  }

  /** Panda 內部部件的點擊：只處理點項圈（醒來與計數已由 onPandaPointerDown 負責）。 */
  function onPandaArea(area: 'body' | 'arms' | 'collar' | 'mouth') {
    if (area === 'collar') {
      const cur = game.value;
      if (cur.settings.sound) playPendantSounds(pendantSoundIds(cur.equipped.pendants), COLLAR_NOTE_GAP_MS);
      flash('shake', SHAKE_MS);
    }
  }

  /** 抱抱後有 30% 機率害羞（以種子亂數決定）。 */
  function onHug() {
    const woken = wakeUp(game.value, now());
    if (woken !== game.value) commit(woken);
    const cur = game.value;
    if (shyAfterHug(mulberry32(hash(cur.seed, now(), 'shy')))) flash('shy', SHY_MS);
  }

  /** 餵食後判定打嗝；月亮鈴鐺時夢話也寫進今天的日記（若今天已有一篇）。 */
  function afterFeed() {
    const cur = game.value;
    const t = now();
    if (!shouldHiccup(cur, t)) return;
    const text = hiccupDream(cur.seed, t);
    setDream({ text });
    const today = cur.diary[0];
    if (diaryDreamOn(cur) && today && today.date === localDate(t)) {
      commit({
        ...cur,
        diary: [{ ...today, text: `${today.text}夢裡：${text}` }, ...cur.diary.slice(1)],
      });
    }
  }

  const transientPose = transient && mood !== 'sleeping' ? transient.pose : null;
  const pose = (celebrating
    ? 'celebrate'
    : reaction
      ? reaction.pose
      : transientPose ?? idlePoseFor(mood)) as PandaPose;
  const { outfit, pendants } = s.equipped;

  return (
    <div class="home">
      <UpdateBanner />
      <TopBar onMailbox={() => setMailboxOpen(o => !o)} />
      <InstallHint />
      <Needs />

      <RoomView room={s.rooms.living} stage={stage} depthRow={PANDA_ROW}>
        <div
          class={`home-panda${transientPose === 'shy' ? ' shy-ears' : ''}`}
          style={`--panda-tap-w: ${PANDA_TAP_WIDTH_PCT[Math.min(Math.max(stage, 1), 4) - 1]}%`}
          ref={pandaBox}
        >
          <PandaTapZone busy={transientPose === 'busyBook'} onPointerDown={onPandaPointerDown}>
            <Panda
              pose={pose}
              stage={stage}
              outfit={outfit}
              pendants={pendants}
              chainLinks={s.chainLinks}
              onPokeArea={onPandaArea}
            />
          </PandaTapZone>
        </div>
      </RoomView>
      {dream ? <p class="dream-bubble" data-testid="dream-bubble">{dream.text}</p> : null}
      {tutorialHint ? <p class="tutorial-hint" data-testid="tutorial-hint">{tutorialHint}</p> : null}
      {mood === 'sleepy' ? <p class="sleepy-hint" data-testid="sleepy-hint">抱抱我、餵我吃點東西</p> : null}

      <div class="care-row">
        <button type="button" data-testid="care-feed" onClick={() => togglePanel('feed')}>🍙 餵食</button>
        <button type="button" data-testid="care-bath" onClick={() => togglePanel('bath')}>🫧 洗澡</button>
        <button type="button" data-testid="care-play" onClick={() => togglePanel('play')}>🧸 玩耍</button>
        <HugButton onHug={onHug} />
      </div>
      <div class="kitchen-row">
        <button
          type="button"
          aria-label="料理台"
          disabled={stage < KITCHEN_STAGE}
          onClick={() => togglePanel('kitchen')}
        >
          🍳 料理台
        </button>
        {stage < KITCHEN_STAGE ? <span class="hint">長大一點就能用</span> : null}
      </div>
      <div class="photo-entry">
        <button type="button" data-testid="photo-open" onClick={() => openOverlay({ kind: 'photo', context: 'home' })}>📷 拍照</button>
      </div>
      {panel ? (
        <section class="card care-panel" data-testid="care-panel">
          <h3>{PANEL_LABEL[panel]}</h3>
          {panel === 'feed' ? (
            <FeedTray
              measureMouth={measureMouth}
              onFed={r => {
                setReaction({ pose: REACTION_POSE[r] });
                afterFeed();
              }}
            />
          ) : null}
          {panel === 'bath' ? <BathArea /> : null}
          {panel === 'play' ? <PlayMenu /> : null}
          {panel === 'kitchen' ? <Kitchen /> : null}
        </section>
      ) : null}

      <DiaryPanel />
      {mailboxOpen ? <Mailbox onClose={() => setMailboxOpen(false)} /> : null}
    </div>
  );
}
