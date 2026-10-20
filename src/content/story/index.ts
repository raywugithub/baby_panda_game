import type { DialogueScript } from './types';
import { PROLOGUE } from './prologue';
import { CHAPTER_SCRIPTS } from './chapters';
import { FRIEND_STORIES } from './friend-stories';
import { legendScript } from './legends';

export type { DialogueLine, DialogueScript } from './types';

export const SCRIPTS: Record<string, DialogueScript> = {
  prologue: PROLOGUE,
  ...CHAPTER_SCRIPTS,
  ...FRIEND_STORIES,
};

type Resolver = (id: string, seed: number) => DialogueScript | null;
let resolver: Resolver | null = null;

/** 計畫 B 於載入時註冊小傳說（legend-*）的解析器（契約 10.8）。 */
export function registerScriptResolver(fn: Resolver): void {
  resolver = fn;
}

// 小傳說（legend-N）由 legendScript 依存檔種子即時生成，不寫入 SCRIPTS。
registerScriptResolver((id, seed) => {
  const m = /^legend-(\d+)$/.exec(id);
  return m ? legendScript(seed, Number(m[1])) : null;
});

/** 先查內建腳本；查不到且為 legend-* 時交由已註冊的 resolver；其餘回傳 null。 */
export function resolveScript(id: string, seed: number): DialogueScript | null {
  const builtin = SCRIPTS[id];
  if (builtin) return builtin;
  if (id.startsWith('legend-') && resolver) return resolver(id, seed);
  return null;
}
