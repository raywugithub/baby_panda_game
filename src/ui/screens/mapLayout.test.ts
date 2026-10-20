import { describe, it, expect } from 'vitest';
import { nodePositions } from './mapLayout';
import { fresh } from '../../core/test-helpers';

describe('nodePositions', () => {
  it('stacks deeper nodes higher and keeps x inside the 390px gutter (width 358)', () => {
    const nodes = [...fresh().map.nodes];
    const pos = nodePositions(nodes, 358);
    expect(pos).toHaveLength(nodes.length);
    for (const p of pos) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(358);
    }
    expect(pos[0].depth).toBe(0);
    expect(pos[0].y).toBe(0);
    expect(Object.is(pos[0].y, -0)).toBe(false);
  });

  it('same-depth nodes never overlap (44px targets), up to 9 at one depth', () => {
    const base = fresh().map.nodes[0];
    const kids = Array.from({ length: 9 }, (_, i) => ({ ...base, id: 100 + i, parentId: base.id, seed: 1000 + i * 37 }));
    const pos = nodePositions([base, ...kids], 358);
    for (let a = 0; a < pos.length; a++) {
      for (let b = a + 1; b < pos.length; b++) {
        const overlap = Math.abs(pos[a].x - pos[b].x) < 44 && Math.abs(pos[a].y - pos[b].y) < 44;
        expect(overlap).toBe(false);
      }
    }
  });

  it('uses at most two columns per row and returns positions in input order', () => {
    const base = fresh().map.nodes[0];
    const kids = Array.from({ length: 5 }, (_, i) => ({ ...base, id: 200 + i, parentId: base.id, seed: 500 + i * 13 }));
    const input = [...kids.reverse(), base];
    const pos = nodePositions(input, 358);
    expect(pos.map(p => p.id)).toEqual(input.map(n => n.id));
    const rows = new Set(pos.filter(p => p.depth === 1).map(p => p.y));
    expect(rows.size).toBe(3);
    for (const y of rows) {
      expect(pos.filter(p => p.depth === 1 && p.y === y).length).toBeLessThanOrEqual(2);
    }
  });

  it('is deterministic for the same nodes', () => {
    const nodes = [...fresh().map.nodes];
    expect(nodePositions(nodes, 358)).toEqual(nodePositions(nodes, 358));
  });
});
