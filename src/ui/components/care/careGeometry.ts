const FEED_RADIUS = 40;
const BATH_DONE_RATIO = 0.7;

/** 拖曳的食物是否已放到嘴巴附近（半徑預設 40px）。 */
export function isNearMouth(p: { x: number; y: number }, mouth: { x: number; y: number }, radius = FEED_RADIUS): boolean {
  return Math.hypot(p.x - mouth.x, p.y - mouth.y) <= radius;
}

/** 洗澡覆蓋率是否達 70%。 */
export function bathDone(painted: number, total: number): boolean {
  return painted / total >= BATH_DONE_RATIO;
}
