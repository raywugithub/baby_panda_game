import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { hash, mulberry32, pick } from '../../core/rng';
import { game, commit } from '../store';
import { closeOverlay, goTab, openOverlay, type Overlay } from '../nav';
import { now } from '../../platform/clock';
import { localDate } from '../../core/time';
import { canEnter } from '../../core/mapgen';
import { levelOf } from '../../core/friendLevel';
import {
  enter, layoutFor, tapHotspot, talk, bringFood, solveSecret, complete, finishMinigame,
} from '../../core/location';
import { minigameOffered, minigameKind } from '../../core/minigames';
import { nameOf } from '../../core/locationgen';
import { currentStage } from '../../core/growth';
import { Panda, type PandaPose } from '../../panda/Panda';
import type { FriendId, GameState, MapNode } from '../../core/state';
import { LocationScene, PANDA_SIZE } from '../../art/scenes/LocationScene';
import { Dialogue } from '../components/Dialogue';
import { PuzzleView } from '../components/PuzzleView';
import { Minigame } from '../components/Minigame';
import { FRIENDS, PASSERBY_CHAT } from '../../content/friends';
import { FOODS, FOOD_IDS } from '../../content/foods';
import { HANDMADE } from '../../content/locations/handmade';
import type { DialogueScript } from '../../content/story';

const ENTER_MIN_ENERGY = 25;
const COMPLETE_ENERGY_COST = 25;

function residentOf(node: MapNode): FriendId | 'passerby' {
  return node.snapshot.kind === 'handmade' ? HANDMADE[node.snapshot.handmadeId].resident : node.snapshot.resident;
}

function foodName(id: string): string {
  return FOODS.find((f) => f.id === id)?.name ?? id;
}

const FILLER_NOTES = [
  '這裡只有一隻小蟲在曬太陽。',
  '翻了翻，只有幾顆圓圓的小石子。',
  '什麼都沒有，不過這裡的風好舒服。',
  '一片葉子輕輕飄了下來。',
  '有一隻蝸牛慢慢爬過去，打了個招呼。',
  '嗯，這裡只有軟軟的草。',
];

