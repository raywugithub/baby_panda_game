// 唯一允許呼叫 Date.now 的地方；其他層透過這裡取得時間與亂數種子。
export function now(): number {
  return Date.now();
}

export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}
