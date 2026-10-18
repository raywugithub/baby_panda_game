import { it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { RoomView } from './RoomView';
import { createInitialState } from '../../core/state';

it('renders each placed item in a group with its uid, sorted back to front', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-bed#1', itemId: 'furn-bed', layer: 'floor' as const, x: 0, y: 4, flipped: false },
    { uid: 'furn-plant-pot#1', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 0, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} />);
  const uids = [...container.querySelectorAll('[data-uid]')].map((el) => el.getAttribute('data-uid'));
  expect(uids).toEqual(['furn-plant-pot#1', 'furn-bed#1']);
  expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 400 320');
  expect(container.querySelector('[data-testid="placed-furn-plant-pot#1"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-testid^="room-cell-"]').length).toBe(48);
});
