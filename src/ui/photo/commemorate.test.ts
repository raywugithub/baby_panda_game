import { it, expect, vi } from 'vitest';
import { commemorate } from './commemorate';
import * as photos from '../../platform/photos';
import * as serialize from './serialize';

it('saves a commemorative photo with the stage id', async () => {
  vi.spyOn(serialize, 'photoToBlob').mockResolvedValue(new Blob(['png']));
  const save = vi.spyOn(photos, 'savePhoto').mockResolvedValue('ok');
  await commemorate(2);
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: 'stage-2', kind: 'commemorative', title: '第 2 階' }));
});

it('swallows errors so a stage-up never fails', async () => {
  vi.spyOn(serialize, 'photoToBlob').mockRejectedValue(new Error('boom'));
  await expect(commemorate(3)).resolves.toBeUndefined();
});
