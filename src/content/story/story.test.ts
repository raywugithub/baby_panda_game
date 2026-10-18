import { describe, it, expect } from 'vitest';
import { SCRIPTS, resolveScript, registerScriptResolver } from './index';

const SPEAKERS = ['panda', 'mianhua', 'juzi', 'manman', 'gulu', 'narrator', 'passerby'];

describe('對話腳本', () => {
  it('序章存在、8–10 句、講者合法', () => {
    const p = SCRIPTS['prologue'];
    expect(p.id).toBe('prologue');
    expect(p.lines.length).toBeGreaterThanOrEqual(8);
    expect(p.lines.length).toBeLessThanOrEqual(10);
    for (const l of p.lines) expect(SPEAKERS).toContain(l.speaker);
  });
  it('resolveScript：內建腳本直接回傳；未知 id 回傳 null', () => {
    expect(resolveScript('prologue', 1)?.id).toBe('prologue');
    expect(resolveScript('nope', 1)).toBeNull();
    expect(resolveScript('legend-1', 1)).toBeNull();
  });
  it('legend-* 交由已註冊的 resolver 解析（契約 10.8）', () => {
    registerScriptResolver((id, seed) => ({ id, lines: [{ speaker: 'narrator', text: `seed ${seed}` }] }));
    expect(resolveScript('legend-1', 7)!.lines[0].text).toBe('seed 7');
  });
});
