import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { recordLegend } from './legendRecord';
import { idbGet } from '../../platform/idb';

describe('recordLegend', () => {
  it('writes one kind legend record per legend id, overwriting on repeat', async () => {
    await recordLegend(42, 20, 1000);
    await recordLegend(42, 20, 2000);
    const rec: any = await idbGet('photos', 'legend-20');
    expect(rec.kind).toBe('legend');
    expect(rec.createdAt).toBe(2000);
    expect(typeof rec.text).toBe('string');
    expect(rec.blob).toBeUndefined();
    expect(rec.bytes).toBeUndefined();
  });
});
