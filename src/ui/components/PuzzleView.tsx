import type { JSX } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { checkAnswer, type Puzzle } from '../../core/puzzles';
import { SHAPE_ART, SHAPE_LABEL, type ShapeName } from '../../art/shapes';

export interface PuzzleViewProps {
  puzzle: Puzzle;
  onSolved: () => void;
}

const DIGITS = 3;

/**
 * 地點祕密的四種謎題：影子配對、順序謎語、找不同三選一、密碼鎖。
 * 答錯只顯示「再想想」並保持畫面，不扣分；答對時 onSolved 只會呼叫一次。
 */
export function PuzzleView({ puzzle, onSolved }: PuzzleViewProps): JSX.Element {
  const [solved, setSolved] = useState(false);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [retry, setRetry] = useState(false);
  const [digits, setDigits] = useState<string[]>(() => Array(DIGITS).fill(''));
  const doneRef = useRef(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function solve(): void {
    if (doneRef.current) return;
    doneRef.current = true;
    setSolved(true);
    setRetry(false);
    onSolved();
  }

  function miss(): void {
    setRetry(true);
  }

  function choose(i: number): void {
    if (doneRef.current) return;
    if (checkAnswer(puzzle, i)) {
      setWrongIdx(null);
      solve();
    } else {
      setWrongIdx(i);
      miss();
    }
  }

  function setDigit(i: number, raw: string): void {
    const v = raw.replace(/\D/g, '').slice(-1);
    setDigits((prev) => prev.map((d, k) => (k === i ? v : d)));
    setRetry(false);
    if (v && i < DIGITS - 1) inputs.current[i + 1]?.focus();
  }

  function submitCode(): void {
    if (doneRef.current) return;
    if (checkAnswer(puzzle, digits.join(''))) solve();
    else miss();
  }

  const feedback = solved ? (
    <div class="puzzle-cheer" role="status" data-testid="puzzle-cheer">
      <Sparkles />
      <p>答對了！</p>
    </div>
  ) : retry ? (
    <p class="puzzle-retry" role="status">再想想</p>
  ) : null;

  return (
    <section class="puzzle" data-kind={puzzle.kind}>
      {puzzle.kind === 'shadow' && (
        <>
          <p class="puzzle-prompt">這個影子是哪一個？</p>
          <div class="puzzle-stage" aria-label="影子">
            <ShadowShape shape={puzzle.target} />
          </div>
          <div class="puzzle-options">
            {puzzle.options.map((shape, i) => (
              <button
                type="button"
                key={i}
                class={`puzzle-option${wrongIdx === i ? ' is-wrong' : ''}`}
                data-testid={`option-${i}`}
                aria-label={SHAPE_LABEL[shape as ShapeName]}
                onClick={() => choose(i)}
              >
                <Shape shape={shape as ShapeName} size={72} />
              </button>
            ))}
          </div>
        </>
      )}

      {puzzle.kind === 'sequence' && (
        <>
          <p class="puzzle-prompt">照著規律，下一個是什麼？</p>
          <div class="puzzle-stage puzzle-riddle">
            {puzzle.shown.map((shape, i) => (
              <span key={i} class="puzzle-riddle-shape" data-part="riddle-shape">
                <Shape shape={shape as ShapeName} size={56} />
              </span>
            ))}
            <span class="puzzle-riddle-q" aria-hidden="true">？</span>
          </div>
          <div class="puzzle-options">
            {puzzle.options.map((shape, i) => (
              <button
                type="button"
                key={i}
                class={`puzzle-option${wrongIdx === i ? ' is-wrong' : ''}`}
                data-testid={`option-${i}`}
                aria-label={SHAPE_LABEL[shape as ShapeName]}
                onClick={() => choose(i)}
              >
                <Shape shape={shape as ShapeName} size={72} />
              </button>
            ))}
          </div>
        </>
      )}

      {puzzle.kind === 'diff' && (
        <>
          <p class="puzzle-prompt">哪一組跟其他兩組不一樣？</p>
          <div class="puzzle-diff">
            {puzzle.options.map((row, i) => (
              <button
                type="button"
                key={i}
                class={`puzzle-option puzzle-panel${wrongIdx === i ? ' is-wrong' : ''}`}
                data-testid={`option-${i}`}
                aria-label={`第 ${i + 1} 組`}
                onClick={() => choose(i)}
              >
                {row.map((shape, k) => (
                  <Shape key={k} shape={shape as ShapeName} size={52} />
                ))}
              </button>
            ))}
          </div>
        </>
      )}

      {puzzle.kind === 'codelock' && (
        <>
          <p class="puzzle-prompt">三位數的密碼是多少？</p>
          <p class="puzzle-hint">看看場景裡的線索，把三個數字填進去。</p>
          <div class="puzzle-digits">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                class="puzzle-digit"
                data-testid={`code-${i + 1}`}
                aria-label={`第 ${i + 1} 位數字`}
                type="text"
                inputmode="numeric"
                maxLength={1}
                autocomplete="off"
                value={d}
                onInput={(e) => setDigit(i, (e.currentTarget as HTMLInputElement).value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitCode(); }}
              />
            ))}
          </div>
          <button type="button" class="btn-primary puzzle-submit" onClick={submitCode}>開鎖</button>
        </>
      )}

      {feedback}
    </section>
  );
}

/** 單一形狀；依 SHAPE_ART 取圖。 */
function Shape({ shape, size, silhouette }: { shape: ShapeName; size: number; silhouette?: boolean }): JSX.Element {
  const Art = SHAPE_ART[shape];
  return <Art size={size} silhouette={silhouette} />;
}

/** 影子：深色剪影，即使在謎題中也不加臉。 */
function ShadowShape({ shape }: { shape: string }): JSX.Element {
  return <Shape shape={shape as ShapeName} size={120} silhouette />;
}

/** 答對時的小小慶祝：三顆閃亮的四角星芒。 */
function Sparkles(): JSX.Element {
  const twinkle = 'M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z';
  return (
    <svg class="puzzle-sparkles" width={44} height={44} viewBox="0 0 44 44" aria-hidden="true">
      {[[22, 22, 1], [8, 10, 0.55], [36, 9, 0.6]].map(([x, y, k], i) => (
        <path key={i} d={twinkle} transform={`translate(${x} ${y}) scale(${k})`} fill="#F6DA8A" stroke="#6B4F3A" stroke-width={1.4} stroke-linejoin="round" />
      ))}
    </svg>
  );
}
