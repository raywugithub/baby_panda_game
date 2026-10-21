import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
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
import { LocationScene, PANDA_PX } from '../../art/scenes/LocationScene';
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

/** 談話內容：手工地點用其專屬對話；生成地點取朋友當日一句聊天（路人則用一句閒聊）。 */
function talkScript(s: GameState, node: MapNode, nodeId: number): DialogueScript {
  const id = `loc-${nodeId}-talk`;
  if (node.snapshot.kind === 'handmade') return { id, lines: HANDMADE[node.snapshot.handmadeId].talk };
  const resident = residentOf(node);
  if (resident === 'passerby') return { id, lines: [{ speaker: 'passerby', text: PASSERBY_CHAT }] };
  const level = levelOf(s.friends[resident].points);
  const chat = FRIENDS.find((f) => f.id === resident)?.chat ?? [];
  // 依等級輪流取台詞；台詞表為空時退回路人閒聊，避免取到 undefined。
  const line = chat.length > 0 ? chat[(level - 1) % chat.length] : PASSERBY_CHAT;
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
  const canComplete = !!progress && talked && treasureFound;
  const offerMini = !!progress && !minigameDone && minigameOffered(s.seed, nodeId, today);
  const ownedFood = FOOD_IDS.filter((id) => (s.inventory[id] ?? 0) > 0);

  const tap = (hotspotId: string): void => {
    const hs = layout.hotspots.find((h) => h.id === hotspotId);
    const wasFound = found.includes(hotspotId);
    commit(tapHotspot(game.value, nodeId, hotspotId, now()));
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
      size={PANDA_PX}
    />
  );

  return (
    <div class="loc" data-testid="location-screen">
      <header class="loc-head">
        <h2 class="loc-title">{nameOf(node.snapshot)}</h2>
        <p class="loc-sub">{friendName} · 今天：{layout.event}</p>
      </header>

      <LocationScene snapshot={node.snapshot} hotspots={layout.hotspots} onTap={tap} tapped={found} panda={panda} />

      <section class="loc-panel" aria-label="朋友與請求">
        <div class="loc-row">
          <button
            type="button"
            class="loc-btn"
            data-testid="talk-button"
            disabled={!progress || talked}
            onClick={() => {
              commit(talk(game.value, nodeId, now()));
              setScript(talkScript(game.value, node, nodeId));
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
            <button
              type="button"
              class="loc-btn"
              data-testid="request-find"
              disabled={!progress || requestDone}
              onClick={() => tap('request')}
            >
              {requestDone ? '已找到' : '找到了'}
            </button>
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
            kind={minigameKind(s.seed, today)}
            onFinish={(score) => {
              setPlaying(false);
              commit(finishMinigame(game.value, nodeId, minigameKind(s.seed, today), score, now()));
            }}
          />
        )}
      </section>

      <button
        type="button"
        class="loc-btn loc-complete"
        data-testid="complete-button"
        disabled={!canComplete}
        onClick={() => {
          commit(complete(game.value, nodeId, now()));
          closeOverlay();
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
