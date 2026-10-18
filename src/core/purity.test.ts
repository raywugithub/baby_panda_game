import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p) ? [p] : [];
  });
}

// 每個目錄只掃描一次（UI、panda 目錄尚未建立時略過）
const coreFiles = files('src/core');
const uiFiles = files('src/ui');
const pandaFiles = files('src/panda');
const platformFiles = files('src/platform');

describe('時間與亂數規則（契約 10.15）', () => {
  it('core 不呼叫 Date.now、Math.random 或 new Date()', () => {
    for (const f of coreFiles) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/Date\.now\(|Math\.random\(|new Date\(\)/);
    }
  });
  it('ui、panda、platform 只能透過 platform/clock.ts 取得時間，且全專案不用 Math.random', () => {
    for (const f of [...uiFiles, ...pandaFiles, ...platformFiles]) {
      if (f.endsWith('clock.ts')) continue;
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/Math\.random\(/);
      expect(src, f).not.toMatch(/Date\.now\(|new Date\(\)/);
    }
  });
});
