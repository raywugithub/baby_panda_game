export function friendLevelThreshold(level: number): number {
  return 10 * (level - 1) * level;
}

export function levelOf(points: number): number {
  let L = 1;
  while (friendLevelThreshold(L + 1) <= points) L++;
  return L;
}
