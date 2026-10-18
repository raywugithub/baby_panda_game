import { useState } from 'preact/hooks';
import { game, commit } from '../store';
import type { FriendId } from '../../core/state';

const FRIEND_NAMES: Record<FriendId, string> = { mianhua: '棉花', juzi: '橘子', manman: '慢慢', gulu: '咕嚕' };

/** 信箱：列出信件，點開即標記為已讀。 */
export function Mailbox({ onClose }: { onClose: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const letters = game.value.letters;

  function open(id: string) {
    setOpenId(id);
    const s = game.value;
    if (s.letters.some(l => l.id === id && !l.read)) {
      commit({ ...s, letters: s.letters.map(l => (l.id === id ? { ...l, read: true } : l)) });
    }
  }

  return (
    <section class="card" aria-label="信箱">
      <div class="card-head">
        <h3>信箱</h3>
        <button type="button" onClick={onClose}>收起信箱</button>
      </div>
      {letters.length === 0 ? <p>目前沒有信</p> : null}
      <ul class="letters">
        {letters.map(l => (
          <li key={l.id}>
            <button type="button" onClick={() => open(l.id)}>
              {l.read ? null : <span class="badge" aria-label="未讀">新</span>}
              來自{FRIEND_NAMES[l.from]}（{l.date}）
            </button>
            {openId === l.id ? <p class="letter-text">{l.text}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
