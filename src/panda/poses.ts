export type PandaPose = 'sit' | 'armsOut' | 'hug' | 'sleep' | 'eat' | 'sour' | 'blush' | 'starEyes' | 'patBelly'
  | 'bath' | 'shake' | 'shy' | 'busyBook' | 'sneeze' | 'hideFood' | 'chase' | 'dance' | 'stare' | 'spin'
  | 'celebrate' | 'yawn' | 'clingy' | 'walk' | 'boxPeek' | 'shakeBox' | 'useSit' | 'useSleep' | 'useSwing' | 'useRead';

export interface PartMove { dx?: number; dy?: number; rot?: number }

export interface PoseSpec {
  head?: PartMove;
  body?: PartMove;
  armL?: PartMove;
  armR?: PartMove;
  legL?: PartMove;
  legR?: PartMove;
  tail?: PartMove;
  eyes: 'open' | 'closed' | 'stars' | 'stare' | 'squint';
  mouth: 'smile' | 'open' | 'sour' | 'chew' | 'yawn' | 'flat' | 'pout';
  cheeks: boolean;
  nightcap?: boolean;
}

export const ALL_POSES: PandaPose[] = [
  'sit', 'armsOut', 'hug', 'sleep', 'eat', 'sour', 'blush', 'starEyes', 'patBelly',
  'bath', 'shake', 'shy', 'busyBook', 'sneeze', 'hideFood', 'chase', 'dance', 'stare', 'spin',
  'celebrate', 'yawn', 'clingy', 'walk', 'boxPeek', 'shakeBox', 'useSit', 'useSleep', 'useSwing', 'useRead',
];

