import { describe, it, expect } from 'vitest';
import { rowScale, cellRect, pixelToCell } from './perspective';
describe('2.5D floor perspective', () => {
  it('row scale runs linearly 0.80 (back) to 1.00 (front)', () => {
    expect(rowScale(0)).toBeCloseTo(0.8, 10);
    expect(rowScale(5)).toBeCloseTo(1.0, 10);
    expect(rowScale(1)).toBeCloseTo(0.84, 10);
    expect(rowScale(3)).toBeCloseTo(0.92, 10);
  });
  it('back cells are narrower; front cells are full width and centred on x = 200', () => {
    const back = cellRect(0, 0);
    expect(back.w).toBeCloseTo(40, 6);
    expect(back.x).toBeCloseTo(40, 6);
    expect(back.y).toBe(80);
    expect(cellRect(0, 5)).toEqual({ x: 0, y: 280, w: 50, h: 40 });
  });
  it('pixelToCell inverts the projection and rejects points outside the floor', () => {
    expect(pixelToCell(200, 280)).toEqual({ x: 4, y: 5 });  // front row, centre
    expect(pixelToCell(161, 80)).toEqual({ x: 3, y: 0 });   // back row: floor((161 − 40) / 40) = 3
    expect(pixelToCell(10, 80)).toBeNull();                 // left of the back row
    expect(pixelToCell(200, 60)).toBeNull();                // wall band
  });
});
