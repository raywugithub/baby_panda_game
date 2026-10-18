import { useEffect, useRef, useState } from 'preact/hooks';
import { game, commit } from '../../store';
import { care } from '../../../core/care';
import { now, randomSeed } from '../../../platform/clock';
import { mulberry32 } from '../../../core/rng';

type Game = 'ball' | 'harp' | 'stare';
type Done = (message: string) => void;

const BALL_TAPS = 3;
const HARP_LEAVES = 4;
const STARE_MIN_MS = 3000;
const STARE_SPAN_MS = 3000;

/** 丟球：點 3 次即完成。 */
function BallGame({ onDone }: { onDone: Done }) {
  const [taps, setTaps] = useState(0);
  function tap() {
    const next = taps + 1;
    setTaps(next);
    if (next >= BALL_TAPS) onDone('熊貓把球接住啦！');
  }
  return <button type="button" onClick={tap}>丟球（{taps}/{BALL_TAPS}）</button>;
}

/** 竹葉琴：依序點 4 片竹葉即完成；點錯從頭來。 */
function HarpGame({ onDone }: { onDone: Done }) {
  const [step, setStep] = useState(0);
  function tap(leaf: number) {
    if (leaf !== step) {
      setStep(0);
      return;
    }
    const next = step + 1;
    if (next >= HARP_LEAVES) {
      setStep(0);
      onDone('竹葉琴彈得很好聽');
      return;
    }
    setStep(next);
  }
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {Array.from({ length: HARP_LEAVES }, (_, i) => (
        <button key={i} type="button" onClick={() => tap(i)}>竹葉 {i + 1}</button>
      ))}
    </div>
  );
}

/** 比賽瞪眼：熊貓隨機 3–6 秒後眨眼。玩家先點 → 熊貓輸；熊貓先眨 → 玩家輸。 */
function StareGame({ onDone }: { onDone: Done }) {
  const [started, setStarted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finished = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  function finish(message: string) {
    if (finished.current) return;
    finished.current = true;
    clearTimeout(timer.current);
    onDone(message);
  }

  function start() {
    setStarted(true);
    const delay = STARE_MIN_MS + Math.floor(mulberry32(randomSeed())() * STARE_SPAN_MS);
    timer.current = setTimeout(() => finish('熊貓先眨眼，你輸啦'), delay);
  }

  if (!started) return <button type="button" onClick={start}>開始比賽</button>;
  return <button type="button" onClick={() => finish('你先眨眼！熊貓贏了')}>盯住熊貓！</button>;
}

/** 玩耍：三個小遊戲；每個遊戲結束時套用一次「玩耍」照顧。 */
export function PlayMenu() {
  const [active, setActive] = useState<Game | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onDone(text: string) {
    commit(care(game.value, 'play', now()));
    setMessage(text);
    setActive(null);
  }

  return (
    <div>
      {active === null ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setMessage(null); setActive('ball'); }}>丟球</button>
          <button type="button" onClick={() => { setMessage(null); setActive('harp'); }}>竹葉琴</button>
          <button type="button" onClick={() => { setMessage(null); setActive('stare'); }}>比賽瞪眼</button>
        </div>
      ) : null}
      {active === 'ball' ? <BallGame onDone={onDone} /> : null}
      {active === 'harp' ? <HarpGame onDone={onDone} /> : null}
      {active === 'stare' ? <StareGame onDone={onDone} /> : null}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