export const POSE_TABLE: Record<PandaPose, PoseSpec> = {
  sit:        { armL: { rot: 12 }, armR: { rot: -12 }, eyes: 'open', mouth: 'smile', cheeks: false },
  armsOut:    { head: { dy: -2 }, armL: { rot: -120, dx: 2, dy: -6 }, armR: { rot: 120, dx: -2, dy: -6 }, eyes: 'open', mouth: 'smile', cheeks: false },
  hug:        { head: { rot: 6 }, armL: { rot: -35, dx: 14, dy: -4 }, armR: { rot: 35, dx: -14, dy: -4 }, eyes: 'squint', mouth: 'smile', cheeks: true },
  sleep:      { head: { dx: 0, dy: 6, rot: 12 }, body: { dy: 8, rot: 6 }, armL: { rot: 25, dy: 8 }, armR: { rot: -10, dy: 10 }, legL: { rot: 10 }, legR: { rot: -6 }, eyes: 'closed', mouth: 'flat', cheeks: false, nightcap: true },
  eat:        { head: { rot: -6 }, armL: { rot: -55, dx: -6, dy: -20 }, armR: { rot: 12 }, eyes: 'open', mouth: 'chew', cheeks: false },
  sour:       { head: { rot: -8, dy: 2 }, body: { rot: -3 }, armL: { rot: -40, dx: -4, dy: -14 }, armR: { rot: 10 }, eyes: 'squint', mouth: 'sour', cheeks: false },
  blush:      { head: { rot: 4 }, armL: { rot: 20 }, armR: { rot: -20 }, eyes: 'open', mouth: 'smile', cheeks: true },
  starEyes:   { head: { dy: -3 }, armL: { rot: -30, dy: -8 }, armR: { rot: 30, dy: -8 }, eyes: 'stars', mouth: 'open', cheeks: false },
  patBelly:   { head: { rot: -2 }, body: { rot: -2 }, armL: { rot: 15 }, armR: { rot: -40, dx: 6, dy: -14 }, eyes: 'closed', mouth: 'smile', cheeks: true },
  bath:       { head: { rot: -4, dy: 2 }, body: { dy: 2 }, armL: { rot: -45, dy: -6 }, armR: { rot: 45, dy: -6 }, tail: { rot: 20 }, eyes: 'squint', mouth: 'open', cheeks: false },
  shake:      { head: { rot: -12 }, body: { rot: -8 }, armL: { rot: -30 }, armR: { rot: 30 }, tail: { rot: -25 }, eyes: 'squint', mouth: 'open', cheeks: false },
  shy:        { head: { dy: 6, rot: 8 }, body: { rot: 4 }, armL: { rot: -65, dx: 6, dy: -18 }, armR: { rot: 65, dx: -6, dy: -18 }, eyes: 'closed', mouth: 'flat', cheeks: true },
  busyBook:   { head: { rot: -4 }, armL: { rot: -50, dx: -4, dy: -16 }, armR: { rot: -45, dx: 4, dy: -16 }, eyes: 'squint', mouth: 'flat', cheeks: false },
  sneeze:     { head: { dy: -4, rot: -14 }, body: { rot: -4 }, armL: { rot: -25 }, armR: { rot: -25 }, tail: { rot: -15 }, eyes: 'closed', mouth: 'open', cheeks: false },
  hideFood:   { head: { rot: 10, dy: 4 }, body: { rot: 4 }, armL: { rot: -30, dx: -8, dy: -14 }, armR: { rot: -30, dx: 8, dy: -14 }, eyes: 'open', mouth: 'chew', cheeks: true },
  chase:      { head: { rot: 8 }, body: { rot: 12 }, legL: { rot: -30, dy: -4 }, legR: { rot: 30, dy: 4 }, armL: { rot: -50 }, armR: { rot: 50 }, tail: { rot: 40 }, eyes: 'open', mouth: 'open', cheeks: false },
  dance:      { head: { rot: -8, dy: -2 }, body: { rot: -6 }, armL: { rot: -70, dy: -8 }, armR: { rot: 70, dy: -8 }, legL: { rot: -8 }, legR: { rot: 8 }, tail: { rot: 20 }, eyes: 'open', mouth: 'smile', cheeks: true },
  yawn:       { head: { rot: -6, dy: -2 }, armR: { rot: 30, dx: -4, dy: -8 }, eyes: 'closed', mouth: 'yawn', cheeks: false },
  stare:      { armL: { rot: 12 }, armR: { rot: -12 }, eyes: 'stare', mouth: 'flat', cheeks: false },
  spin:       { head: { rot: 30 }, body: { rot: 15 }, armL: { rot: -40 }, armR: { rot: 40 }, tail: { rot: -30 }, eyes: 'squint', mouth: 'open', cheeks: false },
  celebrate:  { head: { dy: -4 }, armL: { rot: -150, dx: 14, dy: -6 }, armR: { rot: 150, dx: -14, dy: -6 }, tail: { rot: 30 }, eyes: 'open', mouth: 'open', cheeks: true },
  clingy:     { head: { rot: 6, dy: 2 }, body: { dy: 2 }, armL: { rot: -70, dx: 10, dy: -6 }, armR: { rot: 70, dx: -10, dy: -6 }, eyes: 'open', mouth: 'pout', cheeks: false },
  walk:       { body: { dy: -2 }, legL: { rot: -18 }, legR: { rot: 18 }, armL: { rot: 18 }, armR: { rot: -18 }, tail: { rot: 10 }, eyes: 'open', mouth: 'smile', cheeks: false },
  boxPeek:    { head: { dy: -6 }, body: { dy: 40 }, armL: { rot: -20 }, armR: { rot: 20 }, eyes: 'open', mouth: 'smile', cheeks: false },
  shakeBox:   { head: { rot: -4 }, body: { rot: -6, dy: 6 }, armL: { rot: -80, dy: -12 }, armR: { rot: -80, dy: -12 }, eyes: 'squint', mouth: 'open', cheeks: false },
  useSit:     { head: { dy: -2 }, armL: { rot: -20 }, armR: { rot: 20 }, legL: { rot: -25, dy: -4 }, legR: { rot: -25, dy: -4 }, eyes: 'open', mouth: 'smile', cheeks: false },
  useSleep:   { head: { rot: 10, dy: 10 }, body: { dy: 12 }, armL: { rot: 30, dy: 8 }, eyes: 'closed', mouth: 'flat', cheeks: false },
  useSwing:   { head: { rot: -8 }, body: { rot: 10 }, armL: { rot: -80, dy: -4 }, armR: { rot: -80, dy: -4 }, legL: { rot: -30 }, legR: { rot: -30 }, eyes: 'open', mouth: 'open', cheeks: false },
  useRead:    { head: { rot: -8, dy: 4 }, body: { rot: -2 }, armL: { rot: -50, dx: -4, dy: -16 }, armR: { rot: -50, dx: 4, dy: -16 }, eyes: 'squint', mouth: 'flat', cheeks: false },
};
