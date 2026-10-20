import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { LocationScene, sceneKey } from './LocationScene';
import { TERRAIN_SCENES, WEATHER_OVERLAYS, HANDMADE_SCENES } from './terrains';
import { LANDMARK_ART } from '../landmarks';
import { LANDMARKS } from '../../content/locations';

const snap = { kind: 'generated' as const, generatorVersion: 1, name: '會唱歌的竹林', terrain: 'bamboo' as const,
  layout: 1 as const, weather: 'fog' as const, landmarkId: 'lm-treehouse', resident: 'passerby' as const, quirkId: 'q01', requires: null };
const hotspots = [
  { id: 'treasure', x: 60, y: 120, role: 'treasure' as const, reward: { kind: 'starSand' as const, amount: 5 } },
  { id: 'f0', x: 300, y: 380, role: 'filler' as const },
];

describe('scene art coverage', () => {
  it('has 12 terrain scenes, 5 weather overlays and 12 landmark components', () => {
    expect(Object.keys(TERRAIN_SCENES)).toHaveLength(12);
    expect(Object.keys(WEATHER_OVERLAYS)).toHaveLength(5);
    for (const l of LANDMARKS) expect(LANDMARK_ART[l.id]).toBeDefined();
  });
  it('has a distinct scene for each handmade location', () => {
    expect(Object.keys(HANDMADE_SCENES).sort()).toEqual(['bamboo-path', 'cloud-post', 'shell-bay']);
  });
  it('sceneKey maps generated snapshots to terrain-layout and handmade to terrain-0', () => {
    expect(sceneKey(snap)).toBe('bamboo-1');
    expect(sceneKey({ kind: 'handmade', handmadeId: 'bamboo-path' })).toBe('bamboo-0');
  });
});

describe('LocationScene', () => {
  it('renders one hotspot button per hotspot with a 44px target', () => {
    const { container } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={() => {}} tapped={[]} />);
    const btns = container.querySelectorAll('[data-testid^="hotspot-"]');
    expect(btns).toHaveLength(2);
    btns.forEach(b => {
      expect(parseInt((b as HTMLElement).style.width)).toBeGreaterThanOrEqual(44);
      expect(parseInt((b as HTMLElement).style.height)).toBeGreaterThanOrEqual(44);
    });
  });
  it('calls onTap with the hotspot id and marks tapped hotspots', () => {
    const onTap = vi.fn();
    const { getByTestId } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={onTap} tapped={['f0']} />);
    fireEvent.click(getByTestId('hotspot-treasure'));
    expect(onTap).toHaveBeenCalledWith('treasure');
    expect(getByTestId('hotspot-f0').getAttribute('data-done')).toBe('true');
  });
  it('the scene wrapper disables browser touch panning (touch-action none)', () => {
    const { container } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={() => {}} tapped={[]} />);
    expect((container.firstElementChild as HTMLElement).style.touchAction).toBe('none');
  });
  it('locks the wrapper to 3/4 and the art to xMidYMid meet with viewBox 360x480', () => {
    const { container } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={() => {}} tapped={[]} />);
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe('3 / 4');
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 360 480');
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  });
  it('places hotspots by percentage of the 360x480 scene', () => {
    const { getByTestId } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={() => {}} tapped={[]} />);
    expect(parseFloat((getByTestId('hotspot-f0') as HTMLElement).style.left)).toBeCloseTo(83.333, 2);
    expect(parseFloat((getByTestId('hotspot-f0') as HTMLElement).style.top)).toBeCloseTo(79.167, 2);
  });
});
