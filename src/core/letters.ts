import type { GameState, Letter } from './state';
import { hash, mulberry32, pick } from './rng';
import { FRIEND_LETTERS } from '../content/friendLetters';

/** 依種子與日期產生當日朋友來信；每天最多一封由呼叫端控制。 */
export function letterForDay(seed: number, date: string): Letter {
  const rand = mulberry32(hash(seed, date, 'letter'));
  const picked = pick(rand, FRIEND_LETTERS);
  return {
    id: `letter-${date}`,
    date,
    from: picked.friendId,
    text: picked.text,
    read: false,
  };
}

/** 新信插入最前面（index 0）；不裁切、不過期，溢出由 commit 的 splitArchive 封存。 */
export function addLetter(s: GameState, letter: Letter): GameState {
  return { ...s, letters: [letter, ...s.letters] };
}

export function markLetterRead(s: GameState, id: string): GameState {
  return {
    ...s,
    letters: s.letters.map(l => (l.id === id ? { ...l, read: true } : l)),
  };
}
