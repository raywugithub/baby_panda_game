import { it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/preact';
import { PhotoOverlay } from './PhotoOverlay';
import * as photos from '../../platform/photos';
import * as serialize from './serialize';

beforeEach(() => {
  vi.spyOn(serialize, 'photoToBlob').mockResolvedValue(new Blob(['png']));
});

it('offers six poses, 24 stickers and six frames plus none', () => {
  const { container, getAllByRole } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  expect(container.querySelectorAll('[data-role="pose"]').length).toBe(6);
  expect(container.querySelectorAll('[data-role="sticker"]').length).toBe(24);
  expect(container.querySelectorAll('[data-role="frame"]').length).toBe(7);
});

it('saves a photo into the album on 拍照', async () => {
  const save = vi.spyOn(photos, 'savePhoto').mockResolvedValue('ok');
  const { getByText, findByText } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  fireEvent.click(getByText('拍照'));
  await findByText('已存進相簿');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ kind: 'photo' }));
});

it('shows the delete prompt when the album is full', async () => {
  vi.spyOn(photos, 'savePhoto').mockResolvedValue('full');
  const { getByText, findByText } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  fireEvent.click(getByText('拍照'));
  await findByText(/相簿滿了（200 張）/);
});

it('location photo uses the LocationBackdrop once Plan B provides it', () => {
  const { container } = render(<PhotoOverlay overlay={{ kind: 'photo', context: { nodeId: 3 } }} />);
  expect(container.querySelector('[data-testid="location-backdrop"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="photo-backdrop-plain"]')).toBeNull();
});

it('has no save-to-phone, download or share control', () => {
  const { container } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  const text = container.textContent ?? '';
  expect(/下載|分享|存到手機/.test(text)).toBe(false);
});
