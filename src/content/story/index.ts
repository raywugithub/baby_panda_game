import type { DialogueScript } from './types';
import { PROLOGUE } from './prologue';

export type { DialogueLine, DialogueScript } from './types';

export const SCRIPTS: Record<string, DialogueScript> = {
  prologue: PROLOGUE,
};

type Resolver = (id: string, seed: number) => DialogueScript | null;
let resolver: Resolver | null = null;

/** 計畫 B 於載入時註冊小傳說（legend-*）的解析器（契約 10.8）。 */
export function registerScriptResolver(fn: Resolver): void {
  resolver = fn;
}

/** 先查內建腳本；查不到且為 legend-* 時交由已註冊的 resolver；其餘回傳 null。 */
export function resolveScript(id: string, seed: number): DialogueScript | null {
  const builtin = SCRIPTS[id];
  if (builtin) return builtin;
  if (id.startsWith('legend-') && resolver) return resolver(id, seed);
  return null;
}
