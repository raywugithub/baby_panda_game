import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { MapScreen } from './MapScreen';
import { game } from '../store';
import { fresh } from '../../core/test-helpers';
import * as nav from '../nav';

describe('MapScreen', () => {
  it('uses pan-y touch action on the scroll container (iPhone vertical scroll)', () => {
    game.value = fresh();
    const { container } = render(<MapScreen />);
    const scroller = container.querySelector('[data-testid="map-scroll"]') as HTMLElement;
    expect(scroller.style.touchAction).toBe('pan-y');
  });

  it('every node button is at least 44px', () => {
    game.value = fresh();
    const { container } = render(<MapScreen />);
    container.querySelectorAll('[data-testid^="map-node-"]').forEach(b => {
      expect(parseInt((b as HTMLElement).style.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  it('shows a lock with the ability icon for a climb-gated node and does not open it', () => {
    const s = fresh();
    const gated = { ...s.map.nodes[0], id: 70, parentId: 1, seed: 70, status: 'open' as const,
      snapshot: { kind: 'generated' as const, generatorVersion: 1, name: '會唱歌的竹林', terrain: 'bamboo' as const,
        layout: 0 as const, weather: 'sunny' as const, landmarkId: 'lm-cabin', resident: 'passerby' as const, quirkId: 'q01', requires: 'climb' as const } };
    game.value = { ...s, map: { ...s.map, nodes: [...s.map.nodes, gated] } };
    const open = vi.spyOn(nav, 'openOverlay');
    const { getByTestId } = render(<MapScreen />);
    const btn = getByTestId('map-node-70');
    expect(btn.textContent).toContain('🔒');
    expect(btn.textContent).toContain('🌳');
    fireEvent.click(btn);
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the location overlay for an enterable node and shows a stamp for a done node', () => {
    const s = fresh();
    const done = { ...s.map.nodes[0], status: 'done' as const, secretFound: true, lastCompletedDate: '2026-10-17' };
    game.value = { ...s, map: { ...s.map, nodes: [done] } };
    const open = vi.spyOn(nav, 'openOverlay');
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('stamp-1').textContent).toContain('★');
    fireEvent.click(getByTestId('map-node-1'));
    expect(open).toHaveBeenCalledWith({ kind: 'location', nodeId: 1 });
    open.mockRestore();
  });
});
