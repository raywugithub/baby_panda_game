import type { JSX } from 'preact';
import { game, commit } from '../store';
import { openOverlay } from '../nav';
import { FRIENDS } from '../../content/friends';
import { FRIEND_FURNITURE } from '../../content/friendFurniture';
import { friendLevelThreshold, levelOf } from '../../core/friendLevel';
import { storySegmentsUnlocked } from '../../core/friends';
import { markBeatSeen } from '../../core/story';
import type { FriendId } from '../../core/state';

const SEGMENTS = [1, 2, 3, 4, 5];

/** 朋友頭像（半身，SVG）：每位朋友一個配色與特徵，與物品圖同一套描邊風格。 */
function Portrait({ id, size = 56 }: { id: FriendId; size?: number }): JSX.Element {
  const stroke = '#6B4F3A';
  const common = { stroke, 'stroke-width': 2.5, 'stroke-linejoin': 'round' as const };
  const eyes = (
    <g fill="#6B4F3A">
      <circle cx={24} cy={34} r={2.4} />
      <circle cx={40} cy={34} r={2.4} />
    </g>
  );
  const smile = <path d="M27 41 Q32 45 37 41" fill="none" stroke="#6B4F3A" stroke-width={2} stroke-linecap="round" />;
  let body: JSX.Element;
  switch (id) {
    case 'mianhua':
      body = (
        <g>
          <ellipse cx={22} cy={14} rx={6} ry={15} fill="#FFF7F9" {...common} />
          <ellipse cx={42} cy={14} rx={6} ry={15} fill="#FFF7F9" {...common} />
          <ellipse cx={22} cy={15} rx={2.6} ry={9} fill="#F4B6C2" />
          <ellipse cx={42} cy={15} rx={2.6} ry={9} fill="#F4B6C2" />
          <circle cx={32} cy={38} r={20} fill="#FFF7F9" {...common} />
          <circle cx={24} cy={42} r={3} fill="#F4B6C2" />
          <circle cx={40} cy={42} r={3} fill="#F4B6C2" />
          {eyes}{smile}
        </g>
      );
      break;
    case 'juzi':
      body = (
        <g>
          <path d="M14 14 L22 28 L12 30 Z" fill="#F0A05A" {...common} />
          <path d="M50 14 L42 28 L52 30 Z" fill="#F0A05A" {...common} />
          <circle cx={32} cy={36} r={20} fill="#F7B77A" {...common} />
          <path d="M18 40 Q32 60 46 40 Q40 52 32 52 Q24 52 18 40 Z" fill="#FFF7F0" />
          {eyes}{smile}
        </g>
      );
      break;
    case 'manman':
      body = (
        <g>
          <circle cx={32} cy={24} r={16} fill="#B9D8A4" {...common} />
          <ellipse cx={32} cy={20} rx={10} ry={8} fill="#7FA66B" />
          <circle cx={32} cy={46} r={12} fill="#CDE6B8" {...common} />
          <circle cx={26} cy={44} r={2.2} fill="#6B4F3A" />
          <circle cx={38} cy={44} r={2.2} fill="#6B4F3A" />
          <path d="M28 50 Q32 53 36 50" fill="none" stroke="#6B4F3A" stroke-width={2} stroke-linecap="round" />
        </g>
      );
      break;
    case 'gulu':
      body = (
        <g>
          <path d="M32 6 L36 16 L46 12 L42 22 L54 24 L44 30 L50 40 L40 38 L38 50 L32 42 L26 50 L24 38 L14 40 L20 30 L10 24 L22 22 L18 12 L28 16 Z" fill="#B88B5E" {...common} />
          <circle cx={32} cy={36} r={15} fill="#F3DDB9" {...common} />
          <circle cx={26} cy={34} r={2.4} fill="#6B4F3A" />
          <circle cx={38} cy={34} r={2.4} fill="#6B4F3A" />
          <ellipse cx={32} cy={41} rx={2.5} ry={2} fill="#E0566B" />
          <path d="M28 45 Q32 47 36 45" fill="none" stroke="#6B4F3A" stroke-width={2} stroke-linecap="round" />
        </g>
      );
      break;
  }
  return (
    <svg class="friend-portrait" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx={32} cy={32} r={31} fill="#FFFDF8" />
      {body}
    </svg>
  );
}

/** 朋友卡：每位朋友的等級、好感進度、已解鎖的故事段（可重看）與專屬家具。 */
export function FriendCardsTab() {
  const s = game.value;

  function reread(id: FriendId, n: number) {
    const scriptId = `friend-${id}-${n}`;
    commit(markBeatSeen(game.value, scriptId));
    openOverlay({ kind: 'dialogue', scriptId });
  }

  return (
    <div class="album-friends">
      {FRIENDS.map(f => {
        const points = s.friends[f.id].points;
        const level = levelOf(points);
        const lo = friendLevelThreshold(level);
        const hi = friendLevelThreshold(level + 1);
        const pct = ((points - lo) / (hi - lo)) * 100;
        const unlocked = storySegmentsUnlocked(level);
        const furniture = FRIEND_FURNITURE.filter(r => r.friendId === f.id);
        return (
          <section key={f.id} class="card friend-card" data-testid={`friend-${f.id}`}>
            <header class="friend-head">
              <Portrait id={f.id} />
              <div class="friend-id">
                <strong class="friend-name">{f.name}</strong>
                <span class="friend-title">{f.title}</span>
                <span class="friend-level">Lv {level}</span>
              </div>
            </header>
            <div
              class="friend-bar"
              role="progressbar"
              aria-label={`${f.name}好感進度`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <div class="friend-bar-fill" data-testid={`friend-${f.id}-progress`} style={{ width: `${pct}%` }} />
            </div>
            <p class="friend-next">距離 Lv {level + 1} 還差 {hi - points} 點</p>

            <h4 class="friend-sub">故事</h4>
            <div class="friend-stories">
              {SEGMENTS.map(n => {
                const ok = n <= unlocked;
                return ok ? (
                  <button
                    type="button"
                    key={n}
                    class="friend-story"
                    data-testid={`story-${f.id}-${n}`}
                    onClick={() => reread(f.id, n)}
                  >
                    第 {n} 段
                  </button>
                ) : (
                  <button
                    type="button"
                    key={n}
                    class="friend-story friend-story-locked"
                    data-testid={`story-${f.id}-${n}`}
                    disabled
                  >
                    等級 {n} 解鎖
                  </button>
                );
              })}
            </div>

            <h4 class="friend-sub">專屬家具</h4>
            <ul class="friend-furniture">
              {furniture.map(r => (
                <li key={r.itemId} class={level >= r.level ? 'friend-furn' : 'friend-furn friend-furn-locked'}>
                  {level >= r.level ? r.name : `等級 ${r.level} 解鎖`}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default FriendCardsTab;