/** 一天一天往下數的序號；用來讓朋友每天說不一樣的話。 */
function dayOrdinal(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** 朋友今天要說的聊天台詞編號：隔天換一句、不同地點也不同。 */
export function chatIndex(date: string, nodeId: number, level: number, len: number): number {
  return (((dayOrdinal(date) + nodeId * 3 + level - 1) % len) + len) % len;
}

/** 談話內容：手工地點用其專屬對話；生成地點取朋友當日一句聊天（路人則用一句閒聊）。 */
function talkScript(s: GameState, node: MapNode, nodeId: number, date: string): DialogueScript {
  const id = `loc-${nodeId}-talk`;
  if (node.snapshot.kind === 'handmade') return { id, lines: HANDMADE[node.snapshot.handmadeId].talk };
  const resident = residentOf(node);
  if (resident === 'passerby') return { id, lines: [{ speaker: 'passerby', text: PASSERBY_CHAT }] };
  const level = levelOf(s.friends[resident].points);
  const chat = FRIENDS.find((f) => f.id === resident)?.chat ?? [];
  // 依日期與地點輪流取台詞（不會一直重複同一句）；台詞表為空時退回路人閒聊。
  const line = chat.length > 0 ? chat[chatIndex(date, nodeId, level, chat.length)] : PASSERBY_CHAT;
  return { id, lines: [{ speaker: resident, text: line }] };
}

/** 地點覆蓋層入口：只接受 location 覆蓋層，其餘回傳 null。 */
export function LocationScreen({ overlay }: { overlay: Overlay }): JSX.Element | null {
  if (overlay.kind !== 'location') return null;
  return <LocationView key={overlay.nodeId} nodeId={overlay.nodeId} />;
}

function LocationView({ nodeId }: { nodeId: number }): JSX.Element {
  const s = game.value;
  const today = localDate(now());
  const node = s.map.nodes.find((n) => n.id === nodeId);
  const progress = node?.progress && node.progress.date === today ? node.progress : null;
  const doneToday = !!node && node.status === 'done' && node.lastCompletedDate === today;
  const cannotEnter = !!node && !progress && (!canEnter(s, nodeId) || s.energy < ENTER_MIN_ENERGY);

  const [script, setScript] = useState<DialogueScript | null>(null);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  // 點到線索或空點時顯示的一句話。
  const [note, setNote] = useState<string | null>(null);
  // 熊貓的反應動作：找到寶物或祕密時短暫開心，之後回到行走。
  const [reaction, setReaction] = useState<{ pose: PandaPose; n: number } | null>(null);
  useEffect(() => {
    if (reaction === null) return;
    const t = setTimeout(() => setReaction(null), 1400);
    return () => clearTimeout(t);
  }, [reaction]);

  // 進入只做一次；能力不足或體力不夠時不進入（見 cannotEnter 的休息畫面）。
  useEffect(() => {
    const cur = game.value;
    const n = cur.map.nodes.find((x) => x.id === nodeId);
    if (!n || n.progress?.date === localDate(now())) return;
    if (cannotEnter || doneToday) return;
    commit(enter(cur, nodeId, now()));
  }, [nodeId]);

  if (!node) return <RestPanel message="找不到這個地點了。" />;
  if (cannotEnter) return <RestPanel message="熊貓想先休息，回家照顧一下吧。" />;
  if (doneToday && !progress) return <RestPanel message="今天已經來過這裡了，明天再來吧。" />;

  const layout = layoutFor(s, nodeId, today);
  const found = progress?.foundHotspots ?? [];
  const talked = progress?.talked ?? false;
  const treasureFound = progress?.treasureFound ?? false;
  const requestDone = found.includes('request');
  const secretDone = found.includes('secret');
  const minigameDone = found.includes('minigame');
  const resident = residentOf(node);
  const friendName = resident === 'passerby' ? '路人' : FRIENDS.find((f) => f.id === resident)!.name;
  const hasEnergy = s.energy >= COMPLETE_ENERGY_COST;
  const canComplete = !!progress && talked && treasureFound && hasEnergy;
  const missing = [!talked ? '說話' : null, !treasureFound ? '找到寶物' : null].filter((x): x is string => x !== null);
  const clueSpots = layout.hotspots.filter((h) => h.role === 'clue');
  const foundClues = clueSpots.filter((h) => found.includes(h.id));
  const offerMini = !!progress && !minigameDone && minigameOffered(s.seed, nodeId, today);
  const ownedFood = FOOD_IDS.filter((id) => (s.inventory[id] ?? 0) > 0);

  const tap = (hotspotId: string): void => {
    const hs = layout.hotspots.find((h) => h.id === hotspotId);
    const wasFound = found.includes(hotspotId);
    commit(tapHotspot(game.value, nodeId, hotspotId, now()));
    if (hs?.role === 'clue') setNote(hs.clue ?? null);
    else if (hs?.role === 'filler') setNote(pick(mulberry32(hash(node.seed, hs.id)), FILLER_NOTES));
    else if (hs?.role === 'treasure' && !wasFound) setNote('找到寶物了！');
    else if (hs?.role === 'request' && !wasFound) setNote('找到了！謝謝你。');
    else if (hs?.role === 'hidden' && !wasFound) setNote('哇，發現祕密了！');
    else if (hs?.role === 'extra' && !wasFound) setNote('寶石發亮了，多了一份小禮物！');
    if (!wasFound && (hs?.role === 'treasure' || hs?.role === 'hidden')) {
      setReaction((r) => ({ pose: hs.role === 'treasure' ? 'celebrate' : 'starEyes', n: (r?.n ?? 0) + 1 }));
    }
  };
  const pandaPose: PandaPose = reaction?.pose ?? 'walk';
  const panda = (
    <Panda
      pose={pandaPose}
      stage={currentStage(s)}
      outfit={s.equipped.outfit}
      pendants={s.equipped.pendants}
      chainLinks={s.chainLinks}
      size={PANDA_SIZE}
    />
  );

  return (
    <div class="loc" data-testid="location-screen">
      <header class="loc-head">
        <h2 class="loc-title">{nameOf(node.snapshot)}</h2>
        <p class="loc-sub">{friendName} · 今天：{layout.event}</p>
      </header>

      <LocationScene snapshot={node.snapshot} hotspots={layout.hotspots} onTap={tap} tapped={found} panda={panda} />

      {note && (
        <p class="loc-note" role="status" data-testid="clue-text">{note}</p>
      )}

      <section class="loc-panel" aria-label="朋友與請求">
        <div class="loc-row">
          <button
            type="button"
            class="loc-btn"
            data-testid="talk-button"
            disabled={!progress || talked}
            onClick={() => {
              commit(talk(game.value, nodeId, now()));
              setScript(talkScript(game.value, node, nodeId, today));
            }}
          >
            說話
          </button>
          <button type="button" class="loc-btn" data-testid="photo-button" onClick={() => openOverlay({ kind: 'photo', context: { nodeId } })}>
            拍照
          </button>
        </div>

        {script && <Dialogue scriptId={script.id} script={script} onDone={() => setScript(null)} />}

        {layout.request.kind === 'find' ? (
          <div class="loc-request">
            <p>{friendName}：幫我找找場景裡藏著的小東西吧。</p>
            {requestDone ? (
              <p class="loc-muted" data-testid="request-found">已經找到啦，謝謝你。</p>
            ) : (
              <p class="loc-muted">點一點場景裡的亮點，就能找到它。</p>
            )}
          </div>
        ) : (
          <div class="loc-request">
            <p>{friendName}：我好想吃{foodName(layout.request.foodId)}！</p>
            {requestDone ? (
              <p class="loc-muted">已經送到啦，謝謝你。</p>
            ) : ownedFood.length === 0 ? (
              <p class="loc-muted">背包裡還沒有可以送的食物。</p>
            ) : (
              <div class="loc-foods" role="group" aria-label="選擇要送的食物">
                {ownedFood.map((id) => (
                  <button
                    key={id}
                    type="button"
                    class="loc-btn"
                    data-testid={`food-${id}`}
                    disabled={!progress}
                    onClick={() => {
                      const out = bringFood(game.value, nodeId, id, now());
                      setHint(out ? null : '這個不行喔');
                      if (out) commit(out);
                    }}
                  >
                    {foodName(id)} ×{s.inventory[id]}
                  </button>
                ))}
              </div>
            )}
            {hint && <p class="loc-hint" role="status">{hint}</p>}
          </div>
        )}

        {layout.secret.kind === 'puzzle' && !secretDone && (
          <button type="button" class="loc-btn" data-testid="secret-button" disabled={!progress} onClick={() => setPuzzleOpen((v) => !v)}>
            祕密謎題
          </button>
        )}
        {layout.secret.kind === 'puzzle' && puzzleOpen && (
          <fieldset class="loc-puzzle" disabled={secretDone}>
            {clueSpots.length > 0 && (
              <div class="loc-clues" data-testid="clue-list" aria-label="找到的線索">
                <p class="loc-muted">
                  {foundClues.length < clueSpots.length
                    ? `線索：找到 ${foundClues.length} / ${clueSpots.length}（點場景裡的亮點）`
                    : '三個線索都找到了：'}
                </p>
                <ul>
                  {foundClues.map((h) => (
                    <li key={h.id}>{h.clue}</li>
                  ))}
                </ul>
              </div>
            )}
            <PuzzleView
              key={nodeId}
              puzzle={layout.secret.puzzle}
              onSolved={() => {
                commit(solveSecret(game.value, nodeId, now()));
                setReaction((r) => ({ pose: 'starEyes', n: (r?.n ?? 0) + 1 }));
              }}
            />
          </fieldset>
        )}

        {offerMini && !playing && (
          <button type="button" class="loc-btn" data-testid="minigame-button" onClick={() => setPlaying(true)}>
            小遊戲
          </button>
        )}
        {playing && (
          <Minigame
            kind={minigameKind(s.seed, nodeId, today)}
            onFinish={(score) => {
              // 先結算獎勵；有成績時留著結果卡，等她按「好」才關閉。
              commit(finishMinigame(game.value, nodeId, minigameKind(s.seed, nodeId, today), score, now()));
              if (score === null) setPlaying(false);
            }}
            onClose={() => setPlaying(false)}
          />
        )}
      </section>

      {!canComplete && progress && (
        <p class="loc-muted loc-complete-hint" role="status" data-testid="complete-hint">
          {missing.length > 0 ? `還差：${missing.join('、')}` : '元氣不夠，回家照顧一下再來。'}
        </p>
      )}
      <button
        type="button"
        class="loc-btn loc-complete"
        data-testid="complete-button"
        disabled={!canComplete}
        onClick={() => {
          const before = game.value;
          const out = complete(before, nodeId, now());
          commit(out);
          if (out.state !== before) closeOverlay();
        }}
      >
        完成（元氣 −{COMPLETE_ENERGY_COST}）
      </button>
    </div>
  );
}

/** 回家：關閉地點並回到家分頁。 */
function goHome(): void {
  closeOverlay();
  goTab('home');
}

function RestPanel({ message }: { message: string }): JSX.Element {
  const s = game.value;
  return (
    <div class="loc loc-rest" data-testid="location-rest">
      <div class="loc-rest-panda">
        <Panda pose="yawn" stage={currentStage(s)} outfit={s.equipped.outfit} pendants={s.equipped.pendants} chainLinks={s.chainLinks} size={200} />
      </div>
      <p class="loc-rest-text">{message}</p>
      <button type="button" class="loc-btn" onClick={goHome}>回家</button>
    </div>
  );
}
