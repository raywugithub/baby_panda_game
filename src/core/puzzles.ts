import { pick } from './rng';

export const SHAPES = ['leaf', 'moon', 'star', 'drop', 'cloud', 'shell'] as const;

export type PuzzleKind = 'shadow' | 'sequence' | 'diff' | 'codelock';

export type Puzzle =
  | { kind: 'shadow'; target: string; options: string[]; answer: number }
  | { kind: 'sequence'; shown: string[]; options: string[]; answer: number }
  | { kind: 'diff'; options: string[][]; answer: number }
  | { kind: 'codelock'; code: string };

/** Fisher-Yates 洗牌，回傳新陣列 */
function shuffle<T>(rand: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 從 candidates 中不重複地取 n 個 */
function pickDistinct<T>(rand: () => number, candidates: readonly T[], n: number): T[] {
  return shuffle(rand, candidates).slice(0, n);
}

export function generatePuzzle(rand: () => number, kind: PuzzleKind): Puzzle {
  switch (kind) {
    case 'shadow': {
      const target = pick(rand, SHAPES);
      const others = pickDistinct(rand, SHAPES.filter(s => s !== target), 2);
      const options = shuffle(rand, [target, ...others]);
      return { kind, target, options, answer: options.indexOf(target) };
    }
    case 'sequence': {
      const a = pick(rand, SHAPES);
      const b = pick(rand, SHAPES.filter(s => s !== a));
      const [w1, w2] = pickDistinct(rand, SHAPES.filter(s => s !== a), 2);
      const options = shuffle(rand, [a, w1, w2]);
      return { kind, shown: [a, b, a, b], options, answer: options.indexOf(a) };
    }
    case 'diff': {
      const base = [pick(rand, SHAPES), pick(rand, SHAPES), pick(rand, SHAPES)];
      const pos = Math.floor(rand() * 3);
      const odd = base.slice();
      odd[pos] = pick(rand, SHAPES.filter(s => s !== base[pos]));
      const options = shuffle<string[]>(rand, [base.slice(), base.slice(), odd]);
      return { kind, options, answer: options.indexOf(odd) };
    }
    case 'codelock': {
      const digits = [0, 1, 2].map(() => String(1 + Math.floor(rand() * 9)));
      return { kind, code: digits.join('') };
    }
  }
}

export function checkAnswer(p: Puzzle, input: number | string | null): boolean {
  if (input === null) return false;
  if (p.kind === 'codelock') return input === p.code;
  return input === p.answer;
}
